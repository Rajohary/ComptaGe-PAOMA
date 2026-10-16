"""
Routage des URLs pour l'application Audit.
"""

from django.urls import path
from apps.audit.views import EcartsListView, InspecteurDashboardView

urlpatterns = [
    # Liste filtrable des écarts (vue DIF)
    path("audit/ecarts/", EcartsListView.as_view(), name="audit-ecarts"),
    # Dashboard Inspecteur (KPIs + résumé)
    path("dashboard/inspecteur/", InspecteurDashboardView.as_view(), name="dashboard-inspecteur"),
]
