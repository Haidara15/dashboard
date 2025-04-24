import random
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


from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
import pandas as pd
from io import StringIO

@csrf_exempt
def generer_graphique_preview(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            categorie_col = data.get('categorie')
            series = data.get('series', [])
            graph_type = data.get("type", "bar")  # optionnel, utile si tu veux traiter plus tard

            df_json = request.session.get('excel_data')
            if not df_json:
                return JsonResponse({"error": "Aucune donnée Excel en session."}, status=400)

            df = pd.read_json(StringIO(df_json))

            if categorie_col not in df.columns:
                return JsonResponse({"error": f"Colonne '{categorie_col}' introuvable."}, status=400)

            labels = df[categorie_col].astype(str).tolist()
            series_data = []

            for serie in series:
                nom = serie.get("nom")
                couleur = serie.get("couleur", "#3e95cd")

                if nom not in df.columns:
                    continue  # sécurité : ignore les colonnes inexistantes

                valeurs = df[nom].tolist()

                serie_obj = {
                    "nom": nom,
                    "valeurs": valeurs,
                    "couleur": couleur,
                    "categories": labels
                }

                if graph_type == "pie":
                    serie_obj["couleurs_camembert"] = [
                        f"hsl({(i * 50) % 360}, 70%, 60%)" for i in range(len(valeurs))
                    ]

                series_data.append(serie_obj)

            return JsonResponse({
                "labels": labels,
                "series_data": series_data
            })

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)





from io import StringIO
import json
import pandas as pd
from .models import Graphique, SerieDonnee, SousThematique

from django.shortcuts import get_object_or_404, redirect
import json
from .models import Graphique, SerieDonnee, SousThematique


import json
import pandas as pd
from io import StringIO
from colorsys import hsv_to_rgb

from django.shortcuts import get_object_or_404, redirect, render
from django.http import JsonResponse
from django.core.serializers.json import DjangoJSONEncoder
from .models import Graphique, SerieDonnee, SousThematique


def generate_color(index):
    hue = (index * 0.2) % 1
    rgb = hsv_to_rgb(hue, 0.6, 0.85)
    return '#{:02x}{:02x}{:02x}'.format(
        int(rgb[0] * 255),
        int(rgb[1] * 255),
        int(rgb[2] * 255)
    )


# 🟢 VUE DE CRÉATION
def creer_graphique_excel(request, slug):
    if request.method == 'POST':
        try:
            series_data = json.loads(request.POST.get('series_data', '[]'))
        except json.JSONDecodeError:
            series_data = []

        sous_thematique = get_object_or_404(SousThematique, slug=slug)

        graphique = Graphique.objects.create(
            titre=request.POST.get('titre', 'Graphique importé'),
            description=request.POST.get('description', ''),
            type=request.POST.get('type', 'bar'),
            titre_abscisse=request.POST.get("titre-x", ""),
            titre_ordonnée=request.POST.get("titre-y", ""),
            sous_thematique=sous_thematique
        )

        # ✅ Sauvegarder le fichier Excel si fourni
        excel_file = request.FILES.get('excel_file')
        if excel_file:
            graphique.fichier_excel = excel_file
            graphique.save()

        for idx, serie in enumerate(series_data):
            SerieDonnee.objects.create(
                graphique=graphique,
                nom=serie['nom'],
                categories=serie['categories'],
                valeurs=serie['valeurs'],
                couleur=serie.get('couleur', generate_color(idx)),
                couleurs_camembert=serie.get('couleurs_camembert')
            )

        return redirect('dashboard', slug=slug)

    return redirect('importer_excel', slug=slug)


# 🟠 VUE DE MODIFICATION
def modifier_graphique_excel(request, graph_id):
    graphique = get_object_or_404(Graphique, id=graph_id)
    sous_thematique = graphique.sous_thematique

    # 📁 Rechargement AJAX du fichier Excel (sans sauvegarde)
    if request.method == 'POST' and request.FILES.get('excel_file'):
        excel_file = request.FILES['excel_file']
        try:
            df = pd.read_excel(excel_file)
            request.session['excel_data'] = df.to_json()
            return JsonResponse({
                "status": "success",
                "columns": df.columns.tolist()
            })
        except Exception as e:
            return JsonResponse({
                "status": "error",
                "message": str(e)
            })

    # 📝 Enregistrement du graphique modifié
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

        # ✅ Mise à jour du fichier si un nouveau est chargé
        if 'excel_file' in request.FILES:
            graphique.fichier_excel = request.FILES['excel_file']

        graphique.save()
        graphique.series.all().delete()

        for idx, serie in enumerate(series_data):
            SerieDonnee.objects.create(
                graphique=graphique,
                nom=serie['nom'],
                categories=serie['categories'],
                valeurs=serie['valeurs'],
                couleur=serie.get('couleur', generate_color(idx)),
                couleurs_camembert=serie.get('couleurs_camembert')
            )

        return redirect('dashboard', slug=sous_thematique.slug)

    # 🔄 Chargement des colonnes Excel
    colonnes_disponibles = []
    excel_rows = []
    categorie_colonne = graphique.series.first().nom if graphique.series.exists() else ""
    categorie_sample = graphique.series.first().categories if graphique.series.exists() else []

    if 'excel_data' in request.session:
        try:
            df = pd.read_json(request.session['excel_data'])
            colonnes_disponibles = df.columns.tolist()
            excel_rows = df.to_dict(orient="records")
        except Exception as e:
            print("⚠️ Erreur lecture session Excel :", e)
    elif graphique.fichier_excel:
        try:
            df = pd.read_excel(graphique.fichier_excel.path)
            colonnes_disponibles = df.columns.tolist()
            excel_rows = df.to_dict(orient="records")
        except Exception as e:
            print("⚠️ Erreur lecture fichier_excel :", e)
    else:
        print("⚠️ Aucun fichier Excel attaché à ce graphique.")

    series_data = [
        {
            "nom": serie.nom,
            "valeurs": serie.valeurs,
            "categories": serie.categories,
            "couleur": serie.couleur,
            "couleurs_camembert": serie.couleurs_camembert
        }
        for serie in graphique.series.all()
    ]

    return render(request, 'analytics/modifier_excel.html', {
        'graphique': graphique,
        'slug': sous_thematique.slug,
        'graph_id': graphique.id,
        'colonnes_disponibles': colonnes_disponibles,
        'categorie_sample': json.dumps(categorie_sample),
        'categorie_colonne': categorie_colonne,
        'series_data': json.dumps(series_data, cls=DjangoJSONEncoder),
        'excel_rows': json.dumps(excel_rows, cls=DjangoJSONEncoder)
    })



###### Vue pour sauvegarder les positions  #####

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .models import Graphique
import json

@csrf_exempt 
@require_POST
def update_positions(request):
    try:
        data = json.loads(request.body)
        for item in data.get("items", []):
            try:
                graph = Graphique.objects.get(id=item["id"])
                graph.pos_x = item["x"]
                graph.pos_y = item["y"]
                graph.width = item["w"]
                graph.height = item["h"]
                graph.save()
            except Graphique.DoesNotExist:
                continue
        return JsonResponse({"status": "success"})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)






