document.addEventListener("DOMContentLoaded", function () {
  let excelColumns = [];
  let selectedX = null;
  let selectedY = [];
  let excelRows = [];

  // ===============================
  // 🧩 Upload du fichier Excel
  // ===============================
  document.getElementById('excel-file').addEventListener('change', function () {
    const form = document.getElementById('excel-upload-form');
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
        excelColumns = data.columns;
        excelRows = data.rows;
        document.getElementById("colonnes-container").classList.remove("hidden");
        renderColumnCheckboxes();
        updateSelection();
      } else {
        alert("Erreur: " + data.message);
      }
    });
  });

  // ===============================
  // 🧩 Affichage dynamique des colonnes Excel
  // ===============================
  function renderColumnCheckboxes() {
    const container = document.getElementById("colonnes-container");
    container.innerHTML = `
      <h4>Colonne pour les catégories :</h4>
      ${excelColumns.map(col => `
        <label><input type="radio" name="categorie" value="${col}"> ${col}</label><br>
      `).join('')}

      <h4>Colonnes des séries :</h4>
      <p id="pie-warning" style="display:none; color: #888; font-style: italic;">
        Pour un camembert ou un doughnut, une seule série est autorisée.
      </p>
      ${excelColumns.map((col, index) => {
        const defaultColor = `hsl(${(index * 60) % 360}, 70%, 60%)`;
        return `
          <label>
            <input type="checkbox" class="serie-checkbox" value="${col}">
            ${col}
            <input type="color" class="serie-color" data-nom="${col}" value="${defaultColor}">
          </label><br>
        `;
      }).join('')}
    `;

    document.querySelectorAll('input[name="categorie"]').forEach(radio => {
      radio.addEventListener('change', updateSelection);
    });
    document.querySelectorAll('.serie-color').forEach(input => {
      input.addEventListener("input", updateSelection);
    });

    applyPieBehavior();
    updateSelection();
  }

  // ===============================
  // 🧩 Comportement spécifique Pie/Doughnut
  // ===============================
  function applyPieBehavior() {
    const type = document.getElementById("id_type").value;
    const checkboxes = document.querySelectorAll('.serie-checkbox');
    const warning = document.getElementById("pie-warning");
    const colorPickers = document.querySelectorAll('.serie-color');

    if (type === "pie" || type === "doughnut") {
      warning.style.display = "block";
      colorPickers.forEach(el => el.classList.add("hidden-color"));
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
          updateSelection();
        };
      });
    } else {
      warning.style.display = "none";
      colorPickers.forEach(el => el.classList.remove("hidden-color"));
      checkboxes.forEach(cb => {
        cb.onclick = () => updateSelection();
      });
    }
  }

  // ===============================
  // 🧩 Mettre à jour la sélection
  // ===============================
  function updateSelection() {
    selectedX = document.querySelector('input[name="categorie"]:checked')?.value;
    selectedY = Array.from(document.querySelectorAll('.serie-checkbox:checked')).map(cb => cb.value);

    const toggleSecondAxisContainer = document.getElementById('toggle-second-axis-container');
    if (toggleSecondAxisContainer) {
      if (selectedY.length > 1) {
        toggleSecondAxisContainer.style.display = "block";
      } else {
        toggleSecondAxisContainer.style.display = "none";
        document.getElementById("toggle-second-axis").checked = false;
      }
    }

    // 🎯 Mise à jour dynamique des options par série
    renderSeriesOptions();

    if (selectedX && selectedY.length > 0) {
      genererPreview();
    }
  }

  // ===============================
  // 🧩 Générer les options par série (Axe Gauche/Droite)
  // ===============================
  function renderSeriesOptions() {
    const container = document.getElementById('series-options-container');
    container.innerHTML = '';

    selectedY.forEach(serie => {
      const div = document.createElement('div');
      div.style.marginBottom = "5px";
      div.innerHTML = `
        <label><strong>${serie}</strong> - Axe :
          <select class="axis-choice" data-serie="${serie}">
            <option value="y">Gauche</option>
            <option value="y1">Droite</option>
          </select>
        </label>
      `;
      container.appendChild(div);
    });
  }

  // ===============================
  // 🎯 Générer l'aperçu Chart.js
  // ===============================
  function genererPreview() {
    const chartType = document.getElementById("id_type").value;

    const activeSeries = Array.from(document.querySelectorAll('.serie-checkbox:checked')).map(cb => {
      const colName = cb.value;
      const colorInput = document.querySelector(`.serie-color[data-nom="${colName}"]`);
      const color = colorInput ? colorInput.value : "#3e95cd";
      return {
        nom: colName,
        couleur: color
      };
    });

    fetch("/api/generer-graphique-preview/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value
      },
      body: JSON.stringify({
        categorie: selectedX,
        series: activeSeries
      })
    })
    .then(res => res.json())
    .then(data => {
      if (window.previewChart) window.previewChart.destroy();

      let series = data.series_data || [];
      if ((chartType === "pie" || chartType === "doughnut") && series.length > 1) {
        series = [series[0]];
      }

      const showLegend = document.getElementById("toggle-legend")?.checked ?? true;
      const showLabels = document.getElementById("toggle-labels")?.checked ?? true;
      const showPercent = document.getElementById("toggle-percent")?.checked ?? false;

      // 📋 Lecture des choix Axe Gauche/Droite
      const axisChoices = {};
      document.querySelectorAll('.axis-choice').forEach(select => {
        const serie = select.getAttribute('data-serie');
        const axis = select.value;
        axisChoices[serie] = axis;
      });

      window.previewChart = new Chart(document.getElementById("preview-chart"), {
        type: chartType,
        data: {
          labels: data.labels,
          datasets: series.map(serie => ({
            label: serie.nom,
            data: serie.valeurs,
            backgroundColor: (chartType === "pie" || chartType === "doughnut")
              ? data.labels.map((_, i) => `hsl(${(i * 360 / data.labels.length)}, 70%, 60%)`)
              : serie.couleur,
            borderColor: (chartType === "pie" || chartType === "doughnut") ? [] : "#333",
            borderWidth: 1,
            yAxisID: axisChoices[serie.nom] || 'y'
          }))
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: showLegend, position: "bottom" },
            title: { display: true, text: document.getElementById("id_titre").value || "Aperçu" },
            datalabels: {
              display: showLabels,
              formatter: function(value, context) {
                return showPercent ? value + '%' : value;
              },
              anchor: 'end',
              align: (chartType === "pie" || chartType === "doughnut") ? 'center' : 'top',
              color: (chartType === "pie" || chartType === "doughnut") ? '#fff' : '#000'
            }
          },
          scales: (chartType !== "pie" && chartType !== "doughnut") ? {
            x: { title: { display: true, text: document.getElementById("titre-x").value } },
            y: { title: { display: true, text: document.getElementById("titre-y").value }, beginAtZero: true },
            y1: { title: { display: true, text: 'Axe secondaire' }, position: 'right', grid: { drawOnChartArea: false } }
          } : {}
        },
        plugins: [ChartDataLabels]
      });

      document.getElementById("series-data-json").value = JSON.stringify(
        series.map(s => ({
          ...s,
          couleurs_camembert: (chartType === "pie" || chartType === "doughnut")
            ? data.labels.map((_, i) => `hsl(${(i * 360 / data.labels.length)}, 70%, 60%)`)
            : undefined
        }))
      );
    });
  }

  // ===============================
  // 📤 Validation formulaire
  // ===============================
  const formulaire = document.querySelector('form[action*="creer_graphique_excel"]');
  if (formulaire) {
    formulaire.addEventListener("submit", function (e) {
      const seriesField = document.getElementById("series-data-json");
      if (!seriesField.value || seriesField.value === "[]") {
        e.preventDefault();
        updateSelection();
        setTimeout(() => {
          if (!seriesField.value || seriesField.value === "[]") {
            alert("Veuillez sélectionner une catégorie et au moins une série.");
          } else {
            this.submit();
          }
        }, 300);
      }
    });
  }

  // 🧩 Mettre à jour preview si changement
  document.getElementById("id_type").addEventListener("change", () => {
    applyPieBehavior();
    updateSelection();
  });
  document.getElementById("id_titre").addEventListener("input", updateSelection);
  document.getElementById("titre-x").addEventListener("input", updateSelection);
  document.getElementById("titre-y").addEventListener("input", updateSelection);

  ["toggle-legend", "toggle-labels", "toggle-percent", "toggle-second-axis"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", updateSelection);
  });
});
