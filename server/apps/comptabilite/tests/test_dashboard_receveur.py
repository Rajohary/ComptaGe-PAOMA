from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from apps.comptabilite.views import ReceveurDashboardView
from apps.comptabilite.models import (
    SectionComptable,
    LigneComptable,
    RubriqueEncaisseParent,
    RubriqueEncaisse,
    Mouvement,
    MouvementEncaisse,
)
from apps.referentiel.models import Province, Bureau, PeriodeGestion

User = get_user_model()


class ReceveurDashboardAPITestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = ReceveurDashboardView.as_view()

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
        self.user_receveur_1 = User.objects.create_user(
            username="receveur1",
            password="Password123!",
            role="RECEVEUR",
            bureau_code=10101,
        )
        self.user_receveur_2 = User.objects.create_user(
            username="receveur2",
            password="Password123!",
            role="RECEVEUR",
            bureau_code=10102,
        )
        self.user_agent_1 = User.objects.create_user(
            username="agent1",
            password="Password123!",
            role="AGENT_SAISIE",
            bureau_code=10101,
        )
        self.user_admin = User.objects.create_user(
            username="admin1",
            password="Password123!",
            role="ADMIN",
        )

        # Période de gestion bureau 1
        self.periode_1 = PeriodeGestion.objects.create(
            bureau=self.bureau_1,
            receveur=self.user_receveur_1,
            nom_receveur="Receveur Un",
            date_debut="2026-06-01",
            date_fin="2026-06-30",
            reserve_numeraire=Decimal("500000.00"),
            valeurs_postales=Decimal("200000.00"),
            timbres_fiscaux=Decimal("100000.00"),
            solde_debiteur_depart=Decimal("0.00"),
            solde_crediteur_depart=Decimal("0.00"),
            cloturee=False,
        )

        # Sections comptables
        self.section_a = SectionComptable.objects.create(
            code="A",
            libelle="Opérations de débit",
            sens=SectionComptable.Sens.DEBIT,
            ordre=1,
            actif=True,
        )
        self.section_b = SectionComptable.objects.create(
            code="B",
            libelle="Opérations de crédit",
            sens=SectionComptable.Sens.CREDIT,
            ordre=2,
            actif=True,
        )

        # Lignes comptables
        self.ligne_a1 = LigneComptable.objects.create(
            section=self.section_a,
            menu_sub=101,
            compte="AD01",
            libelle="Vente de timbres poste",
            actif=True,
        )
        self.ligne_b1 = LigneComptable.objects.create(
            section=self.section_b,
            menu_sub=201,
            compte="BD01",
            libelle="Paiement mandats",
            actif=True,
        )

        # Mouvements comptables
        self.mvt_1 = Mouvement.objects.create(
            periode_gestion=self.periode_1,
            ligne_comptable=self.ligne_a1,
            saisi_par=self.user_receveur_1,
            date_operation="2026-06-05",
            montant=Decimal("150000.00"),
            augmentation=Decimal("0.00"),
            diminution=Decimal("0.00"),
            montant_rectifie=Decimal("150000.00"),
        )
        self.mvt_2 = Mouvement.objects.create(
            periode_gestion=self.periode_1,
            ligne_comptable=self.ligne_b1,
            saisi_par=self.user_receveur_1,
            date_operation="2026-06-06",
            montant=Decimal("50000.00"),
            augmentation=Decimal("10000.00"),
            diminution=Decimal("0.00"),
            montant_rectifie=Decimal("60000.00"),  # Écart détecté
            motif_rectification="Redressement inspecteur",
        )

        # Rubriques et mouvements d'encaisse
        self.enc_parent = RubriqueEncaisseParent.objects.create(
            id_encaisse=1, libelle="Trésorerie et flux"
        )
        self.rubrique_tr = RubriqueEncaisse.objects.create(
            rubrique_parent=self.enc_parent,
            menu_sub=1,
            compte="TR",
            libelle="Espèces en caisse",
        )
        self.mvt_enc_1 = MouvementEncaisse.objects.create(
            periode_gestion=self.periode_1,
            rubrique_encaisse=self.rubrique_tr,
            saisi_par=self.user_receveur_1,
            sens=MouvementEncaisse.SensEncaisse.ENTREE,
            date_operation="2026-06-05",
            montant=Decimal("70000.00"),
        )
        self.mvt_enc_2 = MouvementEncaisse.objects.create(
            periode_gestion=self.periode_1,
            rubrique_encaisse=self.rubrique_tr,
            saisi_par=self.user_receveur_1,
            sens=MouvementEncaisse.SensEncaisse.SORTIE,
            date_operation="2026-06-06",
            montant=Decimal("20000.00"),
        )

    def test_receveur_dashboard_nominal(self):
        """Un receveur accède à son tableau de bord avec progression de saisie et encaisse exacte."""
        request = self.factory.get("/api/v1/dashboard/receveur/")
        force_authenticate(request, user=self.user_receveur_1)
        response = self.view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        # Bureau & Période
        self.assertEqual(data["bureau"]["ncodique"], 10101)
        self.assertEqual(data["bureau"]["nom_bureau"], "Antaninarenina")
        self.assertTrue(data["has_active_periode"])
        self.assertEqual(data["periode"]["id"], self.periode_1.id)

        # Totaux mouvements
        totaux = data["totaux_mouvements"]
        self.assertEqual(totaux["nb_mouvements"], 2)
        self.assertEqual(Decimal(str(totaux["total_debit"])), Decimal("150000.00"))
        self.assertEqual(Decimal(str(totaux["total_credit"])), Decimal("60000.00"))
        self.assertEqual(Decimal(str(totaux["solde_mouvements"])), Decimal("90000.00"))
        self.assertEqual(totaux["nb_ecarts"], 1)

        # Sections
        sections = {s["code"]: s for s in data["progression_sections"]}
        self.assertIn("A", sections)
        self.assertIn("B", sections)
        self.assertEqual(sections["A"]["nb_mouvements"], 1)
        self.assertEqual(Decimal(str(sections["A"]["total_montant"])), Decimal("150000.00"))
        self.assertEqual(sections["B"]["nb_mouvements"], 1)
        self.assertEqual(Decimal(str(sections["B"]["total_rectifie"])), Decimal("60000.00"))

        # Encaisse (500000 + 70000 - 20000 = 550000)
        enc = data["encaisse"]
        self.assertEqual(Decimal(str(enc["reserve_numeraire_depart"])), Decimal("500000.00"))
        self.assertEqual(Decimal(str(enc["total_entrees_encaisse"])), Decimal("70000.00"))
        self.assertEqual(Decimal(str(enc["total_sorties_encaisse"])), Decimal("20000.00"))
        self.assertEqual(Decimal(str(enc["variation_nette"])), Decimal("50000.00"))
        self.assertEqual(Decimal(str(enc["montant_caisse_actuel"])), Decimal("550000.00"))

    def test_receveur_interdiction_autre_bureau(self):
        """Un receveur ne peut pas accéder aux données d'un autre bureau (403 Forbidden)."""
        request = self.factory.get(f"/api/v1/dashboard/receveur/?bureau={self.bureau_2.id}")
        force_authenticate(request, user=self.user_receveur_1)
        response = self.view(request)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("pas autorisé", response.data["detail"])

    def test_agent_saisie_same_bureau_allowed(self):
        """Un agent de saisie rattaché au bureau a accès au dashboard de son bureau."""
        request = self.factory.get("/api/v1/dashboard/receveur/")
        force_authenticate(request, user=self.user_agent_1)
        response = self.view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["bureau"]["ncodique"], 10101)

    def test_admin_can_query_any_bureau(self):
        """Un administrateur peut consulter le tableau de bord de n'importe quel bureau."""
        request = self.factory.get(f"/api/v1/dashboard/receveur/?bureau={self.bureau_1.id}")
        force_authenticate(request, user=self.user_admin)
        response = self.view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["bureau"]["ncodique"], 10101)

    def test_unauthenticated_request_rejected(self):
        """Une requête non authentifiée est rejetée (401 Unauthorized)."""
        request = self.factory.get("/api/v1/dashboard/receveur/")
        response = self.view(request)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_bureau_sans_periode_active(self):
        """Un bureau sans période active renvoie une réponse propre has_active_periode=False."""
        request = self.factory.get(f"/api/v1/dashboard/receveur/?bureau={self.bureau_2.id}")
        force_authenticate(request, user=self.user_receveur_2)
        response = self.view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["has_active_periode"])
        self.assertEqual(response.data["bureau"]["ncodique"], 10102)
