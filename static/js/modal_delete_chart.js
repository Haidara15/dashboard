function openDeleteModal(graphId, graphTitle) {
    const modal = document.getElementById("delete-modal");
    const form = document.getElementById("delete-form");
    const text = document.getElementById("modal-text");

    text.innerHTML = `Voulez-vous vraiment supprimer le graphique <strong>${graphTitle}</strong> ?`;
    form.action = `/graphique/${graphId}/supprimer/`;

    modal.classList.add("show");
}

function closeDeleteModal() {
    const modal = document.getElementById("delete-modal");
    modal.classList.remove("show");
}
