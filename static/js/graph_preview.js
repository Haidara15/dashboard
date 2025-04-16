let chartInstance = null;

function updateChartPreview() {
    const chartType = document.getElementById("id_type").value;
    const chartTitle = document.getElementById("id_titre") ? document.getElementById("id_titre").value : "Aperçu du graphique";
    const titreX = document.getElementById("titre-x").value;
    const titreY = document.getElementById("titre-y").value;
    const categories = document.getElementById("categories-global").value
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

    const datasets = [];

    const colors = ['#3e95cd', '#8e5ea2', '#3cba9f', '#e8c3b9', '#c45850'];

    document.querySelectorAll('.serie-block').forEach((block, index) => {
        const nom = block.querySelector('.serie-nom').value.trim();
        const valeurs = block.querySelector('.serie-valeurs').value
            .split(',')
            .map(v => parseFloat(v.trim()));

        if (nom && valeurs.length === categories.length) {
            datasets.push({
                label: nom,
                data: valeurs,
                backgroundColor: chartType === 'pie' ? colors.slice(0, valeurs.length) : colors[index % colors.length],
                borderColor: '#333',
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

document.addEventListener("input", function (e) {
    if (
        e.target.matches("#id_type, #id_titre, #titre-x, #titre-y, #categories-global") ||
        e.target.closest(".serie-block")
    ) {
        updateChartPreview();
    }
});

document.addEventListener("click", function (e) {
    if (e.target && (e.target.matches(".serie-valeurs") || e.target.textContent.includes("❌"))) {
        setTimeout(updateChartPreview, 100);
    }
});

document.addEventListener("DOMContentLoaded", updateChartPreview);
