from django.contrib import admin
from django.urls import path

from .views import home, dashboard,ajouter_graphique,modifier_graphique,supprimer_graphique

urlpatterns = [
    path('', home, name="home"),
    path('graphique/<slug:slug>/ajouter/', ajouter_graphique, name='ajouter_graphique'),
    path('<int:graph_id>/modifier/', modifier_graphique, name='modifier_graphique'),  
    path('graphique/<int:pk>/supprimer/', supprimer_graphique, name='supprimer_graphique'),
    path('dasboard/<slug:slug>/', dashboard, name='dashboard'),
     
]


