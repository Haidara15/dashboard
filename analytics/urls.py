from django.contrib import admin
from django.urls import path

from .views import home, dashboard

urlpatterns = [
    path('', home, name="home"),
    path('dasboard/<slug:slug>/', dashboard, name='dashboard'),
]