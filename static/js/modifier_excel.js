
document.addEventListener("DOMContentLoaded", function () {
    let colonnes = {{ colonnes_disponibles| safe
}};
const categorieSelectionnee = "{{ categorie_colonne }}";
let seriesData = {{ series_data| safe }};
let excelRows = {{ excel_rows| safe }};
let defaultCategories = {{ categorie_sample| safe }};

const titreInput = document.getElementById("id_titre");
const typeSelect = document.getElementById("id_type");
const titreXInput = document.getElementById("titre-x");
const titreYInput = document.getElementById("titre-y");

function renderColumnCheckboxes() {
    const container = document.getElementById("colonnes-container");
    container.innerHTML = `
      <h4>Colonne des catégories :</h4>
      ${colonnes.map(col => `
        <label><input type="radio" name="categorie" value="${col}" ${col === categorieSelectionnee ? 'checked' : ''}> ${col}</label><br>
      `).join('')}

      <h4>Colonnes des séries :</h4>
      <p id="pie-warning" style="display:none; color:red; font-style: italic;margin:10px 0px;">
        Pour un camembert, une seule série est autorisée.
      </p>

      ${colonnes.map(col => {
        const existingSerie = seriesData.find(s => s.nom === col);
        const defaultColor = existingSerie?.couleur || `hsl(${(colonnes.indexOf(col) * 60) % 360}, 70%, 60%)`;

        return `
          <label>
            <input type="checkbox" class="serie-checkbox" value="${col}" ${existingSerie ? 'checked' : ''}>
            ${col}
            <input type="color" class="serie-color" data-nom="${col}" value="${defaultColor}">
          </label><br>
        `;
    }).join('')}
    `;

    document.querySelectorAll(".serie-checkbox").forEach(cb => {
        cb.addEventListener("change", updatePreview);
    });

    document.querySelectorAll('input[name="categorie"]').forEach(input => {
        input.addEventListener('change', updatePreview);
    });

    // ✅ Rafraîchir le graphique lorsqu’on change la couleur
    document.querySelectorAll(".serie-color").forEach(input => {
        input.addEventListener("input", updatePreview);
    });

    applyPieBehavior();
}

function applyPieBehavior() {
    const type = typeSelect.value;
    const checkboxes = document.querySelectorAll('.serie-checkbox');
    const warning = document.getElementById("pie-warning");
    /****************************************************************/
    const colorPickers = document.querySelectorAll('.serie-color');
    /*****************************************************************/

    if (type === "pie") {
        warning.style.display = "block";
        /*************************************************************/
        colorPickers.forEach(el => el.classList.add("hidden-color"));
        /**************************************************************/
        const checked = Array.from(checkboxes).filter(cb => cb.checked);
        if (checked.length > 1) {
            checked.forEach((cb, index) => {
                cb.checked = index === 0;
            });
        }
        checkboxes.forEach(cb => {
            cb.onclick = function () {
                if (this.checked) {
                    checkboxes.forEach(other => {
                        if (other !== this) other.checked = false;
                    });
                }
                updatePreview();
            };
        });
    } else {
        warning.style.display = "none";
        /********************************************************************/
        colorPickers.forEach(el => el.classList.remove("hidden-color"));
        /********************************************************************/
        checkboxes.forEach(cb => {
            cb.onclick = () => updatePreview();
        });
    }
}

function updatePreview() {
    const chartType = typeSelect.value;
    const titre = titreInput.value;
    const titreX = titreXInput.value;
    const titreY = titreYInput.value;

    const selectedCategorie = document.querySelector('input[name="categorie"]:checked');
    let updatedLabels = defaultCategories;
    if (selectedCategorie) {
        const selectedName = selectedCategorie.value;
        document.getElementById("categorie-selectionnee").value = selectedName;
        updatedLabels = excelRows.map(row => row[selectedName]);
    }

    const activeSeries = Array.from(document.querySelectorAll(".serie-checkbox:checked")).map(cb => {
        const colName = cb.value;
        const colorInput = document.querySelector(`.serie-color[data-nom="${colName}"]`);
        const color = colorInput ? colorInput.value : "#3e95cd";
        return {
            nom: colName,
            categories: updatedLabels,
            valeurs: excelRows.map(row => row[colName]),
            couleur: color,
            couleurs_camembert: excelRows.map((_, i) => `hsl(${(i * 50) % 360}, 70%, 60%)`)
        };
    });

    if (chartType === 'pie' && activeSeries.length > 1) {
        activeSeries.splice(1);
    }

    if (window.previewChart) window.previewChart.destroy();

    window.previewChart = new Chart(document.getElementById("preview-chart"), {
        type: chartType,
        data: {
            labels: updatedLabels,
            datasets: activeSeries.map(serie => ({
                label: serie.nom,
                data: serie.valeurs,
                backgroundColor: chartType === "pie" ? serie.couleurs_camembert : serie.couleur,
                borderColor: chartType === "pie" ? [] : "#333",
                borderWidth: 1
            }))
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" },
                title: { display: true, text: titre }
            },
            scales: chartType !== "pie" ? {
                x: { title: { display: true, text: titreX } },
                y: { title: { display: true, text: titreY } }
            } : {}
        }
    });

    document.getElementById("series-data-json").value = JSON.stringify(activeSeries);
}

document.getElementById("excel-file").addEventListener("change", function () {
    const form = document.getElementById("excel-upload-form");
    const formData = new FormData(form);

    fetch("", {
        method: "POST",
        headers: {
            "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                colonnes = data.columns;
                renderColumnCheckboxes();
                updatePreview();
            } else {
                alert("Erreur: " + data.message);
            }
        });
});

[titreInput, titreXInput, titreYInput, typeSelect].forEach(el => {
    el.addEventListener("input", updatePreview);
    el.addEventListener("change", () => {
        updatePreview();
        applyPieBehavior();
    });
});

renderColumnCheckboxes();
updatePreview();
});