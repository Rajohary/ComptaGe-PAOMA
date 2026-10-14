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
        with self.assertRaises(IntegrityError):
            SectionComptable.objects.create(
                code=self.code_a,
                libelle="Doublon section A",
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
