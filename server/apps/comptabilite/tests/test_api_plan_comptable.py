import unittest
import uuid
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from apps.comptabilite.views import LigneComptableViewSet, SectionComptableViewSet
from apps.comptabilite.models import SectionComptable, LigneComptable


class MockUser:
    """Mock utilisateur pour tester l'authentification et le RBAC."""
    def __init__(self, is_auth=True, role="RECEVEUR"):
        self.is_authenticated = is_auth
        self.is_staff = False
        self.is_superuser = False
        self.role = role


class LigneComptableAPITestCase(unittest.TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.uid = uuid.uuid4().hex[:6].upper()

        # Création de sections dédiées pour le test
        self.sec_a = SectionComptable.objects.create(
            code=f"TA_{self.uid}",
            libelle="Section Test Débit",
            sens=SectionComptable.Sens.DEBIT,
            ordre=10,
        )
        self.sec_b = SectionComptable.objects.create(
            code=f"TB_{self.uid}",
            libelle="Section Test Crédit",
            sens=SectionComptable.Sens.CREDIT,
            ordre=20,
        )

        # Ligne parente (ex: sous-section B1)
        self.ligne_b1 = LigneComptable.objects.create(
            section=self.sec_b,
            menu_sub=int(f"80{self.sec_b.id % 1000:03d}1"),
            compte="TB1",
            libelle="Groupe Test Mandats",
        )

        # Lignes feuilles
        self.ligne_leaf1 = LigneComptable.objects.create(
            section=self.sec_a,
            menu_sub=int(f"80{self.sec_a.id % 1000:03d}2"),
            compte="TAD01",
            libelle="Timbres-poste test spécial",
        )
        self.ligne_leaf2 = LigneComptable.objects.create(
            section=self.sec_b,
            parent=self.ligne_b1,
            menu_sub=int(f"80{self.sec_b.id % 1000:03d}3"),
            compte="TB101",
            libelle="Emission mandats test",
        )
        self.ligne_inactif = LigneComptable.objects.create(
            section=self.sec_a,
            menu_sub=int(f"80{self.sec_a.id % 1000:03d}4"),
            compte="TAD99",
            libelle="Ligne inactive archivée",
            actif=False,
        )

    def tearDown(self):
        LigneComptable.objects.filter(section__in=[self.sec_a, self.sec_b], parent__isnull=False).delete()
        LigneComptable.objects.filter(section__in=[self.sec_a, self.sec_b]).delete()
        SectionComptable.objects.filter(id__in=[self.sec_a.id, self.sec_b.id]).delete()

    def test_lignes_unauthenticated_forbidden(self):
        """Un utilisateur non authentifié doit recevoir un code HTTP 401."""
        view = LigneComptableViewSet.as_view({"get": "list"})
        req = self.factory.get("/api/v1/lignes-comptables/")
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_lignes_list_authenticated_default_active(self):
        """Un utilisateur authentifié peut lister les lignes actives."""
        view = LigneComptableViewSet.as_view({"get": "list"})
        req = self.factory.get(f"/api/v1/lignes-comptables/?section={self.sec_a.code}")
        force_authenticate(req, user=MockUser(role="RECEVEUR"))
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # Vérifier que les résultats contiennent la ligne active mais pas l'inactive
        codes = [item["compte"] for item in resp.data["results"]]
        self.assertIn("TAD01", codes)
        self.assertNotIn("TAD99", codes)

        # Vérifier l'enrichissement des données de section
        item_leaf = next(item for item in resp.data["results"] if item["compte"] == "TAD01")
        self.assertEqual(item_leaf["section_code"], self.sec_a.code)
        self.assertEqual(item_leaf["section_libelle"], "Section Test Débit")
        self.assertEqual(item_leaf["sens"], SectionComptable.Sens.DEBIT)
        self.assertEqual(item_leaf["sens_libelle"], "Débit")

    def test_lignes_search_instantanee(self):
        """La recherche par mot-clé (search) filtre sur compte ou libellé."""
        view = LigneComptableViewSet.as_view({"get": "list"})
        
        # Recherche par libellé partiel
        req = self.factory.get("/api/v1/lignes-comptables/?search=spécial")
        force_authenticate(req, user=MockUser(role="AGENT_SAISIE"))
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        codes = [item["compte"] for item in resp.data["results"]]
        self.assertIn("TAD01", codes)
        self.assertNotIn("TB101", codes)

        # Recherche par compte exact
        req2 = self.factory.get("/api/v1/lignes-comptables/?search=TB101")
        force_authenticate(req2, user=MockUser(role="INSPECTEUR"))
        resp2 = view(req2)
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        codes2 = [item["compte"] for item in resp2.data["results"]]
        self.assertEqual(codes2, ["TB101"])

        # Vérifier le détail du parent pour TB101
        item_b101 = resp2.data["results"][0]
        self.assertIsNotNone(item_b101["parent_detail"])
        self.assertEqual(item_b101["parent_detail"]["compte"], "TB1")
        self.assertEqual(item_b101["parent_detail"]["libelle"], "Groupe Test Mandats")

    def test_lignes_filter_by_sens(self):
        """Filtre par sens comptable (1=Débit, 2=Crédit)."""
        view = LigneComptableViewSet.as_view({"get": "list"})
        
        # Filtrer par Débit (sens=1)
        req = self.factory.get(f"/api/v1/lignes-comptables/?sens=1&search={self.uid}")
        force_authenticate(req, user=MockUser(role="ADMIN"))
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Seules les lignes de sec_a (débit) doivent être renvoyées
        sections = [item["section_code"] for item in resp.data["results"]]
        self.assertTrue(all(s == self.sec_a.code for s in sections))

    def test_lignes_filter_feuille_only(self):
        """Le filtre feuille=true exclut les lignes regroupement qui ont des sous-lignes."""
        view = LigneComptableViewSet.as_view({"get": "list"})
        req = self.factory.get(f"/api/v1/lignes-comptables/?section={self.sec_b.code}&feuille=true")
        force_authenticate(req, user=MockUser(role="RECEVEUR"))
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        codes = [item["compte"] for item in resp.data["results"]]
        self.assertIn("TB101", codes)
        self.assertNotIn("TB1", codes)  # TB1 a une sous-ligne TB101, donc il ne doit pas être inclus

    def test_sections_comptables_endpoint(self):
        """L'endpoint /api/v1/sections-comptables/ liste les sections ordonnées."""
        view = SectionComptableViewSet.as_view({"get": "list"})
        req = self.factory.get("/api/v1/sections-comptables/")
        force_authenticate(req, user=MockUser(role="RECEVEUR"))
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data["results"]), 2)
