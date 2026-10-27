from django.contrib import admin
from .models import AuditLogEntry


@admin.register(AuditLogEntry)
class AuditLogEntryAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour la table d'audit immuable.
    Conformément à la traçabilité réglementaire (CDC § 6.2) :
    - Consultation en lecture seule (pas d'ajout, modification ou suppression depuis l'admin).
    """
    list_display = (
        "id",
        "created_at",
        "action",
        "auteur",
        "app_label",
        "model_name",
        "object_id",
        "object_repr",
    )
    list_filter = ("action", "app_label", "model_name", "created_at")
    search_fields = (
        "object_id",
        "object_repr",
        "detail",
        "auteur__username",
        "auteur__email",
    )
    readonly_fields = [f.name for f in AuditLogEntry._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

