"""
Modèles pour l'application Comptabilité — cœur fonctionnel du Journal G58.

Correspond aux tables du CDC :
  - tblMenuParent / tblClasse  → SectionComptable
  - tblMenuSub                 → LigneComptable
  - tblEncaisseParent          → RubriqueEncaisseParent
  - tblEncaisse                → RubriqueEncaisse
  - tblMvt                     → Mouvement
  - tblMvtEncaisse             → MouvementEncaisse

Conforme à ARCHITECTURE.md, CDC_ComptaGe.md § 2 et AGENT.md (contraintes FK strictes,
CheckConstraint, pas de dénormalisation, utilisation de settings.AUTH_USER_MODEL).
"""

from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator


# ---------------------------------------------------------------------------
# Plan comptable — hiérarchie Section → Ligne (G58)
# ---------------------------------------------------------------------------

class SectionComptable(models.Model):
    """
    Catégorie macroscopique du plan comptable postal.
    Correspond à tblMenuParent (mainMenu : Debit, Credit, Encaisse…).
    Le champ 'sens' mappe tblClasse : 1 = Débit, 2 = Crédit, 0 = Non applicable.
    """

    class Sens(models.IntegerChoices):
        NON_APPLICABLE = 0, "Non applicable"
        DEBIT = 1, "Débit"
        CREDIT = 2, "Crédit"

    code = models.CharField(
        max_length=10,
        unique=True,
        verbose_name="Code de section",
        help_text="Code court identifiant la section (ex: A, B, C, D, E, ENC)"
    )
    libelle = models.CharField(
        max_length=50,
        verbose_name="Libellé principal",
        help_text="Libellé macro-comptable (mainMenu : Debit, Credit, Encaisse…)"
    )
    sens = models.IntegerField(
        choices=Sens.choices,
        default=Sens.NON_APPLICABLE,
        verbose_name="Sens comptable",
        help_text="1 = Débit, 2 = Crédit, 0 = Non applicable (tblClasse.idType)"
    )
    actif = models.BooleanField(
        default=True,
        verbose_name="Section active",
        help_text="Contrôle d'affichage (status dans tblMenuParent)"
    )
    ordre = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Ordre d'affichage"
    )

    class Meta:
        db_table = "comptabilite_section_comptable"
        ordering = ["ordre", "code"]
        verbose_name = "Section comptable"
        verbose_name_plural = "Sections comptables"

    def __str__(self):
        return f"[{self.code}] {self.libelle}"


class LigneComptable(models.Model):
    """
    Rubrique de saisie détaillée du plan comptable (sous-compte / produit).
    Correspond à tblMenuSub (compte, menuName, menuSub, idMenuGreatPa, status).
    Hiérarchie : SectionComptable → LigneComptable (parent optionnel pour sous-niveaux B1-B4).
    """
    section = models.ForeignKey(
        SectionComptable,
        on_delete=models.PROTECT,
        related_name="lignes",
        verbose_name="Section comptable de rattachement"
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="sous_lignes",
        verbose_name="Ligne parente (hiérarchie)",
        help_text="Pour les sous-niveaux type B1, B2, B3, B4 (idMenuGreatPa)"
    )
    # menuSub du CDC : identifiant métier unique utilisé comme code produit d'imputation
    menu_sub = models.IntegerField(
        unique=True,
        verbose_name="Identifiant métier (menuSub)",
        help_text="Code produit unique d'imputation (menuSub dans tblMenuSub)"
    )
    compte = models.CharField(
        max_length=50,
        blank=True,
        default="",
        verbose_name="Code comptable postal",
        help_text="Préfixe comptable normalisé (ex: AD, BD, CD — champ 'compte' dans tblMenuSub)"
    )
    libelle = models.CharField(
        max_length=250,
        verbose_name="Libellé de la ligne",
        help_text="Intitulé complet (menuName dans tblMenuSub)"
    )
    actif = models.BooleanField(
        default=True,
        verbose_name="Ligne active",
        help_text="Contrôle de désactivation logique (status dans tblMenuSub)"
    )

    class Meta:
        db_table = "comptabilite_ligne_comptable"
        ordering = ["section__ordre", "menu_sub"]
        verbose_name = "Ligne comptable"
        verbose_name_plural = "Lignes comptables"
        indexes = [
            models.Index(fields=["section"], name="idx_ligne_section"),
            models.Index(fields=["menu_sub"], name="idx_ligne_menusub"),
        ]

    def __str__(self):
        return f"{self.compte} — {self.libelle}" if self.compte else self.libelle


