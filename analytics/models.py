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
