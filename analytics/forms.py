from django import forms
from .models import Graphique, SerieDonnee

class GraphiqueForm(forms.ModelForm):
    class Meta:
        model = Graphique
        fields = [
            'titre',
            'type',
            'description'
           
            
        ]

