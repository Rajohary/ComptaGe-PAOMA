from django.test import TestCase
from django.db import IntegrityError
from django.db.models.deletion import ProtectedError
from apps.referentiel.models import Province, Bureau


class ReferentielModelsTestCase(TestCase):
    def test_create_province(self):
        province = Province.objects.create(nprovince=1, nom="Antananarivo")
        self.assertIsNotNone(province.pk)
        self.assertEqual(str(province), "1 - Antananarivo")

    def test_province_unique_constraints(self):
        Province.objects.create(nprovince=1, nom="Antananarivo")
        from django.db import transaction
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Province.objects.create(nprovince=1, nom="Autre Nom")

        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Province.objects.create(nprovince=2, nom="Antananarivo")

    def test_create_bureau_with_fk(self):
        prov = Province.objects.create(nprovince=1, nom="Antananarivo")
        bureau = Bureau.objects.create(
            province=prov,
            ncodique=10101,
            nom_bureau="Antaninarenina",
            classe="R1",
            ccp="12345",
            ncf=1,
            cf_codik=10101,
        )
        self.assertIsNotNone(bureau.pk)
        self.assertEqual(str(bureau), "10101 - Antaninarenina")
        self.assertEqual(bureau.province, prov)
        self.assertEqual(prov.bureaux.count(), 1)

    def test_bureau_ncodique_unique(self):
        prov = Province.objects.create(nprovince=1, nom="Antananarivo")
        Bureau.objects.create(
            province=prov,
            ncodique=10101,
            nom_bureau="Bureau A",
        )
        with self.assertRaises(IntegrityError):
            Bureau.objects.create(
                province=prov,
                ncodique=10101,
                nom_bureau="Bureau B",
            )

    def test_bureau_fk_protection_on_province_delete(self):
        """Vérifie que la suppression d'une province liée à un bureau est interdite (on_delete=PROTECT)."""
        prov = Province.objects.create(nprovince=1, nom="Antananarivo")
        Bureau.objects.create(
            province=prov,
            ncodique=10101,
            nom_bureau="Antaninarenina",
        )
        with self.assertRaises(ProtectedError):
            prov.delete()

    def test_periode_gestion_creation_and_defaults(self):
        from datetime import date
        from apps.referentiel.models import PeriodeGestion
        prov = Province.objects.create(nprovince=1, nom="Antananarivo")
        bureau = Bureau.objects.create(
            province=prov,
            ncodique=10101,
            nom_bureau="Antaninarenina",
        )
        periode = PeriodeGestion.objects.create(
            bureau=bureau,
            nom_receveur="Randria Paul",
            date_debut=date(2026, 6, 1),
            date_fin=date(2026, 6, 30),
            reserve_numeraire=150000.00,
            valeurs_postales=80000.00,
            timbres_fiscaux=45000.00,
            solde_debiteur_depart=10000.00,
            solde_crediteur_depart=0.00,
        )
        self.assertIsNotNone(periode.pk)
        self.assertFalse(periode.cloturee)
        self.assertEqual(periode.bureau, bureau)
        self.assertIn("Antaninarenina", str(periode))
        self.assertIn("En cours", str(periode))

    def test_periode_gestion_date_fin_before_date_debut(self):
        from datetime import date
        from django.core.exceptions import ValidationError
        from apps.referentiel.models import PeriodeGestion
        prov = Province.objects.create(nprovince=1, nom="Antananarivo")
        bureau = Bureau.objects.create(
            province=prov,
            ncodique=10101,
            nom_bureau="Antaninarenina",
        )
        periode = PeriodeGestion(
            bureau=bureau,
            nom_receveur="Randria Paul",
            date_debut=date(2026, 6, 30),
            date_fin=date(2026, 6, 1),
        )
        with self.assertRaises(ValidationError):
            periode.save()

    def test_periode_gestion_protection_on_bureau_delete(self):
        from datetime import date
        from apps.referentiel.models import PeriodeGestion
        prov = Province.objects.create(nprovince=1, nom="Antananarivo")
        bureau = Bureau.objects.create(
            province=prov,
            ncodique=10101,
            nom_bureau="Antaninarenina",
        )
        PeriodeGestion.objects.create(
            bureau=bureau,
            nom_receveur="Randria Paul",
            date_debut=date(2026, 6, 1),
            date_fin=date(2026, 6, 30),
        )
        with self.assertRaises(ProtectedError):
            bureau.delete()

    def test_impossible_saisir_mouvement_sur_periode_cloturee(self):
        """
        Test unitaire : impossible de saisir un mouvement sur une période clôturée.
        Vérifie que la règle métier bloque formellement toute tentative d'écriture / validation
        dès lors que cloturee=True.
        """
        from datetime import date
        from django.core.exceptions import ValidationError
        from apps.referentiel.models import PeriodeGestion

        prov = Province.objects.create(nprovince=1, nom="Antananarivo")
        bureau = Bureau.objects.create(
            province=prov,
            ncodique=10101,
            nom_bureau="Antaninarenina",
        )
        periode_ouverte = PeriodeGestion.objects.create(
            bureau=bureau,
            nom_receveur="Receveur Test",
            date_debut=date(2026, 6, 1),
            date_fin=date(2026, 6, 30),
            cloturee=False,
        )
        # 1. Période ouverte : la validation passe sans erreur
        self.assertTrue(periode_ouverte.verifier_active())

        # 2. Clôture de la période
        periode_ouverte.cloturee = True
        periode_ouverte.save()

        # 3. Période clôturée : toute tentative de saisie/validation de mouvement doit lever ValidationError
        with self.assertRaises(ValidationError) as ctx:
            periode_ouverte.verifier_active()

        self.assertIn("déjà clôturée", str(ctx.exception))
