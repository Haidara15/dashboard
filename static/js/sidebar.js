document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    const layout = document.getElementById('layout');
  
    toggleBtn.addEventListener('click', () => {
      const isHidden = sidebar.classList.toggle('hidden');
      layout.classList.toggle('sidebar-hidden', isHidden);
  
      setTimeout(() => {
        if (window.previewChart) {
          window.previewChart.resize();
        }
      }, 320); // attendre que le DOM se stabilise
    });
  });
  