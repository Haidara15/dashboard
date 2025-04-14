function toggleDropdown(dropdownId, currentRowId, nextRowId) {
    var dropdown = document.getElementById(dropdownId);
    var currentRow = document.getElementById(currentRowId);
    var nextRow = document.getElementById(nextRowId);
    var isDropdownVisible = dropdown.style.display === "block";

    // Ferme tous les dropdowns
    document.querySelectorAll('.dropdown').forEach(el => el.style.display = "none");

    if (!isDropdownVisible) {
        dropdown.style.display = "block";
        var dropdownHeight = dropdown.offsetHeight;
        nextRow.style.marginTop = dropdownHeight + "px";
        window.scrollBy(0, dropdownHeight);
    } else {
        dropdown.style.display = "none";
        nextRow.style.marginTop = "0px";
        window.scrollBy(0, -dropdown.offsetHeight);
    }
}
