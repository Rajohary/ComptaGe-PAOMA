from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from apps.audit.views import EcartsListView, InspecteurDashboardView
from apps.comptabilite.models import (
    SectionComptable,
    LigneComptable,
    Mouvement,
)
from apps.referentiel.models import Province, Bureau, PeriodeGestion

User = get_user_model()


class InspecteurDashboardAPITestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.view_dashboard = InspecteurDashboardView.as_view()
        self.view_ecarts = EcartsListView.as_view()

        # Référentiel
        self.province = Province.objects.create(nprovince=1, nom="Antananarivo")
        self.bureau_1 = Bureau.objects.create(
            province=self.province,
            ncodique=10101,
            nom_bureau="Antaninarenina",
            classe="R1",
        )
        self.bureau_2 = Bureau.objects.create(
            province=self.province,
            ncodique=10102,
            nom_bureau="Tanjombato",
            classe="R2",
        )

        # Utilisateurs
        self.user_inspecteur = User.objects.create_user(
            username="inspecteur1",
            password="Password123!",
            role="INSPECTEUR",
        )
        self.user_admin = User.objects.create_user(
            username="admin1",
            password="Password123!",
            role="ADMIN",
        )
        self.user_receveur = User.objects.create_user(
            username="receveur1",
            password="Password123!",
            role="RECEVEUR",
            bureau_code=10101,
        )
        self.user_agent = User.objects.create_user(
            username="agent1",
            password="Password123!",
            role="AGENT_SAISIE",
            bureau_code=10101,
        )

        # Périodes
        self.periode_1 = PeriodeGestion.objects.create(
            bureau=self.bureau_1,
            receveur=self.user_receveur,
            nom_receveur="Receveur Un",
            date_debut="2026-06-01",
            date_fin="2026-06-30",
            reserve_numeraire=Decimal("100000.00"),
            valeurs_postales=Decimal("50000.00"),
            timbres_fiscaux=Decimal("25000.00"),
            cloturee=False,
        )
        self.periode_2 = PeriodeGestion.objects.create(
            bureau=self.bureau_2,
            nom_receveur="Receveur Deux",
            date_debut="2026-06-01",
            date_fin="2026-06-30",
            reserve_numeraire=Decimal("100000.00"),
            valeurs_postales=Decimal("50000.00"),
            timbres_fiscaux=Decimal("25000.00"),
            cloturee=False,
        )

        # Plan comptable
        self.section = SectionComptable.objects.create(
            code="A",
            libelle="Recettes postales",
            sens=SectionComptable.Sens.DEBIT,
        )
        self.ligne_1 = LigneComptable.objects.create(
            section=self.section,
            menu_sub=101,
            compte="AD01",
            libelle="Vente timbres",
        )
        self.ligne_2 = LigneComptable.objects.create(
            section=self.section,
            menu_sub=102,
            compte="AD02",
            libelle="Colis postaux",
        )

        # Mouvement 1 : sans écart (non retourné)
        self.mvt_normal = Mouvement.objects.create(
            periode_gestion=self.periode_1,
            ligne_comptable=self.ligne_1,
            saisi_par=self.user_receveur,
            date_operation="2026-06-02",
            montant=Decimal("10000.00"),
            augmentation=Decimal("0.00"),
            diminution=Decimal("0.00"),
            montant_rectifie=Decimal("10000.00"),
        )

        # Mouvement 2 : écart rectifié par l'inspecteur
        self.mvt_ecart_rectifie = Mouvement.objects.create(
            periode_gestion=self.periode_1,
            ligne_comptable=self.ligne_1,
            saisi_par=self.user_receveur,
            rectifie_par=self.user_inspecteur,
            date_operation="2026-06-03",
            montant=Decimal("50000.00"),
            augmentation=Decimal("5000.00"),
            diminution=Decimal("0.00"),
            montant_rectifie=Decimal("55000.00"),
            motif_rectification="Sous-déclaration constatée au pointage",
        )

        # Mouvement 3 : écart en attente (non rectifié) sur bureau 2
        self.mvt_ecart_non_rectifie = Mouvement.objects.create(
            periode_gestion=self.periode_2,
            ligne_comptable=self.ligne_2,
            saisi_par=self.user_receveur,
            date_operation="2026-06-04",
            montant=Decimal("80000.00"),
            augmentation=Decimal("0.00"),
            diminution=Decimal("10000.00"),
            montant_rectifie=Decimal("70000.00"),
            motif_rectification="",  # Pas de motif explicité
            rectifie_par=None,
        )

    def test_inspecteur_dashboard_overview(self):
        """L'inspecteur obtient les KPIs complets d'audit et les bureaux impactés."""
        request = self.factory.get("/api/v1/dashboard/inspecteur/")
        force_authenticate(request, user=self.user_inspecteur)
        response = self.view_dashboard(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        kpis = response.data["kpis"]

        self.assertEqual(kpis["total_ecarts_count"], 2)
        self.assertEqual(Decimal(str(kpis["total_montant_declare"])), Decimal("130000.00"))
        self.assertEqual(Decimal(str(kpis["total_montant_rectifie"])), Decimal("125000.00"))
        self.assertEqual(Decimal(str(kpis["total_ecart_net"])), Decimal("-5000.00"))
        self.assertEqual(Decimal(str(kpis["total_ecart_absolu"])), Decimal("15000.00"))
        self.assertEqual(kpis["nb_bureaux_impactes"], 2)
        self.assertEqual(kpis["nb_rectifies"], 1)
        self.assertEqual(kpis["nb_non_rectifies"], 1)
        self.assertEqual(len(kpis["bureaux_avec_ecarts"]), 2)

        derniers = response.data["derniers_ecarts"]
        self.assertEqual(len(derniers), 2)

    def test_ecarts_list_filtering(self):
        """La vue DIF filtre correctement par statut, bureau et recherche."""
        # Filtre non rectifié
        req_non_rectif = self.factory.get("/api/v1/audit/ecarts/?statut=non_rectifie")
        force_authenticate(req_non_rectif, user=self.user_inspecteur)
        res_non_rectif = self.view_ecarts(req_non_rectif)

        self.assertEqual(res_non_rectif.status_code, status.HTTP_200_OK)
        self.assertEqual(res_non_rectif.data["count"], 1)
        self.assertEqual(res_non_rectif.data["results"][0]["id"], self.mvt_ecart_non_rectifie.id)

        # Filtre bureau 10101
        req_bureau = self.factory.get(f"/api/v1/audit/ecarts/?bureau={self.bureau_1.ncodique}")
        force_authenticate(req_bureau, user=self.user_inspecteur)
        res_bureau = self.view_ecarts(req_bureau)

        self.assertEqual(res_bureau.status_code, status.HTTP_200_OK)
        self.assertEqual(res_bureau.data["count"], 1)
        self.assertEqual(res_bureau.data["results"][0]["id"], self.mvt_ecart_rectifie.id)

        # Filtre recherche textuelle
        req_search = self.factory.get("/api/v1/audit/ecarts/?search=Sous-déclaration")
        force_authenticate(req_search, user=self.user_inspecteur)
        res_search = self.view_ecarts(req_search)

        self.assertEqual(res_search.status_code, status.HTTP_200_OK)
        self.assertEqual(res_search.data["count"], 1)

    def test_rbac_inspecteur_only(self):
        """Seuls un inspecteur ou un admin peuvent accéder à la détection d'écarts."""
        req_receveur = self.factory.get("/api/v1/audit/ecarts/")
        force_authenticate(req_receveur, user=self.user_receveur)
        self.assertEqual(self.view_ecarts(req_receveur).status_code, status.HTTP_403_FORBIDDEN)

        req_agent = self.factory.get("/api/v1/dashboard/inspecteur/")
        force_authenticate(req_agent, user=self.user_agent)
        self.assertEqual(self.view_dashboard(req_agent).status_code, status.HTTP_403_FORBIDDEN)

        # Admin est autorisé
        req_admin = self.factory.get("/api/v1/audit/ecarts/")
        force_authenticate(req_admin, user=self.user_admin)
        self.assertEqual(self.view_ecarts(req_admin).status_code, status.HTTP_200_OK)
