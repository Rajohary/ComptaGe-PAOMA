from decimal import Decimal
import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from apps.referentiel.models import Province, Bureau, PeriodeGestion
from apps.comptabilite.models import SectionComptable, LigneComptable, Mouvement, RubriqueEncaisseParent, RubriqueEncaisse, MouvementEncaisse
from apps.comptabilite.views import ExportEcrituresExcelView

User = get_user_model()


class ExportEcrituresExcelAPITestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.uid = uuid.uuid4().hex[:6].upper()

        self.province = Province.objects.create(
            nprovince=85 + (int(self.uid, 16) % 10),
            nom=f"Province Excel {self.uid}",
        )
        self.bureau_1 = Bureau.objects.create(
            province=self.province,
            ncodique=75000 + (int(self.uid, 16) % 1000),
            nom_bureau=f"Bureau Excel 1 {self.uid}",
            classe="R1",
        )
        self.bureau_2 = Bureau.objects.create(
            province=self.province,
            ncodique=76000 + (int(self.uid, 16) % 1000),
            nom_bureau=f"Bureau Excel 2 {self.uid}",
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
            nom_receveur="Receveur Excel Test",
            date_debut="2026-07-01",
            date_fin="2026-07-31",
            reserve_numeraire=Decimal("200000.00"),
            valeurs_postales=Decimal("60000.00"),
            timbres_fiscaux=Decimal("15000.00"),
            solde_debiteur_depart=Decimal("15000.00"),
            solde_crediteur_depart=Decimal("0.00"),
            cloturee=False,
        )

        self.sec_debit = SectionComptable.objects.create(
            code=f"E_{self.uid[:2]}",
            libelle="Section Débit Excel",
            sens=SectionComptable.Sens.DEBIT,
            ordre=1,
        )
        self.ligne_debit = LigneComptable.objects.create(
            section=self.sec_debit,
            compte="ED01",
            libelle="Prestation colis",
            menu_sub=89000 + (int(self.uid, 16) % 1000),
        )

        self.mouvement = Mouvement.objects.create(
            periode_gestion=self.periode_1,
            ligne_comptable=self.ligne_debit,
            saisi_par=self.user_receveur_1,
            date_operation="2026-07-10",
            montant=Decimal("45000.00"),
            augmentation=Decimal("5000.00"),
            diminution=Decimal("0.00"),
            montant_rectifie=Decimal("50000.00"),
            motif_rectification="Ajustement Excel",
        )

        self.rub_parent = RubriqueEncaisseParent.objects.create(
            id_encaisse=90 + (int(self.uid, 16) % 10),
            libelle="TRÉSORERIE TEST",
        )
        self.rub = RubriqueEncaisse.objects.create(
            rubrique_parent=self.rub_parent,
            compte="TR01",
            libelle="Numéraire Caisse",
            menu_sub=91000 + (int(self.uid, 16) % 1000),
        )
        self.mvt_enc = MouvementEncaisse.objects.create(
            periode_gestion=self.periode_1,
            rubrique_encaisse=self.rub,
            saisi_par=self.user_receveur_1,
            sens=1,
            date_operation="2026-07-10",
            montant=Decimal("50000.00"),
        )

    def test_excel_unauthenticated_forbidden(self):
        """Un utilisateur non authentifié ne peut pas exporter en Excel."""
        view = ExportEcrituresExcelView.as_view()
        req = self.factory.get(f"/api/v1/mouvements/export-excel/?periode_id={self.periode_1.id}")
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_excel_missing_periode_bad_request(self):
        """L'absence de periode_id renvoie 400 Bad Request."""
        view = ExportEcrituresExcelView.as_view()
        req = self.factory.get("/api/v1/mouvements/export-excel/")
        force_authenticate(req, user=self.user_admin)
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_excel_admin_can_export(self):
        """L'administrateur peut exporter le classeur Excel complet."""
        view = ExportEcrituresExcelView.as_view()
        req = self.factory.get(f"/api/v1/mouvements/export-excel/?periode_id={self.periode_1.id}")
        force_authenticate(req, user=self.user_admin)
        resp = view(req)

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        self.assertIn("attachment; filename=", resp["Content-Disposition"])
        self.assertTrue(resp.content.startswith(b"PK\x03\x04"))

    def test_excel_inspecteur_can_export(self):
        """L'inspecteur peut exporter le classeur Excel de tout bureau."""
        view = ExportEcrituresExcelView.as_view()
        req = self.factory.get(f"/api/v1/mouvements/export-excel/?periode_id={self.periode_1.id}")
        force_authenticate(req, user=self.user_inspecteur)
        resp = view(req)

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        self.assertTrue(resp.content.startswith(b"PK\x03\x04"))

    def test_excel_receveur_allowed_for_own_bureau(self):
        """Un receveur peut exporter les écritures de son bureau."""
        view = ExportEcrituresExcelView.as_view()
        req = self.factory.get(f"/api/v1/mouvements/export-excel/?periode_id={self.periode_1.id}")
        force_authenticate(req, user=self.user_receveur_1)
        resp = view(req)

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        self.assertTrue(resp.content.startswith(b"PK\x03\x04"))

    def test_excel_receveur_forbidden_for_other_bureau(self):
        """Un receveur ne peut PAS exporter les écritures d'un autre bureau (HTTP 403)."""
        view = ExportEcrituresExcelView.as_view()
        req = self.factory.get(f"/api/v1/mouvements/export-excel/?periode_id={self.periode_1.id}")
        force_authenticate(req, user=self.user_receveur_2)
        resp = view(req)

        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_excel_not_found(self):
        """Une période inexistante renvoie 404 Not Found."""
        view = ExportEcrituresExcelView.as_view()
        req = self.factory.get("/api/v1/mouvements/export-excel/?periode_id=999999")
        force_authenticate(req, user=self.user_admin)
        resp = view(req)

        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
