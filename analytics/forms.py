from django import forms
from .models import Graphique, SerieDonnee

class GraphiqueForm(forms.ModelForm):
    class Meta:
        model = Graphique
        fields = ['titre', 'type', 'description']

# Les séries seront gérées via JS côté frontend, donc pas de formset ici
