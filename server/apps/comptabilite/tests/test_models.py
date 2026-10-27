import unittest
import uuid
from django.db import IntegrityError
from django.db.models.deletion import ProtectedError
from apps.comptabilite.models import SectionComptable, LigneComptable


class PlanComptableModelsTestCase(unittest.TestCase):
    def setUp(self):
        # Utiliser un préfixe unique pour éviter toute collision résiduelle
        self.uid = uuid.uuid4().hex[:6].upper()
        self.code_a = f"A_{self.uid}"
        self.code_b = f"B_{self.uid}"

        self.sec_a = SectionComptable.objects.create(
            code=self.code_a,
            libelle="Opérations d'ordre postal et financier",
            sens=SectionComptable.Sens.DEBIT,
            ordre=1,
        )
        self.sec_b = SectionComptable.objects.create(
            code=self.code_b,
            libelle="Opérations relatives aux correspondances et objets",
            sens=SectionComptable.Sens.CREDIT,
            ordre=2,
        )

    def tearDown(self):
        # Supprimer d'abord les lignes enfants pour respecter la protection de la clé étrangère parent
        LigneComptable.objects.filter(section__in=[self.sec_a, self.sec_b], parent__isnull=False).delete()
        LigneComptable.objects.filter(section__in=[self.sec_a, self.sec_b]).delete()
        SectionComptable.objects.filter(id__in=[self.sec_a.id, self.sec_b.id]).delete()

    def test_section_comptable_creation_and_str(self):
        self.assertIsNotNone(self.sec_a.pk)
        self.assertEqual(str(self.sec_a), f"[{self.code_a}] Opérations d'ordre postal et financier")
        self.assertEqual(self.sec_a.sens, SectionComptable.Sens.DEBIT)
        self.assertTrue(self.sec_a.actif)

    def test_section_code_unique(self):
        """Le couple (code, sens) est unique : même code possible pour sens différent, mais pas même sens."""
        # Même code avec un sens différent (CREDIT) doit réussir
        sec_diff_sens = SectionComptable.objects.create(
            code=self.code_a,
            libelle="Section A Crédit",
            sens=SectionComptable.Sens.CREDIT,
        )
        self.assertIsNotNone(sec_diff_sens.pk)
        sec_diff_sens.delete()

        # Même code avec le même sens (DEBIT) doit lever une IntegrityError
        with self.assertRaises(IntegrityError):
            SectionComptable.objects.create(
                code=self.code_a,
                libelle="Doublon section A même sens",
                sens=SectionComptable.Sens.DEBIT,
            )

    def test_ligne_comptable_creation_and_str(self):
        menu_sub = int(f"91{self.sec_a.id % 1000:03d}1")
        ligne = LigneComptable.objects.create(
            section=self.sec_a,
            menu_sub=menu_sub,
            compte="AD",
            libelle="Timbres-poste vendus",
        )
        self.assertIsNotNone(ligne.pk)
        self.assertEqual(str(ligne), "AD — Timbres-poste vendus")
        self.assertEqual(ligne.section, self.sec_a)
        self.assertIsNone(ligne.parent)
        self.assertTrue(ligne.actif)

    def test_ligne_comptable_hierarchie(self):
        """Vérifie la hiérarchie section -> sous-opération (B1-B4) -> sous-lignes/produits."""
        menu_sub_b1 = int(f"92{self.sec_b.id % 1000:03d}0")
        menu_sub_prod = int(f"92{self.sec_b.id % 1000:03d}1")

        # Niveau 1 : Sous-opération B1
        ligne_b1 = LigneComptable.objects.create(
            section=self.sec_b,
            menu_sub=menu_sub_b1,
            compte="B1",
            libelle="Sous-section B1 — Émissions et versements",
        )
        # Niveau 2 : Produit rattaché à B1
        produit = LigneComptable.objects.create(
            section=self.sec_b,
            parent=ligne_b1,
            menu_sub=menu_sub_prod,
            compte="B101",
            libelle="Mandats ordinaires émis",
        )
        self.assertEqual(produit.parent, ligne_b1)
        self.assertEqual(ligne_b1.sous_lignes.count(), 1)
        self.assertIn(produit, ligne_b1.sous_lignes.all())

    def test_ligne_menu_sub_unique(self):
        menu_sub = int(f"93{self.sec_a.id % 1000:03d}2")
        LigneComptable.objects.create(
            section=self.sec_a,
            menu_sub=menu_sub,
            compte="AD",
            libelle="Ligne originale",
        )
        with self.assertRaises(IntegrityError):
            LigneComptable.objects.create(
                section=self.sec_b,
                menu_sub=menu_sub,
                compte="BD",
                libelle="Ligne doublon menu_sub",
            )

    def test_section_protect_on_delete_with_lignes(self):
        """Une section comptable référencée par une ligne ne peut pas être supprimée (PROTECT)."""
        menu_sub = int(f"94{self.sec_a.id % 1000:03d}3")
        LigneComptable.objects.create(
            section=self.sec_a,
            menu_sub=menu_sub,
            compte="AD",
            libelle="Ligne test",
        )
        with self.assertRaises(ProtectedError):
            self.sec_a.delete()

    def test_parent_ligne_protect_on_delete_with_children(self):
        """Une ligne parente référencée par des sous-lignes ne peut pas être supprimée (PROTECT)."""
        menu_sub_parent = int(f"95{self.sec_b.id % 1000:03d}0")
        menu_sub_child = int(f"95{self.sec_b.id % 1000:03d}1")

        parent = LigneComptable.objects.create(
            section=self.sec_b,
            menu_sub=menu_sub_parent,
            compte="B2",
            libelle="Sous-section B2",
        )
        LigneComptable.objects.create(
            section=self.sec_b,
            parent=parent,
            menu_sub=menu_sub_child,
            compte="B201",
            libelle="Produit B2",
        )
        with self.assertRaises(ProtectedError):
            parent.delete()


