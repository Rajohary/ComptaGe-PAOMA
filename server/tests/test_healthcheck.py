import pytest
from rest_framework.test import APIClient
from rest_framework import status


def test_healthcheck_endpoint():
    """
    Vérifie que l'endpoint /api/v1/health/ est accessible publiquement
    et renvoie un statut HTTP 200 avec le payload attendu.
    Ne nécessite pas d'accès DB pour une vérification de vie de l'API.
    """
    client = APIClient()
    response = client.get("/api/v1/health/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ComptaGeWeb Backend"
    assert "version" in data
