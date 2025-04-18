
let chartInstance = null;

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

    document.querySelectorAll('.serie-block').forEach((block) => {
        const nom = block.querySelector('.serie-nom').value.trim();
        const valeurs = block.querySelector('.serie-valeurs').value
            .split(',').map(v => parseFloat(v.trim()));
        const couleur = block.querySelector('.serie-couleur')?.value || "#3e95cd";

        if (nom && valeurs.length === categories.length) {
            datasets.push({
                label: nom,
                data: valeurs,
                backgroundColor: couleur,
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
            scales: chartType !== 'pie' ? {
                x: { title: { display: true, text: titreX } },
                y: { title: { display: true, text: titreY } }
            } : {}
        }
    });
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
