"""
Modèles pour l'application Audit — détection d'écarts et traçabilité réglementaire.

Correspond aux exigences du CDC § 6.2 (Piste d'Audit et Traçabilité Réglementaire)
et aux zones d'ombre § 6 :
  - AuditLogEntry : table d'audit immuable (horodaté, auteur, objet modifié)

Conforme à ARCHITECTURE.md : l'équivalent de la vue DIF (Montant ≠ MontantRectif)
est géré via la méthode Mouvement.a_ecart() + cet AuditLogEntry pour l'historique
immuable des rectifications.
"""

from django.conf import settings
from django.db import models


class AuditLogEntry(models.Model):
    """
    Historique immuable de toutes les modifications sensibles du système.
    Répond à l'exigence CDC § 6.2 : traçabilité avec horodatage, auteur,
    objet modifié, et nature de l'action.

    Cette table ne doit JAMAIS être modifiée ou supprimée via l'API — elle
    est en écriture seule (append-only). Les permissions DRF doivent rejeter
    toute tentative de PUT/PATCH/DELETE sur cette ressource.
    """

    class ActionType(models.TextChoices):
        CREATION = "CREATION", "Création"
        MODIFICATION = "MODIFICATION", "Modification"
        SUPPRESSION = "SUPPRESSION", "Suppression"
        RECTIFICATION = "RECTIFICATION", "Rectification inspecteur"
        CLOTURE = "CLOTURE", "Clôture de période"
        OUVERTURE = "OUVERTURE", "Ouverture de période"
        CONNEXION = "CONNEXION", "Connexion utilisateur"
        DECONNEXION = "DECONNEXION", "Déconnexion utilisateur"

    # Qui a fait l'action
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_logs",
        verbose_name="Auteur de l'action"
    )

    # Quoi (objet concerné)
    app_label = models.CharField(
        max_length=100,
        verbose_name="Application Django",
        help_text="Ex: comptabilite, referentiel"
    )
    model_name = models.CharField(
        max_length=100,
        verbose_name="Nom du modèle",
        help_text="Ex: Mouvement, PeriodeGestion"
    )
    object_id = models.CharField(
        max_length=50,
        blank=True,
        default="",
        verbose_name="Identifiant de l'objet modifié"
    )
    object_repr = models.CharField(
        max_length=250,
        blank=True,
        default="",
        verbose_name="Représentation textuelle de l'objet"
    )

    # Quelle action
    action = models.CharField(
        max_length=20,
        choices=ActionType.choices,
        verbose_name="Type d'action"
    )

    # Détail (diff JSON ou message libre)
    detail = models.TextField(
        blank=True,
        default="",
        verbose_name="Détail de la modification",
        help_text="JSON ou texte libre décrivant l'état avant/après (motif, champs modifiés…)"
    )

    # Quand (horodatage immuable — auto_now_add, jamais modifié)
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Horodatage (immuable)",
        help_text="Date et heure exactes de l'action, en UTC"
    )

    class Meta:
        db_table = "audit_log_entry"
        ordering = ["-created_at"]
        verbose_name = "Entrée d'audit"
        verbose_name_plural = "Entrées d'audit"
        indexes = [
            models.Index(fields=["app_label", "model_name", "object_id"], name="idx_audit_object"),
            models.Index(fields=["auteur"], name="idx_audit_auteur"),
            models.Index(fields=["action"], name="idx_audit_action"),
            models.Index(fields=["created_at"], name="idx_audit_date"),
        ]

    def __str__(self):
        return (
            f"[{self.created_at:%Y-%m-%d %H:%M}] "
            f"{self.get_action_display()} — {self.model_name}#{self.object_id} "
            f"par {self.auteur}"
        )
