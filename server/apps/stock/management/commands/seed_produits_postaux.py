from django.core.management.base import BaseCommand
from django.db import transaction
from apps.stock.models import ProduitPostal


PRODUITS_INITIAUX = [
    # Valeurs postales (VP) — Timbres d'affranchissement postal usuels
    {"nom": "Timbre d'affranchissement 100 Ar", "categorie": ProduitPostal.Categorie.VALEUR_POSTALE, "valeur_faciale": "100.00"},
    {"nom": "Timbre d'affranchissement 200 Ar", "categorie": ProduitPostal.Categorie.VALEUR_POSTALE, "valeur_faciale": "200.00"},
    {"nom": "Timbre d'affranchissement 500 Ar", "categorie": ProduitPostal.Categorie.VALEUR_POSTALE, "valeur_faciale": "500.00"},
    {"nom": "Timbre d'affranchissement 1000 Ar", "categorie": ProduitPostal.Categorie.VALEUR_POSTALE, "valeur_faciale": "1000.00"},
    {"nom": "Timbre d'affranchissement 2000 Ar", "categorie": ProduitPostal.Categorie.VALEUR_POSTALE, "valeur_faciale": "2000.00"},
    {"nom": "Timbre d'affranchissement 5000 Ar", "categorie": ProduitPostal.Categorie.VALEUR_POSTALE, "valeur_faciale": "5000.00"},
    {"nom": "Enveloppe préaffranchie nationale", "categorie": ProduitPostal.Categorie.VALEUR_POSTALE, "valeur_faciale": "2500.00"},
    {"nom": "Aérogramme international", "categorie": ProduitPostal.Categorie.VALEUR_POSTALE, "valeur_faciale": "3000.00"},

    # Timbres fiscaux (TF)
    {"nom": "Timbre fiscal 1000 Ar", "categorie": ProduitPostal.Categorie.TIMBRE_FISCAL, "valeur_faciale": "1000.00"},
    {"nom": "Timbre fiscal 2000 Ar", "categorie": ProduitPostal.Categorie.TIMBRE_FISCAL, "valeur_faciale": "2000.00"},
    {"nom": "Timbre fiscal 5000 Ar", "categorie": ProduitPostal.Categorie.TIMBRE_FISCAL, "valeur_faciale": "5000.00"},
    {"nom": "Timbre fiscal 10000 Ar", "categorie": ProduitPostal.Categorie.TIMBRE_FISCAL, "valeur_faciale": "10000.00"},

    # Autres produits
    {"nom": "Carnet de coupons-réponse internationaux", "categorie": ProduitPostal.Categorie.AUTRE, "valeur_faciale": "15000.00"},
    {"nom": "Boîte postale modèle standard (redevance annuelle)", "categorie": ProduitPostal.Categorie.AUTRE, "valeur_faciale": "50000.00"},
]


class Command(BaseCommand):
    help = "Initialise le référentiel des produits postaux (valeurs postales, timbres fiscaux, etc.) de façon idempotente."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Supprime les produits existants non rattachés à des écritures avant ré-initialisation.",
        )

    def handle(self, *args, **options):
        reset = options.get("reset", False)

        with transaction.atomic():
            if reset:
                self.stdout.write("Suppression des produits existants sans stocks rattachés...")
                ProduitPostal.objects.filter(stocks__isnull=True).delete()

            crees = 0
            mis_a_jour = 0

            for prod_data in PRODUITS_INITIAUX:
                obj, created = ProduitPostal.objects.update_or_create(
                    nom=prod_data["nom"],
                    defaults={
                        "categorie": prod_data["categorie"],
                        "valeur_faciale": prod_data["valeur_faciale"],
                        "actif": True,
                    },
                )
                if created:
                    crees += 1
                else:
                    mis_a_jour += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"Référentiel ProduitPostal initialisé : {crees} créés, {mis_a_jour} mis à jour. Total : {ProduitPostal.objects.count()} produits."
                )
            )
