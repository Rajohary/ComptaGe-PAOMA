import unittest
import uuid
from decimal import Decimal
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from apps.referentiel.models import Province, Bureau, PeriodeGestion
from apps.comptabilite.models import SectionComptable, LigneComptable, Mouvement
from apps.comptabilite.views import MouvementViewSet
from django.contrib.auth import get_user_model

User = get_user_model()


class MockUser:
    """Mock utilisateur pour tests RBAC."""
    def __init__(self, is_auth=True, role="AGENT_SAISIE", bureau_code=None, pk=1, username="test_agent"):
        self.is_authenticated = is_auth
        self.is_staff = False
        self.is_superuser = False
        self.role = role
        self.bureau_code = bureau_code
        self.pk = pk
        self.id = pk
        self.username = username


class MouvementAPITestCase(unittest.TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.uid = uuid.uuid4().hex[:6].upper()

        self.province = Province.objects.create(
            nprovince=50 + (int(self.uid, 16) % 10),
            nom=f"Province API Mvt {self.uid}",
        )
        self.ncodique = 50100 + (int(self.uid, 16) % 800)
        self.bureau = Bureau.objects.create(
            province=self.province,
            ncodique=self.ncodique,
            nom_bureau=f"Bureau API Mvt {self.uid}",
            classe="R1",
        )
        self.periode = PeriodeGestion.objects.create(
            bureau=self.bureau,
            nom_receveur="Receveur API Test",
            date_debut="2026-06-01",
            date_fin="2026-06-30",
            reserve_numeraire=100000,
            valeurs_postales=50000,
            timbres_fiscaux=20000,
            cloturee=False,
        )
        self.user = User.objects.create_user(
            username=f"user_api_{self.uid}",
            password="StrongPass123!",
            role="AGENT_SAISIE",
            bureau_code=self.ncodique,
        )
        self.sec = SectionComptable.objects.create(
            code=f"SA_{self.uid}",
            libelle="Section API Test",
            sens=SectionComptable.Sens.DEBIT,
        )
        self.ligne = LigneComptable.objects.create(
            section=self.sec,
            menu_sub=int(f"50{self.sec.id % 1000:03d}1"),
            compte="API01",
            libelle="Ligne API Imputable",
            actif=True,
        )

    def tearDown(self):
        Mouvement.objects.filter(periode_gestion=self.periode).delete()
        self.ligne.delete()
        self.sec.delete()
        self.periode.delete()
        self.bureau.delete()
        self.province.delete()
        self.user.delete()

    def test_mouvement_create_success(self):
        """Création réussie d'un mouvement avec initialisation stricte de montant_rectifie."""
        view = MouvementViewSet.as_view({"post": "create"})
        payload = {
            "periode_gestion": self.periode.id,
            "ligne_comptable": self.ligne.id,
            "date_operation": "2026-06-15",
            "montant": "25000.00",
        }
        req = self.factory.post("/api/v1/mouvements/", payload, format="json")
        force_authenticate(req, user=self.user)
        resp = view(req)

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["montant"], "25000.00")
        self.assertEqual(resp.data["montant_rectifie"], "25000.00")
        self.assertEqual(resp.data["augmentation"], "0.00")
        self.assertEqual(resp.data["diminution"], "0.00")
        self.assertFalse(resp.data["a_ecart"])
        self.assertEqual(resp.data["saisi_par_username"], self.user.username)
        self.assertIsNotNone(resp.data["ligne_detail"])
        self.assertEqual(resp.data["ligne_detail"]["compte"], "API01")

    def test_mouvement_list_and_filters(self):
        """Consultation de la liste des mouvements avec filtres par période et par section."""
        # Création préalable
        mvt = Mouvement.objects.create(
            periode_gestion=self.periode,
            ligne_comptable=self.ligne,
            saisi_par=self.user,
            date_operation="2026-06-12",
            montant=Decimal("12000.00"),
            montant_rectifie=Decimal("12000.00"),
        )

        view = MouvementViewSet.as_view({"get": "list"})
        req = self.factory.get(f"/api/v1/mouvements/?periode={self.periode.id}&section={self.sec.code}")
        force_authenticate(req, user=self.user)
        resp = view(req)

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in resp.data["results"]]
        self.assertIn(mvt.id, ids)

    def test_mouvement_update_success(self):
        """Modification d'un mouvement par l'opérateur avant audit."""
        mvt = Mouvement.objects.create(
            periode_gestion=self.periode,
            ligne_comptable=self.ligne,
            saisi_par=self.user,
            date_operation="2026-06-12",
            montant=Decimal("12000.00"),
            montant_rectifie=Decimal("12000.00"),
        )

        view = MouvementViewSet.as_view({"patch": "partial_update"})
        req = self.factory.patch(f"/api/v1/mouvements/{mvt.id}/", {"montant": "17500.00"}, format="json")
        force_authenticate(req, user=self.user)
        resp = view(req, pk=mvt.id)

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["montant"], "17500.00")
        self.assertEqual(resp.data["montant_rectifie"], "17500.00")

    def test_mouvement_delete_periode_cloturee_rejected(self):
        """Suppression refusée sur une période clôturée."""
        mvt = Mouvement.objects.create(
            periode_gestion=self.periode,
            ligne_comptable=self.ligne,
            saisi_par=self.user,
            date_operation="2026-06-12",
            montant=Decimal("12000.00"),
            montant_rectifie=Decimal("12000.00"),
        )

        self.periode.cloturee = True
        self.periode.save()

        view = MouvementViewSet.as_view({"delete": "destroy"})
        req = self.factory.delete(f"/api/v1/mouvements/{mvt.id}/")
        force_authenticate(req, user=self.user)
        resp = view(req, pk=mvt.id)

        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Mouvement.objects.filter(id=mvt.id).exists())


