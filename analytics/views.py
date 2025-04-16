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
    graphiques = sous_thematique.graphiques.prefetch_related('series').all()
    
    return render(request, 'analytics/dashboard.html', {
        'sous_thematique': sous_thematique,
        'graphiques': graphiques
    })


from django.shortcuts import render, get_object_or_404, redirect
from .models import Graphique, SerieDonnee, SousThematique
from .forms import GraphiqueForm
import json

def ajouter_graphique(request, slug):
    sous_thematique = get_object_or_404(SousThematique, slug=slug)

    if request.method == 'POST':
        graph_form = GraphiqueForm(request.POST)
        series_data = json.loads(request.POST.get('series_data', '[]'))

        if graph_form.is_valid():
            graphique = graph_form.save(commit=False)
            graphique.sous_thematique = sous_thematique
            graphique.save()

            for serie in series_data:
                SerieDonnee.objects.create(
                    graphique=graphique,
                    nom=serie['nom'],
                    categories=serie['categories'],
                    valeurs=serie['valeurs'],
                )

            return redirect('dashboard', slug=sous_thematique.slug)

    else:
        graph_form = GraphiqueForm()

    return render(request, 'analytics/ajouter_graphique.html', {
        'graph_form': graph_form,
        'sous_thematique': sous_thematique,
    })



