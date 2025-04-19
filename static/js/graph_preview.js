let chartInstance = null;

// 🎨 Palette pour camemberts
const PIE_COLORS = [
    "#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9",
    "#c45850", "#f39c12", "#2ecc71", "#e74c3c",
    "#3498db", "#9b59b6"
];

function getPieColors(count) {
    const colors = [];
    while (colors.length < count) {
        colors.push(...PIE_COLORS);
    }
    return colors.slice(0, count);
}

function updateChartPreview() {
    const chartType = document.getElementById("id_type").value;
    if (!chartType) {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        return;
    }

    const chartTitle = document.getElementById("id_titre")?.value || "Aperçu du graphique";
    const titreX = document.getElementById("titre-x")?.value || "";
    const titreY = document.getElementById("titre-y")?.value || "";

    const categories = document.getElementById("categories-global").value
        .split(',').map(c => c.trim()).filter(c => c.length > 0);

    const series = [];
    const datasets = [];

    document.querySelectorAll('.serie-block').forEach((block) => {
        const nom = block.querySelector('.serie-nom').value.trim();
        const valeurs = block.querySelector('.serie-valeurs').value
            .split(',').map(v => parseFloat(v.trim()));
        const couleur = block.querySelector('.serie-couleur')?.value || "#3e95cd";

        if (nom && valeurs.length === categories.length) {
            const couleursCamembert = chartType === "pie" ? getPieColors(valeurs.length) : null;

            datasets.push({
                label: nom,
                data: valeurs,
                backgroundColor: chartType === "pie" ? couleursCamembert : couleur,
                borderColor: chartType === "pie" ? [] : "#333",
                borderWidth: 1
            });

            const serie = {
                nom: nom,
                categories: categories,
                valeurs: valeurs,
                couleur: couleur
            };

            if (chartType === "pie") {
                serie.couleurs_camembert = couleursCamembert;
            }

            series.push(serie);
        }
    });

    const ctx = document.getElementById("preview-chart").getContext("2d");
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: chartType,
        data: {
            labels: categories,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: chartTitle }
            },
            scales: chartType !== 'pie' ? {
                x: { title: { display: true, text: titreX } },
                y: { title: { display: true, text: titreY } }
            } : {}
        }
    });

    document.getElementById("series-data-json").value = JSON.stringify(series);

    // ✅ Mise à jour de l’état du bouton Ajouter série
    toggleAddSerieButton();
}

// ✅ Gère l'affichage du bouton Ajouter une série
function toggleAddSerieButton() {
    const chartType = document.getElementById("id_type").value;
    const serieBlocks = document.querySelectorAll('.serie-block');
    const addBtn = document.getElementById("add-serie-btn");

    if (!addBtn) return;

    if (chartType === "pie" && serieBlocks.length >= 1) {
        addBtn.style.display = "none";
    } else {
        addBtn.style.display = "inline-block";
    }
}

window.addSerie = function () {
    const template = document.getElementById('serie-template');
    const clone = template.content.cloneNode(true);
    document.getElementById('series-container').appendChild(clone);
    updateChartPreview();
};

document.addEventListener("input", function (e) {
    if (
        e.target.matches("#id_type, #id_titre, #titre-x, #titre-y, #categories-global") ||
        e.target.closest(".serie-block")
    ) {
        updateChartPreview();
    }
});

document.addEventListener("click", function (e) {
    if (e.target && e.target.textContent.includes("❌")) {
        setTimeout(updateChartPreview, 100);
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const typeField = document.getElementById("id_type");

    typeField.addEventListener("change", function () {
        const warningDiv = document.getElementById("chart-warning");

        if (typeField.value === "pie") {
            const allSeries = document.querySelectorAll('.serie-block');
            if (allSeries.length > 1) {
                allSeries.forEach((block, index) => {
                    if (index > 0) block.remove();
                });

                if (warningDiv) {
                    warningDiv.style.display = "flex";
                }
            }
        }

        updateChartPreview();
    });

    updateChartPreview();
});
