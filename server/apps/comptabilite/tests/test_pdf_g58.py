from decimal import Decimal
import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from apps.referentiel.models import Province, Bureau, PeriodeGestion
from apps.comptabilite.models import SectionComptable, LigneComptable, Mouvement
from apps.comptabilite.views import BordereauG58PdfView

User = get_user_model()


class BordereauG58PdfAPITestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.uid = uuid.uuid4().hex[:6].upper()

        self.province = Province.objects.create(
            nprovince=80 + (int(self.uid, 16) % 10),
            nom=f"Province PDF {self.uid}",
        )
        self.bureau_1 = Bureau.objects.create(
            province=self.province,
            ncodique=70000 + (int(self.uid, 16) % 1000),
            nom_bureau=f"Bureau PDF 1 {self.uid}",
            classe="R1",
        )
        self.bureau_2 = Bureau.objects.create(
            province=self.province,
            ncodique=71000 + (int(self.uid, 16) % 1000),
            nom_bureau=f"Bureau PDF 2 {self.uid}",
            classe="R2",
        )

        self.user_admin = User.objects.create_user(
            username=f"admin_{self.uid}",
            password="Password123!",
            role="ADMIN",
        )
        self.user_inspecteur = User.objects.create_user(
            username=f"inspecteur_{self.uid}",
            password="Password123!",
            role="INSPECTEUR",
        )
        self.user_receveur_1 = User.objects.create_user(
            username=f"rec1_{self.uid}",
            password="Password123!",
            role="RECEVEUR",
            bureau_code=self.bureau_1.ncodique,
        )
        self.user_receveur_2 = User.objects.create_user(
            username=f"rec2_{self.uid}",
            password="Password123!",
            role="RECEVEUR",
            bureau_code=self.bureau_2.ncodique,
        )

        self.periode_1 = PeriodeGestion.objects.create(
            bureau=self.bureau_1,
            receveur=self.user_receveur_1,
            nom_receveur="Receveur Un",
            date_debut="2026-06-01",
            date_fin="2026-06-30",
            reserve_numeraire=Decimal("150000.00"),
            valeurs_postales=Decimal("50000.00"),
            timbres_fiscaux=Decimal("20000.00"),
            solde_debiteur_depart=Decimal("10000.00"),
            solde_crediteur_depart=Decimal("0.00"),
            cloturee=False,
        )

        self.sec_debit = SectionComptable.objects.create(
            code=f"D_{self.uid[:2]}",
            libelle="Section Débit Test",
            sens=SectionComptable.Sens.DEBIT,
            ordre=1,
        )
        self.ligne_debit = LigneComptable.objects.create(
            section=self.sec_debit,
            compte="AD01",
            libelle="Vente timbres",
            menu_sub=88000 + (int(self.uid, 16) % 1000),
        )

        self.mouvement = Mouvement.objects.create(
            periode_gestion=self.periode_1,
            ligne_comptable=self.ligne_debit,
            saisi_par=self.user_receveur_1,
            date_operation="2026-06-15",
            montant=Decimal("25000.00"),
            augmentation=Decimal("5000.00"),
            diminution=Decimal("0.00"),
            montant_rectifie=Decimal("30000.00"),
            motif_rectification="Ajustement",
        )

    def test_pdf_unauthenticated_forbidden(self):
        """Un utilisateur non connecté ne peut pas télécharger le PDF."""
        view = BordereauG58PdfView.as_view()
        req = self.factory.get(f"/api/v1/bordereau-g58/{self.periode_1.id}/pdf/")
        resp = view(req, periode_id=self.periode_1.id)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_pdf_admin_can_download(self):
        """L'administrateur peut télécharger le PDF de n'importe quel bureau."""
        view = BordereauG58PdfView.as_view()
        req = self.factory.get(f"/api/v1/bordereau-g58/{self.periode_1.id}/pdf/")
        force_authenticate(req, user=self.user_admin)
        resp = view(req, periode_id=self.periode_1.id)

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp["Content-Type"], "application/pdf")
        self.assertIn("inline; filename=", resp["Content-Disposition"])
        self.assertTrue(resp.content.startswith(b"%PDF-"))

    def test_pdf_inspecteur_can_download(self):
        """L'inspecteur peut télécharger le PDF de tout bureau pour audit."""
        view = BordereauG58PdfView.as_view()
        req = self.factory.get(f"/api/v1/bordereau-g58/{self.periode_1.id}/pdf/")
        force_authenticate(req, user=self.user_inspecteur)
        resp = view(req, periode_id=self.periode_1.id)

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp["Content-Type"], "application/pdf")
        self.assertTrue(resp.content.startswith(b"%PDF-"))

    def test_pdf_receveur_allowed_for_own_bureau(self):
        """Un receveur peut télécharger le PDF de son propre bureau."""
        view = BordereauG58PdfView.as_view()
        req = self.factory.get(f"/api/v1/bordereau-g58/{self.periode_1.id}/pdf/")
        force_authenticate(req, user=self.user_receveur_1)
        resp = view(req, periode_id=self.periode_1.id)

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp["Content-Type"], "application/pdf")
        self.assertTrue(resp.content.startswith(b"%PDF-"))

    def test_pdf_receveur_forbidden_for_other_bureau(self):
        """Un receveur ne peut PAS télécharger le PDF d'un autre bureau (HTTP 403)."""
        view = BordereauG58PdfView.as_view()
        req = self.factory.get(f"/api/v1/bordereau-g58/{self.periode_1.id}/pdf/")
        force_authenticate(req, user=self.user_receveur_2)
        resp = view(req, periode_id=self.periode_1.id)

        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_pdf_not_found(self):
        """Une période inexistante renvoie 404 Not Found."""
        view = BordereauG58PdfView.as_view()
        req = self.factory.get("/api/v1/bordereau-g58/999999/pdf/")
        force_authenticate(req, user=self.user_admin)
        resp = view(req, periode_id=999999)

        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
