"""
Routage racine des URLs pour ComptaGeWeb.
Toutes les routes de l'API sont préfixées par /api/v1/.
"""

from django.contrib import admin
from django.urls import path, include
from .views import HealthCheckView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", HealthCheckView.as_view(), name="healthcheck"),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.referentiel.urls")),
    path("api/v1/", include("apps.comptabilite.urls")),
    path("api/v1/", include("apps.stock.urls")),
]
