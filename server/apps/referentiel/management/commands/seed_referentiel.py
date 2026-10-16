from django.core.management.base import BaseCommand
from apps.referentiel.models import Province, Bureau


class Command(BaseCommand):
    help = "Initialise le référentiel postal (les 6 provinces officielles et des bureaux témoins)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--provinces-only",
            action="store_true",
            help="Initialise uniquement les provinces, sans créer de bureaux",
        )

    def handle(self, *args, **options):
        # 1. Création des Provinces officielles de Madagascar
        provinces_data = [
            (1, "Antananarivo"),
            (2, "Fianarantsoa"),
            (3, "Toamasina"),
            (4, "Mahajanga"),
            (5, "Toliara"),
            (6, "Antsiranana"),
        ]

        provinces = {}
        for nprov, nom in provinces_data:
            p, created = Province.objects.get_or_create(
                nprovince=nprov,
                defaults={"nom": nom}
            )
            provinces[nprov] = p
            action = "Créée" if created else "Déjà existante"
            self.stdout.write(
                self.style.SUCCESS(f"Province {nprov} - {nom} [{action}]")
            )

        self.stdout.write(self.style.SUCCESS("Provinces prêtes !"))

        if options.get("provinces_only"):
            return

        # 2. Création de bureaux témoins cohérents avec les comptes de test et le CDC
        bureaux_data = [
            {
                "province": provinces[1],
                "ncodique": 101,
                "nom_bureau": "Recette Principale Antananarivo",
                "classe": "HC",
                "ccp": "10010",
                "nbur": 1,
                "codeclasse": 1,
                "ncf": 1,
                "cf_codik": 101,
            },
            {
                "province": provinces[1],
                "ncodique": 10101,
                "nom_bureau": "Antaninarenina",
                "classe": "R1",
                "ccp": "10020",
                "nbur": 2,
                "codeclasse": 1,
                "ncf": 1,
                "cf_codik": 101,
            },
            {
                "province": provinces[1],
                "ncodique": 10102,
                "nom_bureau": "Analakely",
                "classe": "R1",
                "ccp": "10021",
                "nbur": 3,
                "codeclasse": 1,
                "ncf": 1,
                "cf_codik": 101,
            },
            {
                "province": provinces[2],
                "ncodique": 20101,
                "nom_bureau": "Fianarantsoa Principal",
                "classe": "R1",
                "ccp": "20010",
                "nbur": 1,
                "codeclasse": 1,
                "ncf": 2,
                "cf_codik": 20101,
            },
            {
                "province": provinces[3],
                "ncodique": 30101,
                "nom_bureau": "Toamasina Port",
                "classe": "HC",
                "ccp": "30010",
                "nbur": 1,
                "codeclasse": 1,
                "ncf": 3,
                "cf_codik": 30101,
            },
        ]

        for b_data in bureaux_data:
            ncodique = b_data["ncodique"]
            bureau, created = Bureau.objects.get_or_create(
                ncodique=ncodique,
                defaults=b_data,
            )
            action = "Créé" if created else "Déjà existant"
            self.stdout.write(
                self.style.SUCCESS(
                    f"Bureau {bureau.ncodique} - {bureau.nom_bureau} ({bureau.province.nom}) [{action}]"
                )
            )

        self.stdout.write(
            self.style.SUCCESS("Initialisation complète du référentiel terminée avec succès !")
        )
