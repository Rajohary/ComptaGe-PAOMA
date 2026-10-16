import unittest
import uuid
from decimal import Decimal
from django.core.exceptions import ValidationError
from apps.referentiel.models import Province, Bureau, PeriodeGestion
from apps.comptabilite.models import SectionComptable, LigneComptable, Mouvement
from apps.comptabilite.services import (
    creer_mouvement,
    modifier_mouvement,
    verifier_coherence_montants,
    valider_periode_active,
    valider_date_operation,
    valider_ligne_comptable,
    calcul_totaux_periode,
)
from django.contrib.auth import get_user_model

User = get_user_model()


class MouvementServicesTestCase(unittest.TestCase):
    def setUp(self):
        self.uid = uuid.uuid4().hex[:6].upper()
        self.province = Province.objects.create(
            nprovince=70 + (int(self.uid, 16) % 10),
            nom=f"Province Serv {self.uid}",
        )
        self.bureau = Bureau.objects.create(
            province=self.province,
            ncodique=70100 + (int(self.uid, 16) % 800),
            nom_bureau=f"Bureau Serv {self.uid}",
            classe="R1",
        )
        self.periode = PeriodeGestion.objects.create(
            bureau=self.bureau,
            nom_receveur="Receveur Serv Test",
            date_debut="2026-06-01",
            date_fin="2026-06-30",
            reserve_numeraire=100000,
            valeurs_postales=50000,
            timbres_fiscaux=20000,
            cloturee=False,
        )
        self.user = User.objects.create_user(
            username=f"user_srv_{self.uid}",
            password="StrongPass123!",
            role="AGENT_SAISIE",
        )
        self.sec = SectionComptable.objects.create(
            code=f"SS_{self.uid}",
            libelle="Section Serv Test",
            sens=SectionComptable.Sens.DEBIT,
        )
        self.ligne_parent = LigneComptable.objects.create(
            section=self.sec,
            menu_sub=int(f"60{self.sec.id % 1000:03d}0"),
            compte="SP01",
            libelle="Ligne Regroupement",
        )
        self.ligne_feuille = LigneComptable.objects.create(
            section=self.sec,
            parent=self.ligne_parent,
            menu_sub=int(f"60{self.sec.id % 1000:03d}1"),
            compte="SF01",
            libelle="Ligne Imputable",
            actif=True,
        )
        self.ligne_inactive = LigneComptable.objects.create(
            section=self.sec,
            menu_sub=int(f"60{self.sec.id % 1000:03d}2"),
            compte="SI01",
            libelle="Ligne Inactive",
            actif=False,
        )

    def tearDown(self):
        Mouvement.objects.filter(periode_gestion=self.periode).delete()
        self.ligne_inactive.delete()
        self.ligne_feuille.delete()
        self.ligne_parent.delete()
        self.sec.delete()
        self.periode.delete()
        self.bureau.delete()
        self.province.delete()
        self.user.delete()

    def test_creer_mouvement_succes_initialisation(self):
        """À la création, montant_rectifie == montant et augmentation == diminution == 0."""
        mvt = creer_mouvement(
            periode_gestion=self.periode,
            ligne_comptable=self.ligne_feuille,
            saisi_par=self.user,
            date_operation="2026-06-10",
            montant=Decimal("45000.00"),
        )
        self.assertIsNotNone(mvt.pk)
        self.assertEqual(mvt.montant, Decimal("45000.00"))
        self.assertEqual(mvt.montant_rectifie, Decimal("45000.00"))
        self.assertEqual(mvt.augmentation, Decimal("0.00"))
        self.assertEqual(mvt.diminution, Decimal("0.00"))
        self.assertEqual(mvt.motif_rectification, "")
        self.assertIsNone(mvt.rectifie_par)
        self.assertFalse(mvt.a_ecart())

    def test_creer_mouvement_periode_cloturee_rejet(self):
        """Impossible de créer un mouvement sur une période clôturée."""
        self.periode.cloturee = True
        self.periode.save()

        with self.assertRaises(ValidationError) as ctx:
            creer_mouvement(
                periode_gestion=self.periode,
                ligne_comptable=self.ligne_feuille,
                saisi_par=self.user,
                date_operation="2026-06-10",
                montant=Decimal("10000.00"),
            )
        self.assertIn("periode_gestion", ctx.exception.message_dict)

    def test_creer_mouvement_date_hors_periode_rejet(self):
        """Date d'opération antérieure ou postérieure rejetée."""
        # Date trop tôt
        with self.assertRaises(ValidationError) as ctx1:
            creer_mouvement(
                periode_gestion=self.periode,
                ligne_comptable=self.ligne_feuille,
                saisi_par=self.user,
                date_operation="2026-05-31",
                montant=Decimal("10000.00"),
            )
        self.assertIn("date_operation", ctx1.exception.message_dict)

        # Date trop tard
        with self.assertRaises(ValidationError) as ctx2:
            creer_mouvement(
                periode_gestion=self.periode,
                ligne_comptable=self.ligne_feuille,
                saisi_par=self.user,
                date_operation="2026-07-01",
                montant=Decimal("10000.00"),
            )
        self.assertIn("date_operation", ctx2.exception.message_dict)

    def test_creer_mouvement_ligne_invalide_rejet(self):
        """Imputation sur ligne inactive ou ligne regroupement rejetée."""
        # Ligne inactive
        with self.assertRaises(ValidationError) as ctx1:
            creer_mouvement(
                periode_gestion=self.periode,
                ligne_comptable=self.ligne_inactive,
                saisi_par=self.user,
                date_operation="2026-06-15",
                montant=Decimal("10000.00"),
            )
        self.assertIn("ligne_comptable", ctx1.exception.message_dict)

        # Ligne parente (regroupement)
        with self.assertRaises(ValidationError) as ctx2:
            creer_mouvement(
                periode_gestion=self.periode,
                ligne_comptable=self.ligne_parent,
                saisi_par=self.user,
                date_operation="2026-06-15",
                montant=Decimal("10000.00"),
            )
        self.assertIn("ligne_comptable", ctx2.exception.message_dict)

    def test_verifier_coherence_montants(self):
        """Validation de la formule montant_rectifie = montant + augmentation - diminution."""
        # Calcul auto
        res = verifier_coherence_montants(
            montant=Decimal("10000.00"),
            augmentation=Decimal("2000.00"),
            diminution=Decimal("1000.00"),
        )
        self.assertEqual(res, Decimal("11000.00"))

        # Incohérence explicite
        with self.assertRaises(ValidationError) as ctx:
            verifier_coherence_montants(
                montant=Decimal("10000.00"),
                augmentation=Decimal("2000.00"),
                diminution=Decimal("1000.00"),
                montant_rectifie=Decimal("9999.00"),
            )
        self.assertIn("montant_rectifie", ctx.exception.message_dict)

        # Diminution excessive
        with self.assertRaises(ValidationError) as ctx2:
            verifier_coherence_montants(
                montant=Decimal("5000.00"),
                augmentation=Decimal("0.00"),
                diminution=Decimal("6000.00"),
            )
        self.assertIn("diminution", ctx2.exception.message_dict)

    def test_calcul_totaux_periode(self):
        """Calcul consolidé des totaux par section, par sous-section (B1..B4) et total général."""
        # Création de lignes pour sections A et B
        sec_a = SectionComptable.objects.create(
            code=f"CA_{self.uid}",
            libelle="Section Debit Test",
            sens=SectionComptable.Sens.DEBIT,
            ordre=1,
        )
        sec_b = SectionComptable.objects.create(
            code="B",  # Section B officielle
            libelle="Section Credit B Test",
            sens=SectionComptable.Sens.CREDIT,
            ordre=2,
        ) if not SectionComptable.objects.filter(code="B").exists() else SectionComptable.objects.get(code="B")

        # Lignes B1 et B2
        ligne_b1 = LigneComptable.objects.create(
            section=sec_b,
            menu_sub=int(f"41{self.sec.id % 1000:03d}1"),
            compte="B101_T",
            libelle="Produit B1 Test",
            actif=True,
        )
        ligne_b2 = LigneComptable.objects.create(
            section=sec_b,
            menu_sub=int(f"42{self.sec.id % 1000:03d}2"),
            compte="B201_T",
            libelle="Produit B2 Test",
            actif=True,
        )
        ligne_a = LigneComptable.objects.create(
            section=sec_a,
            menu_sub=int(f"43{self.sec.id % 1000:03d}3"),
            compte="AD01_T",
            libelle="Produit A Test",
            actif=True,
        )

        try:
            # Création de mouvements :
            # Débit (A) : 50 000
            Mouvement.objects.create(
                periode_gestion=self.periode,
                ligne_comptable=ligne_a,
                saisi_par=self.user,
                date_operation="2026-06-15",
                montant=Decimal("50000.00"),
                montant_rectifie=Decimal("50000.00"),
            )
            # Crédit B1 : 20 000
            Mouvement.objects.create(
                periode_gestion=self.periode,
                ligne_comptable=ligne_b1,
                saisi_par=self.user,
                date_operation="2026-06-15",
                montant=Decimal("20000.00"),
                montant_rectifie=Decimal("20000.00"),
            )
            # Crédit B2 : 15 000 (avec rectification +5000 -> 20000)
            Mouvement.objects.create(
                periode_gestion=self.periode,
                ligne_comptable=ligne_b2,
                saisi_par=self.user,
                date_operation="2026-06-16",
                montant=Decimal("15000.00"),
                augmentation=Decimal("5000.00"),
                montant_rectifie=Decimal("20000.00"),
            )

            res = calcul_totaux_periode(periode_gestion=self.periode)

            # Vérification Débit
            self.assertEqual(res["total_general_debit"], Decimal("50000.00"))
            # Vérification Crédit B1 (20 000) et B2 (20 000 rectifié) -> total Crédit 40 000
            self.assertEqual(res["sous_sections_b"]["B1"]["total_rectifie"], Decimal("20000.00"))
            self.assertEqual(res["sous_sections_b"]["B2"]["total_rectifie"], Decimal("20000.00"))
            self.assertEqual(res["sous_sections_b"]["B2"]["total_declare"], Decimal("15000.00"))
            self.assertEqual(res["total_general_credit"], Decimal("40000.00"))
            # Solde net = 50 000 - 40 000 = +10 000
            self.assertEqual(res["solde_net"], Decimal("10000.00"))

            # Test avec filtre date_operation = 2026-06-15
            res_date = calcul_totaux_periode(periode_gestion=self.periode, date_operation="2026-06-15")
            self.assertEqual(res_date["total_general_debit"], Decimal("50000.00"))
            self.assertEqual(res_date["total_general_credit"], Decimal("20000.00"))
            self.assertEqual(res_date["solde_net"], Decimal("30000.00"))

        finally:
            Mouvement.objects.filter(ligne_comptable__in=[ligne_a, ligne_b1, ligne_b2]).delete()
            ligne_a.delete()
            ligne_b1.delete()
            ligne_b2.delete()
            sec_a.delete()
