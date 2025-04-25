document.addEventListener("DOMContentLoaded", function () {
  let excelColumns = [];
  let selectedX = null;
  let selectedY = [];
  let excelRows = [];

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

  function updateSelection() {
    selectedX = document.querySelector('input[name="categorie"]:checked')?.value;
    selectedY = Array.from(document.querySelectorAll('.serie-checkbox:checked')).map(cb => cb.value);
    if (selectedX && selectedY.length > 0) {
      genererPreview();
    }
  }

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
            borderWidth: 1
          }))
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom" },
            title: { display: true, text: document.getElementById("id_titre").value || "Aperçu" }
          },
          scales: (chartType !== "pie" && chartType !== "doughnut") ? {
            x: { title: { display: true, text: document.getElementById("titre-x").value } },
            y: { title: { display: true, text: document.getElementById("titre-y").value } }
          } : {}
        }
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

  document.getElementById("id_type").addEventListener("change", () => {
    applyPieBehavior();
    updateSelection();
  });

  document.getElementById("id_titre").addEventListener("input", updateSelection);
  document.getElementById("titre-x").addEventListener("input", updateSelection);
  document.getElementById("titre-y").addEventListener("input", updateSelection);
});