class MouvementModelTestCase(unittest.TestCase):
    def setUp(self):
        from apps.referentiel.models import Province, Bureau, PeriodeGestion
        from django.contrib.auth import get_user_model
        User = get_user_model()

        self.uid = uuid.uuid4().hex[:6].upper()
        self.province = Province.objects.create(
            nprovince=90 + (int(self.uid, 16) % 10),
            nom=f"Province Mvt {self.uid}",
        )
        self.bureau = Bureau.objects.create(
            province=self.province,
            ncodique=90100 + (int(self.uid, 16) % 800),
            nom_bureau=f"Bureau Mvt {self.uid}",
            classe="R1",
        )
        self.periode = PeriodeGestion.objects.create(
            bureau=self.bureau,
            nom_receveur="Receveur Mvt Test",
            date_debut="2026-06-01",
            date_fin="2026-06-30",
            reserve_numeraire=100000,
            valeurs_postales=50000,
            timbres_fiscaux=20000,
            cloturee=False,
        )
        self.user = User.objects.create_user(
            username=f"user_mvt_{self.uid}",
            password="StrongPass123!",
            role="AGENT_SAISIE",
        )
        self.sec = SectionComptable.objects.create(
            code=f"SM_{self.uid}",
            libelle="Section Mvt Test",
            sens=SectionComptable.Sens.DEBIT,
        )
        self.ligne = LigneComptable.objects.create(
            section=self.sec,
            menu_sub=int(f"70{self.sec.id % 1000:03d}1"),
            compte="MD01",
            libelle="Ligne Mvt Test",
        )

    def tearDown(self):
        from apps.comptabilite.models import Mouvement
        Mouvement.objects.filter(periode_gestion=self.periode).delete()
        self.ligne.delete()
        self.sec.delete()
        self.periode.delete()
        self.bureau.delete()
        self.province.delete()
        self.user.delete()

    def test_mouvement_creation_and_ecart(self):
        from apps.comptabilite.models import Mouvement
        from decimal import Decimal

        mvt = Mouvement.objects.create(
            periode_gestion=self.periode,
            ligne_comptable=self.ligne,
            saisi_par=self.user,
            date_operation="2026-06-15",
            montant=Decimal("15000.00"),
            augmentation=Decimal("0.00"),
            diminution=Decimal("0.00"),
            montant_rectifie=Decimal("15000.00"),
        )
        self.assertIsNotNone(mvt.pk)
        self.assertFalse(mvt.a_ecart())
        self.assertEqual(str(mvt), f"[2026-06-15] MD01 — Ligne Mvt Test — 15000.00 MGA (période {self.periode.id})")

        # Test détection écart via augmentation cohérente
        mvt.augmentation = Decimal("3000.00")
        mvt.montant_rectifie = Decimal("18000.00")
        mvt.save()
        self.assertTrue(mvt.a_ecart())

    def test_montant_rectifie_incoherent_rejected(self):
        """
        Test unitaire spécifique de la tâche 5 :
        montant_rectifie = montant + augmentation - diminution est vérifié et rejeté si incohérent.
        """
        from apps.comptabilite.models import Mouvement
        from decimal import Decimal
        from django.core.exceptions import ValidationError

        # 1. Tentative d'enregistrement avec montant_rectifie incohérent (19000 au lieu de 15000 + 2000 - 0 = 17000)
        with self.assertRaises(ValidationError) as ctx:
            Mouvement.objects.create(
                periode_gestion=self.periode,
                ligne_comptable=self.ligne,
                saisi_par=self.user,
                date_operation="2026-06-15",
                montant=Decimal("15000.00"),
                augmentation=Decimal("2000.00"),
                diminution=Decimal("0.00"),
                montant_rectifie=Decimal("19000.00"),
            )
        self.assertIn("montant_rectifie", ctx.exception.message_dict)

        # 2. Diminution supérieure à montant + augmentation
        with self.assertRaises(ValidationError) as ctx2:
            Mouvement.objects.create(
                periode_gestion=self.periode,
                ligne_comptable=self.ligne,
                saisi_par=self.user,
                date_operation="2026-06-15",
                montant=Decimal("10000.00"),
                augmentation=Decimal("0.00"),
                diminution=Decimal("12000.00"),
                montant_rectifie=Decimal("-2000.00"),
            )
        self.assertIn("diminution", ctx2.exception.message_dict)

        # 3. Enregistrement valide respectant l'équation
        mvt_valide = Mouvement.objects.create(
            periode_gestion=self.periode,
            ligne_comptable=self.ligne,
            saisi_par=self.user,
            date_operation="2026-06-15",
            montant=Decimal("15000.00"),
            augmentation=Decimal("2000.00"),
            diminution=Decimal("1000.00"),
            montant_rectifie=Decimal("16000.00"),
        )
        self.assertIsNotNone(mvt_valide.pk)
        self.assertEqual(mvt_valide.montant_rectifie, Decimal("16000.00"))
