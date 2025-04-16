from django.contrib import admin

from django.contrib import admin
from .models import Thematique, SousThematique, Graphique, SerieDonnee


# Fonction utilitaire pour afficher tous les champs automatiquement
def get_all_field_names(model):
    return [field.name for field in model._meta.fields]


@admin.register(Thematique)
class ThematiqueAdmin(admin.ModelAdmin):
    list_display = get_all_field_names(Thematique)

@admin.register(SousThematique)
class SousThematiqueAdmin(admin.ModelAdmin):
    list_display = get_all_field_names(SousThematique)



@admin.register(Graphique)
class GraphiqueAdmin(admin.ModelAdmin):
    list_display = get_all_field_names(Graphique)

@admin.register(SerieDonnee)
class SerieDonneeAdmin(admin.ModelAdmin):
    list_display = get_all_field_names(SerieDonnee)


