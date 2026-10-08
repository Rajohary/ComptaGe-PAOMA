import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework_simplejwt.tokens import AccessToken

from apps.accounts.permissions import IsAdmin, IsSameBureau


User = get_user_model()


@pytest.mark.django_db
def test_login_me_logout_flow():
    user = User.objects.create_user(
        username="receveur1",
        password="12345",
        role=User.Role.RECEVEUR,
        bureau_code=101,
    )

    client = APIClient()
    response = client.post(
        "/api/v1/auth/login/",
        {"username": "receveur1", "password": "12345"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
    assert "refresh" in response.data
    assert response.data["user"]["username"] == user.username
    assert response.data["user"]["role"] == User.Role.RECEVEUR

    access = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    me_response = client.get("/api/v1/auth/me/")
    assert me_response.status_code == status.HTTP_200_OK
    assert me_response.data["username"] == "receveur1"
    assert me_response.data["bureau_code"] == 101

    logout_response = client.post("/api/v1/auth/logout/", {}, format="json")
    assert logout_response.status_code == status.HTTP_200_OK
    assert logout_response.data["detail"] == "Déconnexion effectuée."


@pytest.mark.django_db
def test_permissions_by_role_and_bureau():
    admin = User.objects.create_superuser(username="adm", password="1234")
    inspecteur = User.objects.create_user(
        username="insp",
        password="123",
        role=User.Role.INSPECTEUR,
        bureau_code=202,
    )
    agent_same = User.objects.create_user(
        username="agent1",
        password="123",
        role=User.Role.AGENT_SAISIE,
        bureau_code=202,
    )
    agent_other = User.objects.create_user(
        username="agent2",
        password="123",
        role=User.Role.AGENT_SAISIE,
        bureau_code=303,
    )

    factory = APIRequestFactory()
    request = factory.get("/")

    request.user = admin
    assert IsAdmin().has_permission(request, None) is True

    request.user = inspecteur
    assert IsAdmin().has_permission(request, None) is False

    class DummyObject:
        bureau_code = 202

    request.user = agent_same
    assert IsSameBureau().has_object_permission(request, None, DummyObject()) is True

    request.user = agent_other
    assert IsSameBureau().has_object_permission(request, None, DummyObject()) is False


@pytest.mark.django_db
def test_expired_token_is_rejected():
    user = User.objects.create_user(
        username="agent-expire",
        password="123",
        role=User.Role.AGENT_SAISIE,
        bureau_code=404,
    )

    token = AccessToken.for_user(user)
    token.set_exp(from_time=token.current_time - token.lifetime - token.lifetime)

    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")

    response = client.get("/api/v1/auth/me/")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
