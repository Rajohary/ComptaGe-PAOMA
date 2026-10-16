from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    SectionComptableViewSet,
    LigneComptableViewSet,
    MouvementViewSet,
    RubriqueEncaisseViewSet,
    MouvementEncaisseViewSet,
    SituationComptableView,
)

router = DefaultRouter()
router.register(r"sections-comptables", SectionComptableViewSet, basename="section-comptable")
router.register(r"lignes-comptables", LigneComptableViewSet, basename="ligne-comptable")
router.register(r"mouvements", MouvementViewSet, basename="mouvement")
router.register(r"rubriques-encaisse", RubriqueEncaisseViewSet, basename="rubrique-encaisse")
router.register(r"mouvements-encaisse", MouvementEncaisseViewSet, basename="mouvement-encaisse")

urlpatterns = [
    path("situation-comptable/<int:periode_id>/", SituationComptableView.as_view(), name="situation-comptable"),
] + router.urls
"""
Routage des URLs pour l'application Comptabilité.
"""

from django.urls import path
from apps.comptabilite.views import ReceveurDashboardView

urlpatterns = [
    # Dashboard Receveur : progression de saisie du mois en cours
    path("dashboard/receveur/", ReceveurDashboardView.as_view(), name="dashboard-receveur"),
]
