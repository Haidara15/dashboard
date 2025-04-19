from django.shortcuts import render


# views.py

from django.shortcuts import render
from .models import Thematique

def home(request):
    thematiques = Thematique.objects.prefetch_related('sous_thematiques').all()
    return render(request, 'analytics/home.html', {'thematiques': thematiques})


# analytics/views.py

from django.shortcuts import render, get_object_or_404
from .models import SousThematique

def dashboard(request, slug):
    sous_thematique = get_object_or_404(SousThematique, slug=slug)
    graphiques = sous_thematique.graphiques.prefetch_related('series').all()  # ⬅️ Important
    
    return render(request, 'analytics/dashboard.html', {
        'sous_thematique': sous_thematique,
        'graphiques': graphiques
    })


from django.shortcuts import render, get_object_or_404, redirect
from .models import Graphique, SerieDonnee, SousThematique
from .forms import GraphiqueForm
import json


from django.shortcuts import render, get_object_or_404, redirect
from .models import Graphique, SerieDonnee, SousThematique
from .forms import GraphiqueForm
import json

from django.shortcuts import render, get_object_or_404, redirect
from .models import Graphique, SerieDonnee, SousThematique
from .forms import GraphiqueForm
import json

def ajouter_graphique(request, slug):
    # 🔎 Récupère la sous-thématique via le slug (ou 404 si introuvable)
    sous_thematique = get_object_or_404(SousThematique, slug=slug)

    if request.method == 'POST':
        # 🧾 Récupère le formulaire rempli
        graph_form = GraphiqueForm(request.POST)

        # 🧠 Récupère les séries depuis le champ caché "series_data" (JSON)
        raw_series_data = request.POST.get('series_data', '[]')

        print("📨 CHAMP series_data BRUT:", raw_series_data)

        try:
            # ✅ Sécurise le chargement JSON (évite les erreurs si vide)
            series_data = json.loads(raw_series_data) if raw_series_data.strip() else []
        except json.JSONDecodeError:
            series_data = []

        # ✅ Vérifie que le formulaire du graphique est valide
        if graph_form.is_valid():
            # 📌 Enregistre l'objet sans commit pour ajouter la sous-thématique
            graphique = graph_form.save(commit=False)
            graphique.sous_thematique = sous_thematique
            graphique.save()

            # 🔁 Enregistre chaque série liée au graphique
            for serie in series_data:
                print("🔍 Données série reçue :", serie)
                SerieDonnee.objects.create(
                    graphique=graphique,
                    nom=serie['nom'],
                    categories=serie['categories'],
                    valeurs=serie['valeurs'],
                    couleur=serie.get('couleur', '#3e95cd'),  # ✅ ici on récupère la bonne couleur
                    couleurs_camembert = serie.get('couleurs_camembert') 

                )

            # ✅ Redirige vers le dashboard de la sous-thématique après enregistrement
            return redirect('dashboard', slug=sous_thematique.slug)

    else:
        # 📄 Si GET : affiche un formulaire vide avec valeurs initiales si souhaité
        graph_form = GraphiqueForm(initial={
            'titre': 'Évolution trimestrielle',
            'type': 'bar',
            'description': 'Comparaison des indicateurs par trimestre'
        })

    # 📤 Affiche le template avec le formulaire et la sous-thématique
    return render(request, 'analytics/ajouter_graphique.html', {
        'graph_form': graph_form,
        'sous_thematique': sous_thematique,
    })




### Modifier un graphique #############

from django.shortcuts import render, get_object_or_404, redirect
from .models import Graphique, SerieDonnee, SousThematique
from .forms import GraphiqueForm
import json


def modifier_graphique(request, graph_id):
    graphique = get_object_or_404(Graphique, pk=graph_id)
    sous_thematique = graphique.sous_thematique
    series_existantes = graphique.series.all()

    if request.method == 'POST':
        graph_form = GraphiqueForm(request.POST, instance=graphique)
        raw_series_data = request.POST.get('series_data', '[]')

        try:
            series_data = json.loads(raw_series_data) if raw_series_data.strip() else []
        except json.JSONDecodeError:
            series_data = []

        if graph_form.is_valid():
            graphique = graph_form.save(commit=False)

            # ✅ On ajoute les titres d’axes à la main
            graphique.titre_abscisse = request.POST.get("titre-x", "")
            graphique.titre_ordonnée = request.POST.get("titre-y", "")
            graphique.save()

            # 🔁 Supprimer anciennes séries + ajouter les nouvelles
            graphique.series.all().delete()
            
            for serie in series_data:
                SerieDonnee.objects.create(
                    graphique=graphique,
                    nom=serie['nom'],
                    categories=serie['categories'],
                    valeurs=serie['valeurs'],
                    couleur=serie.get('couleur', '#3e95cd'),
                    couleurs_camembert = serie.get('couleurs_camembert') 

                )

            return redirect('dashboard', slug=sous_thematique.slug)
    else:
        graph_form = GraphiqueForm(instance=graphique)

    return render(request, 'analytics/modifier_graphique.html', {
        'graph_form': graph_form,
        'sous_thematique': sous_thematique,
        'graphique': graphique,
        'series': series_existantes,
    })



########### Supprimer un graphique #########

from django.shortcuts import get_object_or_404, redirect
from .models import Graphique

def supprimer_graphique(request, pk):
    graphique = get_object_or_404(Graphique, pk=pk)
    sous_thematique = graphique.sous_thematique

    if request.method == "POST":
        graphique.delete()
        return redirect('dashboard', slug=sous_thematique.slug)

    # Dans notre cas, on ne gère jamais GET car c’est déclenché via modale
    return redirect('dashboard', slug=sous_thematique.slug)