class MouvementEncaisseAPITestCase(unittest.TestCase):
    def setUp(self):
        from apps.comptabilite.models import RubriqueEncaisseParent, RubriqueEncaisse, MouvementEncaisse
        from apps.comptabilite.views import MouvementEncaisseViewSet, RubriqueEncaisseViewSet

        self.factory = APIRequestFactory()
        self.uid = uuid.uuid4().hex[:6].upper()

        self.province = Province.objects.create(
            nprovince=40 + (int(self.uid, 16) % 10),
            nom=f"Province Enc {self.uid}",
        )
        self.ncodique = 40100 + (int(self.uid, 16) % 800)
        self.bureau = Bureau.objects.create(
            province=self.province,
            ncodique=self.ncodique,
            nom_bureau=f"Bureau Enc {self.uid}",
            classe="R1",
        )
        self.periode = PeriodeGestion.objects.create(
            bureau=self.bureau,
            nom_receveur="Receveur Enc Test",
            date_debut="2026-06-01",
            date_fin="2026-06-30",
            reserve_numeraire=100000,
            valeurs_postales=50000,
            timbres_fiscaux=20000,
            cloturee=False,
        )
        self.user = User.objects.create_user(
            username=f"user_enc_{self.uid}",
            password="StrongPass123!",
            role="RECEVEUR",
            bureau_code=self.ncodique,
        )
        self.parent_enc = RubriqueEncaisseParent.objects.create(
            id_encaisse=900 + (int(self.uid, 16) % 100),
            libelle=f"Encaisse Parent {self.uid}",
        )
        self.rubrique_enc = RubriqueEncaisse.objects.create(
            rubrique_parent=self.parent_enc,
            menu_sub=9000 + (int(self.uid, 16) % 1000),
            compte="TR_T",
            libelle="Trésorerie Test",
        )

    def tearDown(self):
        from apps.comptabilite.models import MouvementEncaisse
        MouvementEncaisse.objects.filter(periode_gestion=self.periode).delete()
        self.rubrique_enc.delete()
        self.parent_enc.delete()
        self.periode.delete()
        self.bureau.delete()
        self.province.delete()
        self.user.delete()

    def test_mouvement_encaisse_create_and_list(self):
        """Création d'un flux d'encaisse (entrée) et listing."""
        from apps.comptabilite.views import MouvementEncaisseViewSet

        view_create = MouvementEncaisseViewSet.as_view({"post": "create"})
        payload = {
            "periode_gestion": self.periode.id,
            "rubrique_encaisse": self.rubrique_enc.id,
            "sens": 1,  # Entrée
            "date_operation": "2026-06-05",
            "montant": "150000.00",
        }
        req = self.factory.post("/api/v1/mouvements-encaisse/", payload, format="json")
        force_authenticate(req, user=self.user)
        resp = view_create(req)

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["sens"], 1)
        self.assertEqual(resp.data["sens_libelle"], "Entrée")
        self.assertEqual(resp.data["montant"], "150000.00")
        self.assertEqual(resp.data["rubrique_detail"]["compte"], "TR_T")
        enc_id = resp.data["id"]

        # Listing filtré
        view_list = MouvementEncaisseViewSet.as_view({"get": "list"})
        req_list = self.factory.get(f"/api/v1/mouvements-encaisse/?periode={self.periode.id}&sens=1")
        force_authenticate(req_list, user=self.user)
        resp_list = view_list(req_list)

        self.assertEqual(resp_list.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in resp_list.data["results"]]
        self.assertIn(enc_id, ids)

    def test_mouvement_encaisse_periode_cloturee_rejected(self):
        """Enregistrement refusé sur une période clôturée."""
        from apps.comptabilite.views import MouvementEncaisseViewSet

        self.periode.cloturee = True
        self.periode.save()

        view = MouvementEncaisseViewSet.as_view({"post": "create"})
        payload = {
            "periode_gestion": self.periode.id,
            "rubrique_encaisse": self.rubrique_enc.id,
            "sens": 2,  # Sortie
            "date_operation": "2026-06-05",
            "montant": "50000.00",
        }
        req = self.factory.post("/api/v1/mouvements-encaisse/", payload, format="json")
        force_authenticate(req, user=self.user)
        resp = view(req)

        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("periode_gestion", resp.data)


