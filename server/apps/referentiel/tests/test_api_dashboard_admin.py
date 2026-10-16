from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from apps.referentiel.views import AdminDashboardView
from apps.referentiel.models import Province, Bureau, PeriodeGestion
from apps.comptabilite.models import (
    SectionComptable,
    LigneComptable,
    Mouvement,
)
from apps.audit.models import AuditLogEntry

User = get_user_model()


class AdminDashboardAPITestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = AdminDashboardView.as_view()

        # Utilisateurs avec différents rôles
        self.admin_user = User.objects.create_user(
            username="admin_principal",
            password="Password123!",
            role="ADMIN",
        )
        self.receveur_user = User.objects.create_user(
            username="receveur_test",
            password="Password123!",
            role="RECEVEUR",
            bureau_code=10101,
        )
        self.inspecteur_user = User.objects.create_user(
            username="inspecteur_test",
            password="Password123!",
            role="INSPECTEUR",
        )

        # Référentiel
        self.prov_1 = Province.objects.create(nprovince=1, nom="Antananarivo")
        self.prov_2 = Province.objects.create(nprovince=2, nom="Toamasina")

        self.bureau_1 = Bureau.objects.create(
            province=self.prov_1,
            ncodique=10101,
            nom_bureau="Antaninarenina",
            classe="R1",
        )
        self.bureau_2 = Bureau.objects.create(
            province=self.prov_2,
            ncodique=20101,
            nom_bureau="Toamasina Port",
            classe="HC",
        )

        # Périodes (1 active, 1 clôturée)
        self.periode_ouverte = PeriodeGestion.objects.create(
            bureau=self.bureau_1,
            receveur=self.receveur_user,
            nom_receveur="Receveur Test",
            date_debut="2026-06-01",
            date_fin="2026-06-30",
            reserve_numeraire=Decimal("100000.00"),
            valeurs_postales=Decimal("50000.00"),
            timbres_fiscaux=Decimal("20000.00"),
            cloturee=False,
        )
        self.periode_cloturee = PeriodeGestion.objects.create(
            bureau=self.bureau_2,
            nom_receveur="Receveur Port",
            date_debut="2026-05-01",
            date_fin="2026-05-31",
            reserve_numeraire=Decimal("200000.00"),
            valeurs_postales=Decimal("80000.00"),
            timbres_fiscaux=Decimal("40000.00"),
            cloturee=True,
        )

        # Comptabilité
        self.sec_debit = SectionComptable.objects.create(
            code="A", libelle="Débits", sens=SectionComptable.Sens.DEBIT
        )
        self.sec_credit = SectionComptable.objects.create(
            code="B", libelle="Crédits", sens=SectionComptable.Sens.CREDIT
        )
        self.ligne_debit = LigneComptable.objects.create(
            section=self.sec_debit, menu_sub=10, libelle="Produit A"
        )
        self.ligne_credit = LigneComptable.objects.create(
            section=self.sec_credit, menu_sub=20, libelle="Produit B"
        )

        Mouvement.objects.create(
            periode_gestion=self.periode_ouverte,
            ligne_comptable=self.ligne_debit,
            saisi_par=self.receveur_user,
            date_operation="2026-06-10",
            montant=Decimal("40000.00"),
            montant_rectifie=Decimal("40000.00"),
        )
        Mouvement.objects.create(
            periode_gestion=self.periode_ouverte,
            ligne_comptable=self.ligne_credit,
            saisi_par=self.receveur_user,
            date_operation="2026-06-11",
            montant=Decimal("15000.00"),
            augmentation=Decimal("5000.00"),
            montant_rectifie=Decimal("20000.00"),  # Écart non rectifié
        )

        # Audit log
        AuditLogEntry.objects.create(
            auteur=self.admin_user,
            action=AuditLogEntry.ActionType.CREATION,
            model_name="Bureau",
            object_repr="Bureau 10101",
            detail="Création initiale du bureau",
        )

    def test_admin_dashboard_overview_nominal(self):
        """Un administrateur accède à la vue d'ensemble globale du système."""
        request = self.factory.get("/api/v1/dashboard/admin/")
        force_authenticate(request, user=self.admin_user)
        response = self.view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        # Territoire
        self.assertEqual(data["territoire"]["total_bureaux"], 2)
        self.assertEqual(data["territoire"]["total_provinces"], 2)
        self.assertEqual(data["territoire"]["bureaux_actifs_count"], 1)
        self.assertEqual(data["territoire"]["bureaux_sans_periode_active"], 1)

        # Périodes
        self.assertEqual(data["periodes"]["total_periodes"], 2)
        self.assertEqual(data["periodes"]["periodes_en_cours"], 1)
        self.assertEqual(data["periodes"]["periodes_cloturees"], 1)
        self.assertEqual(data["periodes"]["taux_cloture_pourcentage"], 50.0)

        # Utilisateurs
        self.assertEqual(data["utilisateurs"]["total_utilisateurs"], 3)
        self.assertEqual(data["utilisateurs"]["repartition_roles"]["ADMIN"], 1)
        self.assertEqual(data["utilisateurs"]["repartition_roles"]["RECEVEUR"], 1)
        self.assertEqual(data["utilisateurs"]["repartition_roles"]["INSPECTEUR"], 1)

        # Comptabilité
        self.assertEqual(data["comptabilite"]["total_mouvements_g58"], 2)
        self.assertEqual(Decimal(str(data["comptabilite"]["total_debit"])), Decimal("40000.00"))
        self.assertEqual(Decimal(str(data["comptabilite"]["total_credit"])), Decimal("20000.00"))
        self.assertEqual(Decimal(str(data["comptabilite"]["solde_global"])), Decimal("20000.00"))

        # Audit
        self.assertEqual(data["audit"]["total_ecarts_detectes"], 1)
        self.assertEqual(data["audit"]["ecarts_en_attente"], 1)
        self.assertEqual(data["audit"]["total_logs_audit"], 1)
        self.assertEqual(len(data["audit"]["derniers_logs"]), 1)

    def test_rbac_admin_only(self):
        """Seul le rôle ADMIN peut accéder à la vue d'ensemble globale."""
        # Receveur rejeté (403)
        req_rec = self.factory.get("/api/v1/dashboard/admin/")
        force_authenticate(req_rec, user=self.receveur_user)
        self.assertEqual(self.view(req_rec).status_code, status.HTTP_403_FORBIDDEN)

        # Inspecteur rejeté (403)
        req_insp = self.factory.get("/api/v1/dashboard/admin/")
        force_authenticate(req_insp, user=self.inspecteur_user)
        self.assertEqual(self.view(req_insp).status_code, status.HTTP_403_FORBIDDEN)

        # Anonyme rejeté (401)
        req_anon = self.factory.get("/api/v1/dashboard/admin/")
        self.assertEqual(self.view(req_anon).status_code, status.HTTP_401_UNAUTHORIZED)
