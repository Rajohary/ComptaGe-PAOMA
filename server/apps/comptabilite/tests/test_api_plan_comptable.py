from django.test import TestCase
import uuid
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from apps.comptabilite.views import LigneComptableViewSet, SectionComptableViewSet
from apps.comptabilite.models import SectionComptable, LigneComptable
from django.contrib.auth import get_user_model

User = get_user_model()


class LigneComptableAPITestCase(TestCase):

    def setUp(self):
        self.factory = APIRequestFactory()
        self.uid = uuid.uuid4().hex[:6].upper()

        self.user_admin = User.objects.create_user(
            username=f"admin_{self.uid}",
            password="Password123!",
            role="ADMIN",
        )
        self.user_receveur = User.objects.create_user(
            username=f"receveur_{self.uid}",
            password="Password123!",
            role="RECEVEUR",
        )
        self.user_agent = User.objects.create_user(
            username=f"agent_{self.uid}",
            password="Password123!",
            role="AGENT_SAISIE",
        )
        self.user_inspecteur = User.objects.create_user(
            username=f"inspecteur_{self.uid}",
            password="Password123!",
            role="INSPECTEUR",
        )

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
        force_authenticate(req, user=self.user_receveur)
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
        force_authenticate(req, user=self.user_agent)
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        codes = [item["compte"] for item in resp.data["results"]]
        self.assertIn("TAD01", codes)
        self.assertNotIn("TB101", codes)

        # Recherche par compte exact
        req2 = self.factory.get("/api/v1/lignes-comptables/?search=TB101")
        force_authenticate(req2, user=self.user_inspecteur)
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
        force_authenticate(req, user=self.user_admin)
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Seules les lignes de sec_a (débit) doivent être renvoyées
        sections = [item["section_code"] for item in resp.data["results"]]
        self.assertTrue(all(s == self.sec_a.code for s in sections))

    def test_lignes_filter_feuille_only(self):
        """Le filtre feuille=true exclut les lignes regroupement qui ont des sous-lignes."""
        view = LigneComptableViewSet.as_view({"get": "list"})
        req = self.factory.get(f"/api/v1/lignes-comptables/?section={self.sec_b.code}&feuille=true")
        force_authenticate(req, user=self.user_receveur)
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        codes = [item["compte"] for item in resp.data["results"]]
        self.assertIn("TB101", codes)
        self.assertNotIn("TB1", codes)  # TB1 a une sous-ligne TB101, donc il ne doit pas être inclus

    def test_sections_comptables_endpoint(self):
        """L'endpoint /api/v1/sections-comptables/ liste les sections ordonnées."""
        view = SectionComptableViewSet.as_view({"get": "list"})
        req = self.factory.get("/api/v1/sections-comptables/")
        force_authenticate(req, user=self.user_receveur)
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data["results"]), 2)

    def test_admin_can_create_and_update_section(self):
        """Un administrateur peut créer et modifier une section comptable."""
        # 1. Création par Admin
        create_view = SectionComptableViewSet.as_view({"post": "create"})
        payload = {
            "code": f"T_{self.uid[:4]}",
            "libelle": "Nouvelle Section Admin",
            "sens": SectionComptable.Sens.DEBIT,
            "ordre": 99,
            "actif": True,
        }
        req_create = self.factory.post("/api/v1/sections-comptables/", data=payload, format="json")
        force_authenticate(req_create, user=self.user_admin)
        res_create = create_view(req_create)
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        new_section_id = res_create.data["id"]

        # 2. Modification par Admin
        update_view = SectionComptableViewSet.as_view({"patch": "partial_update"})
        patch_payload = {"libelle": "Section Admin Modifiée"}
        req_patch = self.factory.patch(
            f"/api/v1/sections-comptables/{new_section_id}/",
            data=patch_payload,
            format="json",
        )
        force_authenticate(req_patch, user=self.user_admin)
        res_patch = update_view(req_patch, pk=new_section_id)
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data["libelle"], "Section Admin Modifiée")

    def test_non_admin_cannot_create_or_update_section(self):
        """Un receveur ou agent ne peut ni créer ni modifier une section comptable (403 Forbidden)."""
        create_view = SectionComptableViewSet.as_view({"post": "create"})
        payload = {
            "code": f"F_{self.uid[:4]}",
            "libelle": "Section Interdite",
            "sens": SectionComptable.Sens.CREDIT,
        }
        req_rec = self.factory.post("/api/v1/sections-comptables/", data=payload, format="json")
        force_authenticate(req_rec, user=self.user_receveur)
        self.assertEqual(create_view(req_rec).status_code, status.HTTP_403_FORBIDDEN)

        update_view = SectionComptableViewSet.as_view({"patch": "partial_update"})
        req_patch = self.factory.patch(
            f"/api/v1/sections-comptables/{self.sec_a.id}/",
            data={"libelle": "Hack"},
            format="json",
        )
        force_authenticate(req_patch, user=self.user_agent)
        self.assertEqual(update_view(req_patch, pk=self.sec_a.id).status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_and_update_ligne(self):
        """Un administrateur peut créer et modifier une ligne comptable."""
        # 1. Création d'une ligne feuille
        create_view = LigneComptableViewSet.as_view({"post": "create"})
        menu_sub_new = int(f"77{self.sec_a.id % 1000:03d}1")
        payload = {
            "section": self.sec_a.id,
            "menu_sub": menu_sub_new,
            "compte": f"NEW_{self.uid}",
            "libelle": "Nouvelle Ligne Imputable",
            "actif": True,
        }
        req_create = self.factory.post("/api/v1/lignes-comptables/", data=payload, format="json")
        force_authenticate(req_create, user=self.user_admin)
        res_create = create_view(req_create)
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        new_ligne_id = res_create.data["id"]
        self.assertEqual(res_create.data["section_code"], self.sec_a.code)

        # 2. Modification par Admin
        update_view = LigneComptableViewSet.as_view({"patch": "partial_update"})
        patch_payload = {"libelle": "Ligne Imputable Modifiée"}
        req_patch = self.factory.patch(
            f"/api/v1/lignes-comptables/{new_ligne_id}/",
            data=patch_payload,
            format="json",
        )
        force_authenticate(req_patch, user=self.user_admin)
        res_patch = update_view(req_patch, pk=new_ligne_id)
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data["libelle"], "Ligne Imputable Modifiée")

    def test_non_admin_cannot_create_or_update_ligne(self):
        """Un receveur ou agent ne peut ni créer ni modifier une ligne comptable (403 Forbidden)."""
        create_view = LigneComptableViewSet.as_view({"post": "create"})
        payload = {
            "section": self.sec_a.id,
            "menu_sub": 999999,
            "compte": "INTERDIT",
            "libelle": "Ligne Non Autorisée",
        }
        req_rec = self.factory.post("/api/v1/lignes-comptables/", data=payload, format="json")
        force_authenticate(req_rec, user=self.user_receveur)
        self.assertEqual(create_view(req_rec).status_code, status.HTTP_403_FORBIDDEN)

        update_view = LigneComptableViewSet.as_view({"patch": "partial_update"})
        req_patch = self.factory.patch(
            f"/api/v1/lignes-comptables/{self.ligne_leaf1.id}/",
            data={"libelle": "Changement Illégal"},
            format="json",
        )
        force_authenticate(req_patch, user=self.user_receveur)
        self.assertEqual(update_view(req_patch, pk=self.ligne_leaf1.id).status_code, status.HTTP_403_FORBIDDEN)

    def test_validation_ligne_parent_meme_section_requise(self):
        """Une ligne fille doit obligatoirement avoir une ligne parente dans la même section."""
        create_view = LigneComptableViewSet.as_view({"post": "create"})
        # self.ligne_b1 est dans sec_b, mais on tente de créer la ligne dans sec_a
        payload = {
            "section": self.sec_a.id,
            "parent": self.ligne_b1.id,
            "menu_sub": int(f"78{self.sec_a.id % 1000:03d}2"),
            "compte": "FAIL01",
            "libelle": "Ligne Incohérente",
        }
        req = self.factory.post("/api/v1/lignes-comptables/", data=payload, format="json")
        force_authenticate(req, user=self.user_admin)
        res = create_view(req)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("parent", res.data)


