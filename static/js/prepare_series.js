/**
 * Fonction appelée lors de la soumission du formulaire.
 * Elle collecte toutes les séries de données saisies par l'utilisateur,
 * les formate en JSON, les injecte dans le champ caché `series_data`,
 * puis soumet le formulaire avec les données correctement préparées.
 */
function prepareSeriesData(e) {
    e.preventDefault(); // ⛔️ Empêche la soumission auto

    // ✅ Récupération des catégories
    const categoriesInput = document.getElementById("categories-global").value.trim();
    const categories = categoriesInput.split(',').map(c => c.trim()).filter(c => c.length > 0);

    // 🎯 Type de graphique (important pour les couleurs)
    const chartType = document.getElementById("id_type")?.value;

    // 🧺 Tableau final
    const series = [];

    // 🔁 Pour chaque bloc série
    document.querySelectorAll('.serie-block').forEach((block, index) => {
        const nom = block.querySelector('.serie-nom').value.trim();
        const valeurs = block.querySelector('.serie-valeurs').value
            .split(',').map(v => parseFloat(v.trim()));
        const couleur = block.querySelector('.serie-couleur')?.value || "#3e95cd";

        // ✅ Validation de base
        if (nom && valeurs.length === categories.length) {
            const serie = {
                nom: nom,
                categories: categories,
                valeurs: valeurs
            };

            // 🎨 Couleurs
            if (chartType === "pie") {
                // Camembert → couleurs multiples
                serie["couleurs"] = valeurs.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]);
            } else {
                // Autres types → une couleur unique
                serie["couleur"] = couleur;
            }

            series.push(serie);
        }
    });

    // ⛔️ Vérifie qu'au moins une série est valide
    if (series.length === 0) {
        alert("Veuillez ajouter au moins une série de données complète.");
        return;
    }

    // 📦 Injection dans champ caché
    document.getElementById("series-data-json").value = JSON.stringify(series);

    // 🔍 Debug
    console.log("✅ Données préparées :", series);

    // ✅ Soumission
    e.target.submit();
}

// 🎨 Palette camembert
const PIE_COLORS = [
    "#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9",
    "#c45850", "#f39c12", "#2ecc71", "#e74c3c", "#3498db", "#9b59b6"
];
