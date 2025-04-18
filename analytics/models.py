# models.py

from django.db import models
from django.utils.text import slugify

class Thematique(models.Model):
    nom = models.CharField(max_length=100)
    ordre = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['ordre']

    def __str__(self):
        return self.nom

class SousThematique(models.Model):
    thematique = models.ForeignKey(Thematique, related_name='sous_thematiques', on_delete=models.CASCADE)
    nom = models.CharField(max_length=100)
    lien = models.URLField(blank=True, null=True)
    ordre = models.PositiveIntegerField(default=0)
    slug = models.SlugField(unique=True, blank=True)

    class Meta:
        ordering = ['ordre']

    def __str__(self):
        return f"{self.nom} ({self.thematique.nom})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nom)
        super().save(*args, **kwargs)


class Graphique(models.Model):
    sous_thematique = models.ForeignKey("SousThematique", on_delete=models.CASCADE, related_name="graphiques")
    titre = models.CharField(max_length=200)
    type = models.CharField(max_length=50, choices=[
        ('bar', 'Colonnes'),
        ('line', 'Lignes'),
        ('pie', 'Camembert'),
    ])
    description = models.TextField(blank=True, null=True)
    titre_abscisse = models.CharField(max_length=100, blank=True, null=True)
    titre_ordonnée = models.CharField(max_length=100, blank=True, null=True)
    date_ajout = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titre

class SerieDonnee(models.Model):
    graphique = models.ForeignKey(Graphique, on_delete=models.CASCADE, related_name="series")
    nom = models.CharField(max_length=100)
    categories = models.JSONField()
    valeurs = models.JSONField()
    couleur = models.CharField(max_length=7, default="#3e95cd")  # ✅ nouvelle colonne


    def __str__(self):
        return f"{self.nom} ({self.graphique.titre})"


