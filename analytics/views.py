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
    return render(request, 'analytics/dashboard.html', {
        'sous_thematique': sous_thematique
    })