# ---------------------------------------------------------------------------
# Rubriques d'encaisse (tblEncaisseParent / tblEncaisse)
# ---------------------------------------------------------------------------

class RubriqueEncaisseParent(models.Model):
    """
    Classification principale des flux de liquidités et d'encaisses.
    Correspond à tblEncaisseParent (idEncaisse, mainEncaisse).
    Ex : 1 = ENCAISSE, 2 = DEBIT/CREDIT.
    """
    id_encaisse = models.IntegerField(
        unique=True,
        verbose_name="Identifiant du type d'encaisse",
        help_text="Identifiant métier (idEncaisse dans tblEncaisseParent)"
    )
    libelle = models.CharField(
        max_length=50,
        verbose_name="Libellé du groupe d'encaisse",
        help_text="mainEncaisse dans tblEncaisseParent"
    )

    class Meta:
        db_table = "comptabilite_rubrique_encaisse_parent"
        ordering = ["id_encaisse"]
        verbose_name = "Rubrique d'encaisse parente"
        verbose_name_plural = "Rubriques d'encaisse parentes"

    def __str__(self):
        return f"{self.id_encaisse} — {self.libelle}"


class RubriqueEncaisse(models.Model):
    """
    Détail des rubriques de trésorerie et d'encaisse.
    Correspond à tblEncaisse (idEncaisse FK, compte, menuName, menuSub).
    Ex : TR = Trésorerie, SF = Stock Final, CR = Créances.
    """
    rubrique_parent = models.ForeignKey(
        RubriqueEncaisseParent,
        on_delete=models.PROTECT,
        related_name="rubriques",
        verbose_name="Type d'encaisse parent",
        help_text="Référence vers tblEncaisseParent (idEncaisse)"
    )
    menu_sub = models.IntegerField(
        unique=True,
        verbose_name="Numéro d'ordre / identifiant",
        help_text="menuSub dans tblEncaisse"
    )
    compte = models.CharField(
        max_length=50,
        blank=True,
        default="",
        verbose_name="Code comptable d'encaisse",
        help_text="Ex: TR, SF, CR (compte dans tblEncaisse)"
    )
    libelle = models.CharField(
        max_length=250,
        verbose_name="Libellé textuel de l'encaisse",
        help_text="menuName dans tblEncaisse"
    )

    class Meta:
        db_table = "comptabilite_rubrique_encaisse"
        ordering = ["rubrique_parent", "menu_sub"]
        verbose_name = "Rubrique d'encaisse"
        verbose_name_plural = "Rubriques d'encaisse"

    def __str__(self):
        return f"{self.compte} — {self.libelle}" if self.compte else self.libelle


# ---------------------------------------------------------------------------
# Journal G58 — Mouvements comptables
# ---------------------------------------------------------------------------

