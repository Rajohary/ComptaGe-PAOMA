from datetime import date
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.referentiel.models import Province, Bureau, PeriodeGestion
from apps.comptabilite.models import SectionComptable, LigneComptable, Mouvement

User = get_user_model()


class HistoriquePeriodesBureauTests(APITestCase):
    """
    Tests d'intégration pour l'endpoint d'historique des périodes de gestion d'un bureau.
    GET /api/v1/bureaux/{bureau_id}/historique-periodes/
    """

    def setUp(self):
        # Province & Bureaux
        self.province = Province.objects.create(nprovince=1, nom="Antananarivo")
        self.bureau1 = Bureau.objects.create(
            province=self.province,
            ncodique=10101,
            nom_bureau="Antananarivo Gare",
            classe="HC",
        )
        self.bureau2 = Bureau.objects.create(
            province=self.province,
            ncodique=10202,
            nom_bureau="Antsirabe Principal",
            classe="R1",
        )

        # Utilisateurs RBAC
        self.admin = User.objects.create_user(
            username="admin_user",
            password="Password123!",
            role="ADMIN",
        )
        self.inspecteur = User.objects.create_user(
            username="inspecteur_user",
            password="Password123!",
            role="INSPECTEUR",
        )
        self.receveur1 = User.objects.create_user(
            username="receveur1",
            password="Password123!",
            role="RECEVEUR",
            bureau_code="10101",
        )
        self.receveur2 = User.objects.create_user(
            username="receveur2",
            password="Password123!",
            role="RECEVEUR",
            bureau_code="10202",
        )

        # Section et Ligne comptable pour mouvements
        self.section_debit = SectionComptable.objects.create(
            code="A",
            libelle="OBJETS RECUS",
            sens=SectionComptable.Sens.DEBIT,
            ordre=1,
        )
        self.ligne_debit = LigneComptable.objects.create(
            section=self.section_debit,
            compte="A01",
            libelle="Timbres-poste",
            actif=True,
        )

        # Période 1 passée (clôturée) sur bureau 1
        self.p1 = PeriodeGestion.objects.create(
            bureau=self.bureau1,
            nom_receveur="Ancien Receveur",
            date_debut=date(2025, 1, 1),
            date_fin=date(2025, 6, 30),
            cloturee=True,
            solde_debiteur_depart=Decimal("150000.00"),
            solde_crediteur_depart=Decimal("0.00"),
            reserve_numeraire=Decimal("500000.00"),
            valeurs_postales=Decimal("200000.00"),
            timbres_fiscaux=Decimal("50000.00"),
        )
        # Mouvement sur période 1
        Mouvement.objects.create(
            periode_gestion=self.p1,
            ligne_comptable=self.ligne_debit,
            date_operation=date(2025, 2, 10),
            montant=Decimal("25000.00"),
            montant_rectifie=Decimal("25000.00"),
            saisi_par=self.receveur1,
        )

        # Période 2 en cours (ouverte) sur bureau 1
        self.p2 = PeriodeGestion.objects.create(
            bureau=self.bureau1,
            nom_receveur="Nouveau Receveur",
            receveur=self.receveur1,
            date_debut=date(2025, 7, 1),
            date_fin=None,
            cloturee=False,
            solde_debiteur_depart=Decimal("175000.00"),
            solde_crediteur_depart=Decimal("0.00"),
            reserve_numeraire=Decimal("600000.00"),
            valeurs_postales=Decimal("150000.00"),
            timbres_fiscaux=Decimal("30000.00"),
        )

    def test_anonyme_rejet_401(self):
        url = reverse("bureau-historique-periodes", kwargs={"bureau_id": self.bureau1.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_bureau_inexistant_404(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("bureau-historique-periodes", kwargs={"bureau_id": 999999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_acces_complet_par_id(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("bureau-historique-periodes", kwargs={"bureau_id": self.bureau1.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data["total_periodes"], 2)
        self.assertEqual(data["periodes_cloturees"], 1)
        self.assertIsNotNone(data["periode_en_cours"])
        self.assertEqual(data["periode_en_cours"]["id"], self.p2.id)
        self.assertEqual(len(data["historique"]), 2)

        # Vérifier premier item
        p1_data = data["historique"][0]
        self.assertEqual(p1_data["id"], self.p1.id)
        self.assertEqual(p1_data["nom_receveur"], "Ancien Receveur")
        self.assertTrue(p1_data["cloturee"])
        self.assertEqual(p1_data["total_encaisse_depart"], "750000.00")
        self.assertEqual(p1_data["nb_mouvements"], 1)
        self.assertEqual(p1_data["total_debit"], "25000.00")

    def test_admin_acces_par_ncodique(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("bureau-historique-periodes", kwargs={"bureau_id": "10101"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["bureau"]["ncodique"], 10101)

    def test_inspecteur_acces_tout_bureau(self):
        self.client.force_authenticate(user=self.inspecteur)
        url = reverse("bureau-historique-periodes", kwargs={"bureau_id": self.bureau1.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_receveur_acces_son_propre_bureau_autorise(self):
        self.client.force_authenticate(user=self.receveur1)
        url = reverse("bureau-historique-periodes", kwargs={"bureau_id": self.bureau1.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["bureau"]["ncodique"], 10101)

    def test_receveur_acces_autre_bureau_interdit_403(self):
        self.client.force_authenticate(user=self.receveur1)
        url = reverse("bureau-historique-periodes", kwargs={"bureau_id": self.bureau2.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Accès refusé", response.data["detail"])
