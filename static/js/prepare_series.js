/**
 * Fonction appelée lors de la soumission du formulaire.
 * Elle collecte toutes les séries de données saisies par l'utilisateur,
 * les formate en JSON, les injecte dans le champ caché `series_data`,
 * puis soumet le formulaire avec les données correctement préparées.
 */
function prepareSeriesData(e) {
    e.preventDefault();

    const chartType = document.getElementById("id_type").value;

    const categoriesInput = document.getElementById("categories-global").value.trim();
    const categories = categoriesInput.split(',').map(c => c.trim()).filter(c => c.length > 0);

    const series = [];

    document.querySelectorAll('.serie-block').forEach((block, index) => {
        const nom = block.querySelector('.serie-nom').value.trim();
        const valeurs = block.querySelector('.serie-valeurs').value
            .split(',').map(v => parseFloat(v.trim()));

        const couleur = block.querySelector('.serie-couleur')?.value || "#3e95cd";

        if (nom && valeurs.length === categories.length) {
            const serie = {
                nom: nom,
                categories: categories,
                valeurs: valeurs,
                couleur: couleur, // pour bar / line
            };

            // 🎨 Si camembert, on génère plusieurs couleurs
            if (chartType === "pie") {
                serie.couleurs_camembert = getPieColors(valeurs.length);
            }

            series.push(serie);
        }
    });

    if (series.length === 0) {
        alert("Veuillez ajouter au moins une série de données complète.");
        return;
    }

    console.log("✅ Séries à enregistrer :", series);
    document.getElementById("series-data-json").value = JSON.stringify(series);
    e.target.submit();
}

// 🎨 Palette de base pour camemberts
const PIE_COLORS = [
    "#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9",
    "#c45850", "#f39c12", "#2ecc71", "#e74c3c",
    "#3498db", "#9b59b6"
];

// 🔁 Génére une palette adaptée à la taille des données
function getPieColors(count) {
    const colors = [];
    while (colors.length < count) {
        colors.push(...PIE_COLORS);
    }
    return colors.slice(0, count);
}
