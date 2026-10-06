"""
Routage racine des URLs pour ComptaGeWeb.
Toutes les routes de l'API sont préfixées par /api/v1/.
"""

from django.contrib import admin
from django.urls import path
from .views import HealthCheckView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", HealthCheckView.as_view(), name="healthcheck"),
]
