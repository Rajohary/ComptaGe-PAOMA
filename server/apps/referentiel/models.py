"""
Modèles pour l'application Référentiel Postal.
Conforme à ARCHITECTURE.md, CDC_ComptaGe.md et GLOSSAIRE_METIER_COMPTAGEWEB.md.
"""

from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator


class Province(models.Model):
    """
    Référentiel des provinces administratives de Madagascar (Faritany).
    Correspond à TblProvince (Nprovince, Nom).
    """
    nprovince = models.IntegerField(
        unique=True,
        validators=[MinValueValidator(1)],
        verbose_name="Numéro de province",
        help_text="Numéro d'ordre officiel de la province (ex: 1=Antananarivo, 2=Antsiranana...)"
    )
    nom = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Nom de la province"
    )

    class Meta:
        db_table = "referentiel_province"
        ordering = ["nprovince"]
        verbose_name = "Province"
        verbose_name_plural = "Provinces"

    def __str__(self):
        return f"{self.nprovince} - {self.nom}"


class Bureau(models.Model):
    """
    Référentiel des bureaux de poste de Paositra Malagasy.
    Correspond à TblBureau avec intégrité référentielle stricte (ForeignKey).
    """
    province = models.ForeignKey(
        Province,
        on_delete=models.PROTECT,
        related_name="bureaux",
        verbose_name="Province de rattachement"
    )
    nbur = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Numéro d'ordre dans la province"
    )
    codeclasse = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Code numérique de classe"
    )
    ncodique = models.IntegerField(
        unique=True,
        verbose_name="Code codique officiel",
        help_text="Code codique postal unique du bureau (ex: 50316, 30214)"
    )
    nom_bureau = models.CharField(
        max_length=50,
        verbose_name="Nom du bureau de poste"
    )
    classe = models.CharField(
        max_length=50,
        blank=True,
        default="",
        verbose_name="Classification hiérarchique postale (ex: R1, R2, HC)"
    )
    ccp = models.CharField(
        max_length=10,
        blank=True,
        default="",
        verbose_name="Numéro CCP"
    )
    ncf = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Numéro du Centre Financier de tutelle"
    )
    cf_codik = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Code codique du Centre Financier"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Dernière modification"
    )

    class Meta:
        db_table = "referentiel_bureau"
        ordering = ["ncodique"]
        verbose_name = "Bureau de poste"
        verbose_name_plural = "Bureaux de poste"
        indexes = [
            models.Index(fields=["ncodique"], name="idx_bureau_ncodique"),
            models.Index(fields=["province"], name="idx_bureau_province"),
        ]

    def __str__(self):
        return f"{self.ncodique} - {self.nom_bureau}"


class PeriodeGestion(models.Model):
    """
    Période de gestion d'un receveur pour un bureau de poste.
    Correspond à tblGestionBur du CDC.
    Encadre les opérations comptables G58, l'inventaire d'ouverture et l'état de clôture (coupure).
    """
    bureau = models.ForeignKey(
        Bureau,
        on_delete=models.PROTECT,
        related_name="periodes_gestion",
        verbose_name="Bureau de poste",
        help_text="Bureau de poste rattaché à la période de gestion"
    )
    receveur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="periodes_gestion",
        null=True,
        blank=True,
        verbose_name="Compte utilisateur du receveur",
        help_text="Utilisateur système du receveur responsable (optionnel si nom_receveur renseigné)"
    )
    nom_receveur = models.CharField(
        max_length=50,
        verbose_name="Nom officiel du receveur",
        help_text="Nom officiel du receveur responsable (Nomrec dans tblGestionBur)"
    )
    date_debut = models.DateField(
        verbose_name="Date de début de gestion",
        help_text="Date de prise de fonction / début de période (dateDebGest)"
    )
    date_fin = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date de fin de gestion",
        help_text="Date de cessation / fin de période (déterminée lors de la clôture)"
    )
    # Soldes et inventaire d'ouverture (en Ariary / MGA)
    reserve_numeraire = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
        verbose_name="Réserve en numéraire",
        help_text="Espèces en coffre au départ (reservenum)"
    )
    valeurs_postales = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
        verbose_name="Stock de valeurs postales",
        help_text="Montant des valeurs postales initiales (valPost)"
    )
    timbres_fiscaux = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
        verbose_name="Stock de timbres fiscaux",
        help_text="Montant des timbres fiscaux initial (timbreFisc)"
    )
    solde_debiteur_depart = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
        verbose_name="Solde débiteur initial",
        help_text="Solde débiteur de départ reporté (SoldeDebDepart)"
    )
    solde_crediteur_depart = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
        verbose_name="Solde créditeur initial",
        help_text="Solde créditeur de départ reporté (SoldeCredDepart)"
    )
    # État de clôture (coupure dans CDC : 0 = en cours, 1 = clôturé)
    cloturee = models.BooleanField(
        default=False,
        verbose_name="Gestion clôturée",
        help_text="Indicateur d'arrêt/clôture de gestion (coupure)"
    )
    date_cloture = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date et heure de clôture effective"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Dernière modification"
    )

    class Meta:
        db_table = "referentiel_periode_gestion"
        ordering = ["-date_debut", "-id"]
        verbose_name = "Période de gestion"
        verbose_name_plural = "Périodes de gestion"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(date_fin__isnull=True) | models.Q(date_fin__gte=models.F("date_debut")),
                name="check_periode_gestion_date_fin_gte_debut"
            ),
        ]
        indexes = [
            models.Index(fields=["bureau", "cloturee"], name="idx_periode_bureau_cloture"),
            models.Index(fields=["date_debut", "date_fin"], name="idx_periode_dates"),
        ]

    def clean(self):
        from django.core.exceptions import ValidationError
        super().clean()
        if self.date_debut and self.date_fin and self.date_fin < self.date_debut:
            raise ValidationError({
                "date_fin": "La date de fin de gestion doit être supérieure ou égale à la date de début."
            })
        if self.cloturee and not self.date_fin:
            raise ValidationError({
                "date_fin": "La date de fin de gestion est obligatoire lors de la clôture de la période."
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def verifier_active(self):
        """
        Vérifie si la période de gestion est active.
        Lève une ValidationError si la période est clôturée.
        Règle métier fondamentale : aucune écriture ou mouvement G58 n'est autorisé sur une période clôturée.
        """
        from django.core.exceptions import ValidationError
        if self.cloturee:
            raise ValidationError(
                f"Impossible de saisir un mouvement : la période de gestion ({self}) est déjà clôturée."
            )
        return True

    def __str__(self):
        statut = "Clôturée" if self.cloturee else "En cours"
        date_fin_str = self.date_fin if self.date_fin else "en cours"
        return f"{self.bureau.nom_bureau} ({self.date_debut} au {date_fin_str}) [{statut}]"

