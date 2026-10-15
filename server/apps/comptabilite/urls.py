"""
Routage des URLs pour l'application Comptabilité.
"""

from django.urls import path
from apps.comptabilite.views import ReceveurDashboardView

urlpatterns = [
    # Dashboard Receveur : progression de saisie du mois en cours
    path("dashboard/receveur/", ReceveurDashboardView.as_view(), name="dashboard-receveur"),
]
