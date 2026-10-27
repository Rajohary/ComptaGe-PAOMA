from django.core.management.base import BaseCommand
from apps.referentiel.models import Province


class Command(BaseCommand):
    help = "Initialise les provinces officielles de Madagascar d'après script.txt"

    def handle(self, *args, **options):
        # 1. Création des Provinces officielles de Madagascar (si pas encore créées)
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

        self.stdout.write(
            self.style.SUCCESS("Provinces prêtes !")
        )
