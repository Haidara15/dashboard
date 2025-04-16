from django.contrib import admin
from django.urls import path

from .views import home, dashboard,ajouter_graphique

urlpatterns = [
    path('', home, name="home"),
    path('dasboard/<slug:slug>/', dashboard, name='dashboard'),
    path('graphique/<slug:slug>/ajouter/', ajouter_graphique, name='ajouter_graphique'),
]


