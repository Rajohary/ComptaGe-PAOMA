"""
Commande Django de seed pour le Plan Comptable Postal de Paositra Malagasy (Journal G58).
Conforme au CDC ComptaGe, à GLOSSAIRE_METIER_COMPTAGEWEB.md et à ARCHITECTURE.md.

Ce script peuple :
  1. Les Sections Comptables A à E (et ENC pour les flux d'encaisse/coffre).
  2. Les Sous-sections hiérarchiques (notamment B1, B2, B3, B4 et D).
  3. L'ensemble des rubriques / lignes comptables réelles et produits postaux.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.comptabilite.models import SectionComptable, LigneComptable


class Command(BaseCommand):
    help = "Initialise les sections et lignes comptables réelles du Journal G58 (sections A, B1-B4, C, D, E)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Supprime les lignes et sections existantes avant d'insérer le seed",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options.get("reset"):
            self.stdout.write(self.style.WARNING("Nettoyage des lignes et sections comptables..."))
            # Supprimer d'abord les lignes enfants, puis les lignes parentes, puis les sections
            LigneComptable.objects.filter(parent__isnull=False).delete()
            LigneComptable.objects.all().delete()
            SectionComptable.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("Nettoyage terminé."))

        # -------------------------------------------------------------------
        # 1. Définition des Sections Comptables (A à E + ENC)
        # -------------------------------------------------------------------
        sections_data = [
            {
                "code": "A",
                "libelle": "Opérations d'ordre postal et financier",
                "sens": SectionComptable.Sens.DEBIT,
                "ordre": 1,
            },
            {
                "code": "B",
                "libelle": "Opérations relatives aux correspondances et objets",
                "sens": SectionComptable.Sens.CREDIT,
                "ordre": 2,
            },
            {
                "code": "C",
                "libelle": "Mouvements de fonds et trésorerie",
                "sens": SectionComptable.Sens.DEBIT,
                "ordre": 3,
            },
            {
                "code": "D",
                "libelle": "Dépenses budgétaires et rémunérations",
                "sens": SectionComptable.Sens.CREDIT,
                "ordre": 4,
            },
            {
                "code": "E",
                "libelle": "Régularisations et opérations d'ordre",
                "sens": SectionComptable.Sens.NON_APPLICABLE,
                "ordre": 5,
            },
        ]

        sections = {}
        for s_data in sections_data:
            sec, created = SectionComptable.objects.get_or_create(
                code=s_data["code"],
                defaults=s_data,
            )
            sections[s_data["code"]] = sec
            action = "Créée" if created else "Existante"
            self.stdout.write(f"  Section [{sec.code}] {sec.libelle} ({action})")

        # -------------------------------------------------------------------
        # 2. Section A : Opérations d'ordre postal et financier (Débits)
        # -------------------------------------------------------------------
        lignes_section_a = [
            {"menu_sub": 101, "compte": "AD01", "libelle": "Vente de timbres-poste ordinaires"},
            {"menu_sub": 102, "compte": "AD02", "libelle": "Vente de timbres fiscaux"},
            {"menu_sub": 103, "compte": "AD03", "libelle": "Vente d'entiers postaux et vignettes"},
            {"menu_sub": 104, "compte": "AD04", "libelle": "Taxe d'affranchissement au guichet"},
            {"menu_sub": 105, "compte": "AD05", "libelle": "Postes restantes et droits de garde"},
            {"menu_sub": 106, "compte": "AD06", "libelle": "Location de boîtes postales"},
            {"menu_sub": 107, "compte": "AD07", "libelle": "Objets recommandés et valeurs déclarées"},
            {"menu_sub": 108, "compte": "AD08", "libelle": "Prestations de colis postaux nationaux"},
            {"menu_sub": 109, "compte": "AD09", "libelle": "Prestations de colis postaux internationaux"},
            {"menu_sub": 110, "compte": "AD10", "libelle": "Produits philatéliques spéciaux et premiers jours"},
        ]

        for item in lignes_section_a:
            LigneComptable.objects.get_or_create(
                menu_sub=item["menu_sub"],
                defaults={
                    "section": sections["A"],
                    "compte": item["compte"],
                    "libelle": item["libelle"],
                },
            )

        # -------------------------------------------------------------------
        # 3. Section B : Hiérarchie B1, B2, B3, B4 (Sous-opérations et produits)
        # -------------------------------------------------------------------
        # Définition des 4 sous-sections parentes
        sous_sections_b = [
            {
                "code_parent": "B1",
                "menu_sub": 200,
                "compte": "B1",
                "libelle": "Sous-section B1 — Émissions et versements mandats",
                "enfants": [
                    {"menu_sub": 201, "compte": "B101", "libelle": "Mandats ordinaires émis en numéraire"},
                    {"menu_sub": 202, "compte": "B102", "libelle": "Mandats express internationaux émis"},
                    {"menu_sub": 203, "compte": "B103", "libelle": "Mandats télégraphiques et électroniques émis"},
                    {"menu_sub": 204, "compte": "B104", "libelle": "Transferts électroniques IFS / UPU émis"},
                    {"menu_sub": 205, "compte": "B105", "libelle": "Taxes et commissions sur mandats émis"},
                ],
            },
            {
                "code_parent": "B2",
                "menu_sub": 210,
                "compte": "B2",
                "libelle": "Sous-section B2 — Paiements et remboursements mandats",
                "enfants": [
                    {"menu_sub": 211, "compte": "B201", "libelle": "Paiement de mandats ordinaires nationaux"},
                    {"menu_sub": 212, "compte": "B202", "libelle": "Paiement de mandats internationaux"},
                    {"menu_sub": 213, "compte": "B203", "libelle": "Paiement de transferts IFS"},
                    {"menu_sub": 214, "compte": "B204", "libelle": "Remboursement de mandats périmés ou annulés"},
                ],
            },
            {
                "code_parent": "B3",
                "menu_sub": 220,
                "compte": "B3",
                "libelle": "Sous-section B3 — Opérations de chèques postaux et épargne",
                "enfants": [
                    {"menu_sub": 221, "compte": "B301", "libelle": "Versements sur comptes courants postaux (CCP)"},
                    {"menu_sub": 222, "compte": "B302", "libelle": "Paiements de chèques postaux assignés"},
                    {"menu_sub": 223, "compte": "B303", "libelle": "Dépôts Caisse d'Épargne de Madagascar (CEM)"},
                    {"menu_sub": 224, "compte": "B304", "libelle": "Remboursements Caisse d'Épargne de Madagascar (CEM)"},
                ],
            },
            {
                "code_parent": "B4",
                "menu_sub": 230,
                "compte": "B4",
                "libelle": "Sous-section B4 — Services pour compte de tiers et divers",
                "enfants": [
                    {"menu_sub": 231, "compte": "B401", "libelle": "Paiement de pensions et rentes publiques"},
                    {"menu_sub": 232, "compte": "B402", "libelle": "Encaissement de factures publiques (JIRAMA...)"},
                    {"menu_sub": 233, "compte": "B403", "libelle": "Vente de formulaires et fournitures administratives"},
                    {"menu_sub": 234, "compte": "B404", "libelle": "Recettes diverses non ventilées"},
                ],
            },
        ]

        for s_b in sous_sections_b:
            parent_ligne, created = LigneComptable.objects.get_or_create(
                menu_sub=s_b["menu_sub"],
                defaults={
                    "section": sections["B"],
                    "compte": s_b["compte"],
                    "libelle": s_b["libelle"],
                },
            )
            for child in s_b["enfants"]:
                LigneComptable.objects.get_or_create(
                    menu_sub=child["menu_sub"],
                    defaults={
                        "section": sections["B"],
                        "parent": parent_ligne,
                        "compte": child["compte"],
                        "libelle": child["libelle"],
                    },
                )

        # -------------------------------------------------------------------
        # 4. Section C : Mouvements de fonds et trésorerie
        # -------------------------------------------------------------------
        lignes_section_c = [
            {"menu_sub": 301, "compte": "CD01", "libelle": "Alimentation de caisse reçue du Centre Financier"},
            {"menu_sub": 302, "compte": "CD02", "libelle": "Fonds reçus d'un bureau voisin"},
            {"menu_sub": 303, "compte": "CD03", "libelle": "Versement de numéraire excédentaire au Centre Financier"},
            {"menu_sub": 304, "compte": "CD04", "libelle": "Expédition de fonds à un bureau voisin"},
        ]
        for item in lignes_section_c:
            LigneComptable.objects.get_or_create(
                menu_sub=item["menu_sub"],
                defaults={
                    "section": sections["C"],
                    "compte": item["compte"],
                    "libelle": item["libelle"],
                },
            )

        # -------------------------------------------------------------------
        # 5. Section D : Dépenses budgétaires et rémunérations
        # -------------------------------------------------------------------
        lignes_section_d = [
            {"menu_sub": 401, "compte": "DD01", "libelle": "Frais généraux de bureau et papeterie"},
            {"menu_sub": 402, "compte": "DD02", "libelle": "Carburant et entretien matériel de transport"},
            {"menu_sub": 403, "compte": "DD03", "libelle": "Frais de télécommunication et transmissions"},
            {"menu_sub": 404, "compte": "DD04", "libelle": "Indemnités et gratifications du personnel postal"},
            {"menu_sub": 405, "compte": "DD05", "libelle": "Avances sur salaire et acomptes autorisés"},
            {"menu_sub": 406, "compte": "DD06", "libelle": "Petites réparations et entretien des locaux"},
        ]
        for item in lignes_section_d:
            LigneComptable.objects.get_or_create(
                menu_sub=item["menu_sub"],
                defaults={
                    "section": sections["D"],
                    "compte": item["compte"],
                    "libelle": item["libelle"],
                },
            )

        # -------------------------------------------------------------------
        # 6. Section E : Régularisations et opérations d'ordre
        # -------------------------------------------------------------------
        lignes_section_e = [
            {"menu_sub": 501, "compte": "ED01", "libelle": "Régularisation d'erreurs comptables antérieures"},
            {"menu_sub": 502, "compte": "ED02", "libelle": "Manquants constatés en attente de régularisation"},
            {"menu_sub": 503, "compte": "ED03", "libelle": "Excédents de caisse constatés"},
            {"menu_sub": 504, "compte": "ED04", "libelle": "Créances et avances temporaires aux facteurs"},
        ]
        for item in lignes_section_e:
            LigneComptable.objects.get_or_create(
                menu_sub=item["menu_sub"],
                defaults={
                    "section": sections["E"],
                    "compte": item["compte"],
                    "libelle": item["libelle"],
                },
            )

        # -------------------------------------------------------------------
        # 7. Rubriques d'encaisse et trésorerie (tblEncaisseParent & tblEncaisse)
        # -------------------------------------------------------------------
        from apps.comptabilite.models import RubriqueEncaisseParent, RubriqueEncaisse

        parent_encaisse, _ = RubriqueEncaisseParent.objects.get_or_create(
            id_encaisse=1,
            defaults={"libelle": "ENCAISSE ET VALEURS"},
        )
        parent_flux, _ = RubriqueEncaisseParent.objects.get_or_create(
            id_encaisse=2,
            defaults={"libelle": "DEBIT/CREDIT"},
        )

        rubriques_encaisse_data = [
            {"id_encaisse": parent_encaisse, "menu_sub": 1, "compte": "TR", "libelle": "Trésorerie et espèces physiques (billets et pièces)"},
            {"id_encaisse": parent_encaisse, "menu_sub": 2, "compte": "SF", "libelle": "Stock final de timbres et valeurs postales"},
            {"id_encaisse": parent_encaisse, "menu_sub": 3, "compte": "CR", "libelle": "Créances et avances temporaires"},
            {"id_encaisse": parent_flux, "menu_sub": 4, "compte": "AP", "libelle": "Approvisionnement et reversement de fonds"},
            {"id_encaisse": parent_flux, "menu_sub": 5, "compte": "VD", "libelle": "Versements et dégagements bancaires/CCP"},
        ]
        for r_item in rubriques_encaisse_data:
            RubriqueEncaisse.objects.get_or_create(
                menu_sub=r_item["menu_sub"],
                defaults={
                    "rubrique_parent": r_item["id_encaisse"],
                    "compte": r_item["compte"],
                    "libelle": r_item["libelle"],
                },
            )

        # Rapport d'exécution
        nb_sections = SectionComptable.objects.count()
        nb_lignes = LigneComptable.objects.count()
        nb_racines = LigneComptable.objects.filter(parent__isnull=True).count()
        nb_enfants = LigneComptable.objects.filter(parent__isnull=False).count()
        nb_encaisses = RubriqueEncaisse.objects.count()

        self.stdout.write(
            self.style.SUCCESS(
                f"\nInitialisation du Plan Comptable terminée avec succès !\n"
                f"  - Sections créées / actives : {nb_sections}\n"
                f"  - Total lignes comptables   : {nb_lignes} (dont {nb_enfants} sous-rubriques filles, {nb_racines} rubriques principales)\n"
                f"  - Rubriques d'encaisse      : {nb_encaisses}\n"
                f"  - Couverture complète : Section A, B (B1-B4), C, D, E et Encaisse."
            )
        )
