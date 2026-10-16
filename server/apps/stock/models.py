"""
Modèles pour l'application Stock — stock de valeurs postales et timbres.

Correspond à la section 7 de PROJECT_STATE.md :
  « Modèle StockValeurPostale (produit, valeur faciale, quantités/valeurs
    initial-reçu-vendu-final) »

Et aux modules du CDC :
  - Module 2 : Plan Comptable & Nomenclature des Produits (Products, Categories)
  - Module 5 : Mouvements & Contrôle des Encaisses (timbres, valeurs postales)

Le modèle Products/Categories du CDC est simplifié ici en ProduitPostal :
les champs UI-only (Picture, Background…) sont omis — non pertinents côté API.
"""

from django.db import models
from django.core.validators import MinValueValidator


class ProduitPostal(models.Model):
    """
    Référentiel des produits, prestations et services postaux.
    Correspond à la table Products du CDC (ProductID, ProductName, CategoryID).
    Simplifié : les champs image/UI (Picture, Description BLOB) sont omis.
    """

    class Categorie(models.TextChoices):
        VALEUR_POSTALE = "VP", "Valeurs postales (timbres, aérogrammes…)"
        TIMBRE_FISCAL = "TF", "Timbres fiscaux"
        MANDAT = "MA", "Mandats"
        IFS = "IF", "IFS (Instruments Financiers Spéciaux)"
        CONSIGNATION = "CO", "Objets en consignation"
        AUTRE = "AU", "Autre"

    nom = models.CharField(
        max_length=100,
        verbose_name="Désignation du produit postal",
        help_text="Nom officiel du produit (ProductName dans Products)"
    )
    categorie = models.CharField(
        max_length=2,
        choices=Categorie.choices,
        default=Categorie.VALEUR_POSTALE,
        verbose_name="Catégorie du produit",
        help_text="Catégorie macroscopique (CategoryID via Categories dans le CDC)"
    )
    valeur_faciale = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name="Valeur faciale unitaire (MGA)",
        help_text="Valeur faciale du timbre ou produit en Ariary"
    )
    actif = models.BooleanField(
        default=True,
        verbose_name="Produit actif"
    )

    class Meta:
        db_table = "stock_produit_postal"
        ordering = ["categorie", "nom"]
        verbose_name = "Produit postal"
        verbose_name_plural = "Produits postaux"

    def __str__(self):
        return f"{self.nom} ({self.get_categorie_display()})"


class StockValeurPostale(models.Model):
    """
    Stock de valeurs postales et timbres pour un bureau, sur une période de gestion.
    Correspond au Tableau A du formulaire G58 et aux exigences PROJECT_STATE.md § 7.

    Les 4 colonnes (initial, reçu, vendu, final) permettent de vérifier :
      quantite_finale = quantite_initiale + quantite_recue - quantite_vendue
      valeur_finale   = valeur_initiale + valeur_recue - valeur_vendue
    """
    bureau = models.ForeignKey(
        "referentiel.Bureau",
        on_delete=models.PROTECT,
        related_name="stocks_valeurs",
        verbose_name="Bureau de poste"
    )
    periode_gestion = models.ForeignKey(
        "referentiel.PeriodeGestion",
        on_delete=models.PROTECT,
        related_name="stocks_valeurs",
        verbose_name="Période de gestion"
    )
    produit = models.ForeignKey(
        ProduitPostal,
        on_delete=models.PROTECT,
        related_name="stocks",
        verbose_name="Produit postal"
    )

    # --- Quantités ---
    quantite_initiale = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Quantité initiale (en stock au début)"
    )
    quantite_recue = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Quantité reçue (approvisionnement)"
    )
    quantite_vendue = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Quantité vendue (ou distribuée)"
    )
    quantite_finale = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Quantité finale (stock restant)"
    )

    # --- Valeurs en MGA ---
    valeur_initiale = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Valeur initiale (MGA)"
    )
    valeur_recue = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Valeur reçue (MGA)"
    )
    valeur_vendue = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Valeur vendue (MGA)"
    )
    valeur_finale = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Valeur finale (MGA)"
    )

    # Horodatage
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        db_table = "stock_valeur_postale"
        ordering = ["bureau", "periode_gestion", "produit"]
        verbose_name = "Stock de valeur postale"
        verbose_name_plural = "Stocks de valeurs postales"
        constraints = [
            models.UniqueConstraint(
                fields=["bureau", "periode_gestion", "produit"],
                name="unique_stock_bureau_periode_produit"
            )
        ]
        indexes = [
            models.Index(fields=["bureau", "periode_gestion"], name="idx_stock_bureau_periode"),
        ]

    def __str__(self):
        return f"{self.bureau} — {self.produit} ({self.periode_gestion})"
