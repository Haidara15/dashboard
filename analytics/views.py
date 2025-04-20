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


############### création du graphique via un fichier excel ################ 

from django.shortcuts import render, redirect
from django.http import JsonResponse
import pandas as pd


def importer_excel(request, slug):
    if request.method == 'POST' and request.FILES.get('excel_file'):
        excel_file = request.FILES['excel_file']
        try:
            df = pd.read_excel(excel_file)
            columns = df.columns.tolist()
            request.session['excel_data'] = df.to_json()
            return JsonResponse({'status': 'success', 'columns': columns})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})

    return render(request, 'analytics/importer_excel.html', {'slug': slug,'mode': 'creation'})






import json
import pandas as pd
from django.http import JsonResponse


def generer_graphique_preview(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        categorie_col = data.get('categorie')
        series_cols = data.get('series', [])
        graph_type = data.get("type", "bar")  # utile si tu veux traiter le type ici

        df_json = request.session.get('excel_data')
        if not df_json:
            return JsonResponse({"error": "Aucune donnée Excel en session."}, status=400)

        df = pd.read_json(StringIO(df_json))
        labels = df[categorie_col].astype(str).tolist()

        datasets = []
        colors = ["#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#f39c12", "#2ecc71"]

        series_data = []

        for i, col in enumerate(series_cols):
            valeurs = df[col].tolist()
            couleur = colors[i % len(colors)]

            datasets.append({
                "label": col,
                "data": valeurs,
                "backgroundColor": couleur
            })

            serie = {
                "nom": col,
                "categories": labels,
                "valeurs": valeurs,
                "couleur": couleur
            }

            if graph_type == "pie":
                serie["couleurs_camembert"] = [couleur] * len(valeurs)

            series_data.append(serie)

        return JsonResponse({
            "labels": labels,
            "datasets": datasets,
            "series_data": series_data
        })

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)




from io import StringIO
import json
import pandas as pd
from .models import Graphique, SerieDonnee, SousThematique

from django.shortcuts import get_object_or_404, redirect
import json
from .models import Graphique, SerieDonnee, SousThematique

def creer_graphique_excel(request, slug):
    if request.method == 'POST':
        try:
            series_data = json.loads(request.POST.get('series_data', '[]'))
        except json.JSONDecodeError:
            series_data = []

        print("📨 Données JSON reçues :", series_data)

        sous_thematique = get_object_or_404(SousThematique, slug=slug)

        graphique = Graphique.objects.create(
            titre=request.POST.get('titre', 'Graphique importé'),
            description=request.POST.get('description', ''),
            type=request.POST.get('type', 'bar'),
            titre_abscisse=request.POST.get("titre-x", ""),
            titre_ordonnée=request.POST.get("titre-y", ""),
            sous_thematique=sous_thematique
        )

        for serie in series_data:
            print("📊 Ajout série :", serie['nom'], serie['valeurs'])
            SerieDonnee.objects.create(
                graphique=graphique,
                nom=serie['nom'],
                categories=serie['categories'],
                valeurs=serie['valeurs'],
                couleur=serie.get('couleur', '#3e95cd'),
                couleurs_camembert=serie.get('couleurs_camembert')  # ✅ important pour "pie"
            )

        return redirect('dashboard', slug=slug)

    return redirect('importer_excel', slug=slug)    


from django.shortcuts import get_object_or_404, render, redirect
from .models import Graphique, SerieDonnee, SousThematique
import pandas as pd
import json
from io import StringIO


def modifier_graphique_excel(request, graph_id):
    graphique = get_object_or_404(Graphique, id=graph_id)
    sous_thematique = graphique.sous_thematique

    if request.method == 'POST':
        try:
            series_data = json.loads(request.POST.get('series_data', '[]'))
        except json.JSONDecodeError:
            series_data = []

        graphique.titre = request.POST.get('titre', graphique.titre)
        graphique.description = request.POST.get('description', '')
        graphique.type = request.POST.get('type', 'bar')
        graphique.titre_abscisse = request.POST.get("titre-x", "")
        graphique.titre_ordonnée = request.POST.get("titre-y", "")
        graphique.save()

        # Supprime les anciennes séries
        graphique.series.all().delete()

        for serie in series_data:
            SerieDonnee.objects.create(
                graphique=graphique,
                nom=serie['nom'],
                categories=serie['categories'],
                valeurs=serie['valeurs'],
                couleur=serie.get('couleur', '#3e95cd'),
                couleurs_camembert=serie.get('couleurs_camembert')
            )

        return redirect('dashboard', slug=sous_thematique.slug)

    # 🌱 Préparation du formulaire avec données existantes
    colonnes = []
    if graphique.series.exists():
        colonnes = list(graphique.series.first().categories)
        request.session['excel_data'] = pd.DataFrame({
            serie.nom: serie.valeurs for serie in graphique.series.all()
        }, index=colonnes).to_json()

    return render(request, 'analytics/importer_excel.html', {
        'slug': sous_thematique.slug,
        'graphique': graphique,
        'mode': 'edition',
    })











