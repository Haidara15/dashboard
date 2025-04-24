document.addEventListener('DOMContentLoaded', function () {
    // Initialisation de GridStack
    const grid = GridStack.init({
      cellHeight: 100,
      margin: 10,
      draggable: {
        handle: '.grid-stack-item-content'
      },
      resizable: {
        handles: 'all'
      }
    });
  
    console.log("✅ GridStack initialisé");
  
    /**
     * 🔧 Redimensionne proprement un canvas Chart.js
     * Cela évite le flou dû au redimensionnement CSS seul
     */
    function resizeChartCanvas(chart) {
      if (!chart || !chart.canvas || !chart.canvas.parentNode) return;
      const canvas = chart.canvas;
      const container = canvas.parentNode;
  
      const width = container.clientWidth;
      const height = container.clientHeight;
  
      canvas.width = width;
      canvas.height = height;
  
      chart.resize();
    }
  
    /**
     * 🔄 Après chaque resize ou drag, on redimensionne les graphiques
     */
    function resizeAllCharts() {
      Chart.helpers.each(Chart.instances, function (chart) {
        resizeChartCanvas(chart);
      });
    }
  
    // 🔁 Sur chaque changement : mise à jour + resize
    grid.on('change', function (event, items) {
      const data = items.map(item => ({
        id: item.el.dataset.graphId,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h
      }));
  
      // Sauvegarde en base via une vue Django API
      fetch('/api/update_positions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify({ items: data })
      })
      .then(res => res.json())
      .then(() => {
        console.log('📦 Positions sauvegardées');
      })
      .catch(err => {
        console.error('❌ Erreur de sauvegarde :', err);
      });
  
      // 🔄 Mise à jour des tailles de canvas
      setTimeout(resizeAllCharts, 100);
    });
  
    // 🖱️ Événement spécifique sur fin de redimensionnement
    grid.on('resizestop', function (event, el) {
      const canvas = el.querySelector('canvas');
      if (canvas && canvas.id && window[canvas.id]) {
        resizeChartCanvas(window[canvas.id]);
      }
    });
  
    // 🧩 Optionnel : premier ajustement au chargement
    setTimeout(resizeAllCharts, 300);
  });
  