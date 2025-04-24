from django.contrib import admin
from django.urls import path

from .views import home, dashboard,supprimer_graphique,importer_excel,creer_graphique_excel,generer_graphique_preview,modifier_graphique_excel,update_positions

urlpatterns = [
    path('', home, name="home"),
    path('graphique/<int:pk>/supprimer/', supprimer_graphique, name='supprimer_graphique'),
    path('dasboard/<slug:slug>/', dashboard, name='dashboard'),
    path('importer-excel/<slug:slug>/', importer_excel, name='importer_excel'),
    path('creer-graphique-excel/<slug:slug>/', creer_graphique_excel, name='creer_graphique_excel'),
    path('api/generer-graphique-preview/', generer_graphique_preview, name='generer_graphique_preview'),
    path('modifier-graphique-excel/<int:graph_id>/', modifier_graphique_excel, name='modifier_graphique_excel'),
    path('api/update_positions/', update_positions, name='update_positions'),

]


