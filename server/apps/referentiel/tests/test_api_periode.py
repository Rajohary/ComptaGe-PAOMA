from datetime import date
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from apps.referentiel.views import PeriodeGestionViewSet
from apps.referentiel.models import Province, Bureau, PeriodeGestion


class MockUser:
    def __init__(self, username="user", is_auth=True, is_staff=False, is_super=False, role="AGENT_SAISIE"):
        self.username = username
        self.is_authenticated = is_auth
        self.is_staff = is_staff
        self.is_superuser = is_super
        self.role = role


class PeriodeGestionAPITestCase(TestCase):
    def setUp(self):
        self.province = Province.objects.create(nprovince=70, nom="Province Periode Suite")
        self.bureau = Bureau.objects.create(
            province=self.province,
            ncodique=70100,
            nom_bureau="Bureau Periode Test",
            classe="R1",
        )
        self.factory = APIRequestFactory()

    def tearDown(self):
        PeriodeGestion.objects.filter(bureau=self.bureau).delete()
        self.bureau.delete()
        self.province.delete()

    def test_ouverture_periode_success(self):
        """Vérifie l'ouverture valide d'une période de gestion sans date de fin."""
        view = PeriodeGestionViewSet.as_view({"post": "create"})
        payload = {
            "bureau": self.bureau.id,
            "nom_receveur": "Rakoto Jean",
            "date_debut": "2026-06-01",
            "reserve_numeraire": "500000.00",
            "valeurs_postales": "250000.00",
            "timbres_fiscaux": "100000.00",
            "solde_debiteur_depart": "0.00",
            "solde_crediteur_depart": "0.00",
        }
        req = self.factory.post("/api/v1/periodes-gestion/", payload, format="json")
        force_authenticate(req, user=MockUser(role="RECEVEUR"))
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["nom_receveur"], "Rakoto Jean")
        self.assertIsNone(resp.data["date_fin"])
        self.assertEqual(resp.data["cloturee"], False)
        self.assertEqual(resp.data["reserve_numeraire"], "500000.00")
        self.assertEqual(resp.data["valeurs_postales"], "250000.00")
        self.assertEqual(resp.data["timbres_fiscaux"], "100000.00")

    def test_ouverture_periode_missing_inventaire_initial(self):
        """Vérifie le rejet strict si une des valeurs d'inventaire initial manque ou est négative."""
        view = PeriodeGestionViewSet.as_view({"post": "create"})
        # Sans timbres_fiscaux
        payload_missing = {
            "bureau": self.bureau.id,
            "nom_receveur": "Rakoto Jean",
            "date_debut": "2026-06-01",
            "date_fin": "2026-06-30",
            "reserve_numeraire": "500000.00",
            "valeurs_postales": "250000.00",
        }
        req = self.factory.post("/api/v1/periodes-gestion/", payload_missing, format="json")
        force_authenticate(req, user=MockUser(role="RECEVEUR"))
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("timbres_fiscaux", resp.data)

        # Avec montant négatif
        payload_neg = {
            "bureau": self.bureau.id,
            "nom_receveur": "Rakoto Jean",
            "date_debut": "2026-06-01",
            "date_fin": "2026-06-30",
            "reserve_numeraire": "-500.00",
            "valeurs_postales": "250000.00",
            "timbres_fiscaux": "100000.00",
        }
        req_neg = self.factory.post("/api/v1/periodes-gestion/", payload_neg, format="json")
        force_authenticate(req_neg, user=MockUser(role="RECEVEUR"))
        resp_neg = view(req_neg)
        self.assertEqual(resp_neg.status_code, status.HTTP_400_BAD_REQUEST)

    def test_ouverture_periode_rbac_rejet_agent_saisie(self):
        """Vérifie qu'un agent de saisie non receveur ne peut pas ouvrir une période."""
        view = PeriodeGestionViewSet.as_view({"post": "create"})
        payload = {
            "bureau": self.bureau.id,
            "nom_receveur": "Rakoto Jean",
            "date_debut": "2026-06-01",
            "date_fin": "2026-06-30",
            "reserve_numeraire": "500000.00",
            "valeurs_postales": "250000.00",
            "timbres_fiscaux": "100000.00",
        }
        req = self.factory.post("/api/v1/periodes-gestion/", payload, format="json")
        force_authenticate(req, user=MockUser(role="AGENT_SAISIE"))
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_ouverture_plusieurs_periodes_actives_autorisee(self):
        """Vérifie qu'il est désormais possible d'ouvrir plusieurs périodes pour un même bureau."""
        PeriodeGestion.objects.create(
            bureau=self.bureau,
            nom_receveur="Premier Receveur",
            date_debut=date(2026, 6, 1),
            date_fin=date(2026, 6, 30),
            reserve_numeraire=1000.00,
            valeurs_postales=1000.00,
            timbres_fiscaux=1000.00,
            cloturee=False,
        )
        view = PeriodeGestionViewSet.as_view({"post": "create"})
        payload = {
            "bureau": self.bureau.id,
            "nom_receveur": "Second Receveur",
            "date_debut": "2026-07-01",
            "date_fin": "2026-07-31",
            "reserve_numeraire": "2000.00",
            "valeurs_postales": "2000.00",
            "timbres_fiscaux": "2000.00",
        }
        req = self.factory.post("/api/v1/periodes-gestion/", payload, format="json")
        force_authenticate(req, user=MockUser(role="RECEVEUR"))
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PeriodeGestion.objects.filter(bureau=self.bureau, cloturee=False).count(), 2)

    def test_cloture_periode_flow_and_rbac(self):
        """Vérifie la clôture réussie d'une période active, l'assignation de date_fin, l'interdiction de double clôture et le RBAC."""
        periode = PeriodeGestion.objects.create(
            bureau=self.bureau,
            nom_receveur="Receveur A Clôturer",
            date_debut=date(2026, 6, 1),
            date_fin=None,
            reserve_numeraire=50000.00,
            valeurs_postales=20000.00,
            timbres_fiscaux=10000.00,
            cloturee=False,
        )
        view = PeriodeGestionViewSet.as_view({"post": "cloturer"})

        # 1. Tentative par un rôle non autorisé (AGENT_SAISIE) -> 403 Forbidden
        req_forbidden = self.factory.post(f"/api/v1/periodes-gestion/{periode.id}/cloturer/")
        force_authenticate(req_forbidden, user=MockUser(role="AGENT_SAISIE"))
        resp_forbidden = view(req_forbidden, pk=periode.id)
        self.assertEqual(resp_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Clôture par un receveur avec date_fin spécifiée -> 200 OK
        req_ok = self.factory.post(f"/api/v1/periodes-gestion/{periode.id}/cloturer/", {"date_fin": "2026-06-30"}, format="json")
        force_authenticate(req_ok, user=MockUser(role="RECEVEUR"))
        resp_ok = view(req_ok, pk=periode.id)
        self.assertEqual(resp_ok.status_code, status.HTTP_200_OK)
        self.assertTrue(resp_ok.data["cloturee"])
        self.assertEqual(resp_ok.data["date_fin"], "2026-06-30")
        self.assertIsNotNone(resp_ok.data["date_cloture"])

        periode.refresh_from_db()
        self.assertTrue(periode.cloturee)
        self.assertEqual(str(periode.date_fin), "2026-06-30")
        self.assertIsNotNone(periode.date_cloture)

        # 3. Tentative de ré-clôturer la même période -> 400 Bad Request
        req_duplicate = self.factory.post(f"/api/v1/periodes-gestion/{periode.id}/cloturer/")
        force_authenticate(req_duplicate, user=MockUser(role="RECEVEUR"))
        resp_duplicate = view(req_duplicate, pk=periode.id)
        self.assertEqual(resp_duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", resp_duplicate.data)
