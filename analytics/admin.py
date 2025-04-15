from django.contrib import admin

from django.contrib import admin
from .models import Thematique, SousThematique

@admin.register(Thematique)
class ThematiqueAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Thematique._meta.fields]

@admin.register(SousThematique)
class SousThematiqueAdmin(admin.ModelAdmin):
    list_display = [field.name for field in SousThematique._meta.fields]

