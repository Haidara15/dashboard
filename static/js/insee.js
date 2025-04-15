function toggleDropdown(dropdownId, button) {
    const dropdown = document.getElementById(dropdownId);
    const isOpen = dropdown.classList.contains('open');

    // Ferme tous les dropdowns et enlève "active" des boutons
    document.querySelectorAll('.dropdown').forEach(el => el.classList.remove('open'));
    document.querySelectorAll('.button').forEach(btn => btn.classList.remove('active'));

    if (!isOpen) {
        dropdown.classList.add('open');
        button.classList.add('active');
    }
}

// Fermer dropdowns si clic en dehors
document.addEventListener('click', function (e) {
    const isButton = e.target.closest('.button');
    const isDropdown = e.target.closest('.dropdown');
    if (!isButton && !isDropdown) {
        document.querySelectorAll('.dropdown').forEach(el => el.classList.remove('open'));
        document.querySelectorAll('.button').forEach(btn => btn.classList.remove('active'));
    }
});