class Mouvement(models.Model):
    """
    Écriture comptable journalière du Journal G58 (Débit/Crédit).
    Correspond à tblMvt du CDC.

    Règles métier critiques (UC-02, UC-04) :
      - Rattaché à une PeriodeGestion active (non clôturée).
      - À la création, montant_rectifie = montant, augmentation = diminution = 0.
      - MontantRectif = Montant + Augmentation – Diminution (vérifié dans services.py).
      - Si montant_rectifie ≠ montant → alerte d'écart (équivalent vue DIF).
    """
    # Relations
    periode_gestion = models.ForeignKey(
        "referentiel.PeriodeGestion",
        on_delete=models.PROTECT,
        related_name="mouvements",
        verbose_name="Période de gestion",
        help_text="Référence vers tblGestionBur (idGestion)"
    )
    ligne_comptable = models.ForeignKey(
        LigneComptable,
        on_delete=models.PROTECT,
        related_name="mouvements",
        verbose_name="Ligne du plan comptable",
        help_text="Produit / rubrique comptable sélectionnée (ProductsId dans tblMvt)"
    )
    saisi_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="mouvements_saisis",
        verbose_name="Agent ayant saisi l'écriture",
        help_text="Traçabilité — champ absent dans le schéma legacy (zone d'ombre CDC § 6.2)"
    )
    rectifie_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mouvements_rectifies",
        verbose_name="Inspecteur ayant rectifié",
        help_text="Renseigné uniquement lors d'une rectification inspecteur"
    )

    # Date / heure de l'opération
    date_operation = models.DateField(
        verbose_name="Date de l'opération comptable",
        help_text="Date de valeur comptable (dateOperation dans tblMvt)"
    )

    # Montants (en Ariary MGA) — DecimalField pour éviter les erreurs d'arrondi float
    montant = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Montant initial déclaré",
        help_text="Montant nominal en MGA (Montant dans tblMvt)"
    )
    augmentation = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Augmentation (redressement +)",
        help_text="Régularisation à la hausse par l'audit (Augmentation dans tblMvt)"
    )
    diminution = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Diminution (redressement −)",
        help_text="Régularisation à la baisse par l'audit (Dimunition dans tblMvt)"
    )
    montant_rectifie = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Montant rectifié (après audit)",
        help_text="MontantRectif = Montant + Augmentation – Diminution (MontantRectif dans tblMvt)"
    )
    motif_rectification = models.CharField(
        max_length=250,
        blank=True,
        default="",
        verbose_name="Motif de la rectification",
        help_text="Justification obligatoire si rectification inspecteur (Motifs dans tblMvt)"
    )

    # Horodatage
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        db_table = "comptabilite_mouvement"
        ordering = ["date_operation", "id"]
        verbose_name = "Mouvement G58"
        verbose_name_plural = "Mouvements G58"
        indexes = [
            models.Index(fields=["periode_gestion", "date_operation"], name="idx_mvt_periode_date"),
            models.Index(fields=["ligne_comptable"], name="idx_mvt_ligne"),
            # Index pour la vue DIF (détection écarts)
            models.Index(fields=["periode_gestion"], name="idx_mvt_periode"),
        ]

    def a_ecart(self):
        """Retourne True si montant_rectifie ≠ montant (équivalent vue DIF du legacy)."""
        return self.montant_rectifie != self.montant

    def __str__(self):
        return (
            f"[{self.date_operation}] {self.ligne_comptable} "
            f"— {self.montant} MGA (période {self.periode_gestion_id})"
        )


class MouvementEncaisse(models.Model):
    """
    Journal des mouvements d'encaisse, de coffre et de flux de liquidités physiques.
    Correspond à tblMvtEncaisse du CDC.

    Règles métier (UC-03) :
      - Rattaché à une PeriodeGestion active.
      - Sens obligatoire : 1 = Entrée, 2 = Sortie.
    """

    class SensEncaisse(models.IntegerChoices):
        ENTREE = 1, "Entrée"
        SORTIE = 2, "Sortie"

    # Relations
    periode_gestion = models.ForeignKey(
        "referentiel.PeriodeGestion",
        on_delete=models.PROTECT,
        related_name="mouvements_encaisse",
        verbose_name="Période de gestion",
        help_text="Référence vers tblGestionBur (idGestion dans tblMvtEncaisse)"
    )
    rubrique_encaisse = models.ForeignKey(
        RubriqueEncaisse,
        on_delete=models.PROTECT,
        related_name="mouvements",
        verbose_name="Rubrique d'encaisse",
        help_text="Référence vers tblEncaisse (ProductsId dans tblMvtEncaisse)"
    )
    saisi_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="mouvements_encaisse_saisis",
        verbose_name="Agent ayant saisi"
    )

    # Sens du flux
    sens = models.IntegerField(
        choices=SensEncaisse.choices,
        verbose_name="Sens du flux",
        help_text="1 = Entrée, 2 = Sortie (idSens dans tblMvtEncaisse)"
    )

    # Date et montant
    date_operation = models.DateField(
        verbose_name="Date de constatation",
        help_text="Date comptable (dateOperation dans tblMvtEncaisse)"
    )
    montant = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Montant constaté en caisse (MGA)",
        help_text="Montant dans tblMvtEncaisse"
    )

    # Horodatage
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        db_table = "comptabilite_mouvement_encaisse"
        ordering = ["date_operation", "id"]
        verbose_name = "Mouvement d'encaisse"
        verbose_name_plural = "Mouvements d'encaisse"
        indexes = [
            models.Index(fields=["periode_gestion", "date_operation"], name="idx_mvtenc_periode_date"),
            models.Index(fields=["rubrique_encaisse"], name="idx_mvtenc_rubrique"),
        ]

    def __str__(self):
        return (
            f"[{self.date_operation}] {self.get_sens_display()} "
            f"— {self.rubrique_encaisse} : {self.montant} MGA"
        )