class SituationComptableAPITestCase(unittest.TestCase):
    def setUp(self):
        from apps.comptabilite.views import SituationComptableView

        self.factory = APIRequestFactory()
        self.uid = uuid.uuid4().hex[:6].upper()

        self.province = Province.objects.create(
            nprovince=30 + (int(self.uid, 16) % 10),
            nom=f"Province Sit {self.uid}",
        )
        self.ncodique = 30100 + (int(self.uid, 16) % 800)
        self.bureau = Bureau.objects.create(
            province=self.province,
            ncodique=self.ncodique,
            nom_bureau=f"Bureau Sit {self.uid}",
            classe="R1",
        )

        # Période 1 : Mai 2026 (clôturée avec excédent débiteur)
        self.periode_mai = PeriodeGestion.objects.create(
            bureau=self.bureau,
            nom_receveur="Receveur Jean",
            date_debut="2026-05-01",
            date_fin="2026-05-31",
            reserve_numeraire=100000,
            valeurs_postales=50000,
            timbres_fiscaux=20000,
            solde_debiteur_depart=Decimal("0.00"),
            solde_crediteur_depart=Decimal("0.00"),
            cloturee=True,
        )

        # Période 2 : Juin 2026 (en cours, succède à Mai 2026)
        self.periode_juin = PeriodeGestion.objects.create(
            bureau=self.bureau,
            nom_receveur="Receveur Jean",
            date_debut="2026-06-01",
            date_fin="2026-06-30",
            reserve_numeraire=150000,
            valeurs_postales=50000,
            timbres_fiscaux=20000,
            solde_debiteur_depart=Decimal("0.00"),
            solde_crediteur_depart=Decimal("0.00"),
            cloturee=False,
        )

        self.user_receveur = User.objects.create_user(
            username=f"user_sit_rec_{self.uid}",
            password="StrongPass123!",
            role="RECEVEUR",
            bureau_code=self.ncodique,
        )
        self.user_autre_bureau = User.objects.create_user(
            username=f"user_sit_autre_{self.uid}",
            password="StrongPass123!",
            role="RECEVEUR",
            bureau_code=99999,
        )
        self.user_inspecteur = User.objects.create_user(
            username=f"user_sit_insp_{self.uid}",
            password="StrongPass123!",
            role="INSPECTEUR",
        )

        # Sections comptables Débit (A) et Crédit (B)
        self.sec_a = SectionComptable.objects.create(
            code=f"SA_{self.uid}",
            libelle="Section A Débit",
            sens=SectionComptable.Sens.DEBIT,
        )
        self.sec_b = SectionComptable.objects.create(
            code=f"SB_{self.uid}",
            libelle="Section B Crédit",
            sens=SectionComptable.Sens.CREDIT,
        )

        self.ligne_a = LigneComptable.objects.create(
            section=self.sec_a,
            menu_sub=int(f"31{self.sec_a.id % 1000:03d}1"),
            compte="SIT_A",
            libelle="Produit Débit Sit",
            actif=True,
        )
        self.ligne_b = LigneComptable.objects.create(
            section=self.sec_b,
            menu_sub=int(f"32{self.sec_b.id % 1000:03d}2"),
            compte="SIT_B",
            libelle="Produit Crédit Sit",
            actif=True,
        )

    def tearDown(self):
        Mouvement.objects.filter(periode_gestion__in=[self.periode_mai, self.periode_juin]).delete()
        self.ligne_a.delete()
        self.ligne_b.delete()
        self.sec_a.delete()
        self.sec_b.delete()
        self.periode_juin.delete()
        self.periode_mai.delete()
        self.bureau.delete()
        self.province.delete()
        self.user_receveur.delete()
        self.user_autre_bureau.delete()
        self.user_inspecteur.delete()

    def test_situation_comptable_report_solde_automatique(self):
        """
        Vérifie le calcul de la Situation Comptable avec report automatique du solde :
          - En Mai : Débit 100 000, Crédit 40 000 -> Solde débiteur fin = 60 000.
          - En Juin : Report débiteur = 60 000.
                      Mouvements Juin : Débit 20 000, Crédit 30 000.
                      Cumul Débit = 80 000, Cumul Crédit = 30 000 -> Solde débiteur fin = 50 000.
        """
        from apps.comptabilite.views import SituationComptableView

        # 1. Écritures de Mai
        Mouvement.objects.create(
            periode_gestion=self.periode_mai,
            ligne_comptable=self.ligne_a,
            saisi_par=self.user_receveur,
            date_operation="2026-05-15",
            montant=Decimal("100000.00"),
            montant_rectifie=Decimal("100000.00"),
        )
        Mouvement.objects.create(
            periode_gestion=self.periode_mai,
            ligne_comptable=self.ligne_b,
            saisi_par=self.user_receveur,
            date_operation="2026-05-20",
            montant=Decimal("40000.00"),
            montant_rectifie=Decimal("40000.00"),
        )

        # 2. Écritures de Juin
        Mouvement.objects.create(
            periode_gestion=self.periode_juin,
            ligne_comptable=self.ligne_a,
            saisi_par=self.user_receveur,
            date_operation="2026-06-10",
            montant=Decimal("20000.00"),
            montant_rectifie=Decimal("20000.00"),
        )
        Mouvement.objects.create(
            periode_gestion=self.periode_juin,
            ligne_comptable=self.ligne_b,
            saisi_par=self.user_receveur,
            date_operation="2026-06-15",
            montant=Decimal("30000.00"),
            montant_rectifie=Decimal("30000.00"),
        )

        # 3. Appel de l'endpoint pour Juin
        view = SituationComptableView.as_view()
        req = self.factory.get(f"/api/v1/situation-comptable/{self.periode_juin.id}/")
        force_authenticate(req, user=self.user_receveur)
        resp = view(req, periode_id=self.periode_juin.id)

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data

        # Vérification du report automatique
        self.assertEqual(data["periode_precedente_id"], self.periode_mai.id)
        self.assertEqual(Decimal(str(data["solde_debiteur_reporte"])), Decimal("60000.00"))
        self.assertEqual(Decimal(str(data["solde_crediteur_reporte"])), Decimal("0.00"))

        # Vérification des mouvements du mois
        self.assertEqual(Decimal(str(data["total_debit_mois"])), Decimal("20000.00"))
        self.assertEqual(Decimal(str(data["total_credit_mois"])), Decimal("30000.00"))

        # Vérification des cumuls généraux
        self.assertEqual(Decimal(str(data["cumul_debit"])), Decimal("80000.00"))
        self.assertEqual(Decimal(str(data["cumul_credit"])), Decimal("30000.00"))

        # Vérification du solde final de clôture
        self.assertEqual(Decimal(str(data["solde_debiteur_fin"])), Decimal("50000.00"))
        self.assertEqual(Decimal(str(data["solde_crediteur_fin"])), Decimal("0.00"))

    def test_situation_comptable_rbac_isolation(self):
        """Un receveur ne peut pas consulter la situation d'un autre bureau."""
        from apps.comptabilite.views import SituationComptableView

        view = SituationComptableView.as_view()
        req = self.factory.get(f"/api/v1/situation-comptable/{self.periode_juin.id}/")
        force_authenticate(req, user=self.user_autre_bureau)
        resp = view(req, periode_id=self.periode_juin.id)

        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

        # Un inspecteur y a accès
        req_insp = self.factory.get(f"/api/v1/situation-comptable/{self.periode_juin.id}/")
        force_authenticate(req_insp, user=self.user_inspecteur)
        resp_insp = view(req_insp, periode_id=self.periode_juin.id)
        self.assertEqual(resp_insp.status_code, status.HTTP_200_OK)
