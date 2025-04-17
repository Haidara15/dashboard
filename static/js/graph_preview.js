let chartInstance = null;

// 🎨 Couleurs par défaut pour les camemberts
const PIE_COLORS = [
    "#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9",
    "#c45850", "#f39c12", "#2ecc71", "#e74c3c", "#3498db", "#9b59b6"
];

// 📊 Met à jour le graphique dans le panneau de prévisualisation
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

    const datasets = [];
    const isPie = chartType === "pie" || chartType === "doughnut";

    document.querySelectorAll('.serie-block').forEach((block, index) => {
        const nom = block.querySelector('.serie-nom').value.trim();
        const valeurs = block.querySelector('.serie-valeurs').value
            .split(',').map(v => parseFloat(v.trim()));
        const couleur = block.querySelector('.serie-couleur')?.value || PIE_COLORS[index % PIE_COLORS.length];

        if (nom && valeurs.length === categories.length) {
            datasets.push({
                label: nom,
                data: valeurs,
                backgroundColor: isPie ? PIE_COLORS.slice(0, valeurs.length) : couleur,
                borderColor: "#333",
                borderWidth: 1
            });
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
            scales: !isPie ? {
                x: { title: { display: true, text: titreX } },
                y: { title: { display: true, text: titreY } }
            } : {}
        }
    });
}

// ➕ Ajoute une série dans le formulaire
window.addSerie = function () {
    const template = document.getElementById('serie-template');
    const clone = template.content.cloneNode(true);
    document.getElementById('series-container').appendChild(clone);

    updateAddSerieButtonVisibility();
    updateChartPreview();
};

// 🔁 Affiche ou masque le bouton "Ajouter une série"
function updateAddSerieButtonVisibility() {
    const type = document.getElementById("id_type").value;
    const seriesCount = document.querySelectorAll('.serie-block').length;
    const addBtn = document.getElementById("add-serie-btn");
    if (addBtn) {
        addBtn.style.display = (type === "pie" && seriesCount >= 1) ? "none" : "inline-block";
    }
}

// 🔄 Met à jour le graphique à chaque modification
document.addEventListener("input", function (e) {
    if (
        e.target.matches("#id_type, #id_titre, #titre-x, #titre-y, #categories-global") ||
        e.target.closest(".serie-block")
    ) {
        updateChartPreview();
        updateAddSerieButtonVisibility();
    }
});

// ❌ Mise à jour quand une série est supprimée
document.addEventListener("click", function (e) {
    if (e.target && e.target.textContent.includes("❌")) {
        setTimeout(() => {
            updateAddSerieButtonVisibility();
            updateChartPreview();
        }, 100);
    }
});

// 🚀 Lancement à la fin du chargement de la page
document.addEventListener("DOMContentLoaded", function () {
    const typeField = document.getElementById("id_type");

    // ⚠️ Si on change de type vers camembert et qu’il y a plusieurs séries → on garde une seule
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

        updateAddSerieButtonVisibility();
        updateChartPreview();
    });

    // ✅ Détection du mode : add ou edit
    const modeEl = document.getElementById("mode");
    const mode = modeEl ? modeEl.dataset.mode : "add";

    // ➕ En mode "add", on préremplit une série de test
    if (mode === "add") {
        setTimeout(() => {
            addSerie();
            const serie = document.querySelector('.serie-block');
            if (serie) {
                serie.querySelector('.serie-nom').value = "Indicateur A";
                serie.querySelector('.serie-valeurs').value = "100, 120, 140, 130";
                serie.querySelector('.serie-couleur').value = "#3e95cd";
                document.getElementById('categories-global').value = "T1, T2, T3, T4";
                updateChartPreview();
            }
        }, 100);
    } else {
        // 🖊 En mode édition : on ne touche pas aux séries déjà présentes
        updateChartPreview();
    }
});
