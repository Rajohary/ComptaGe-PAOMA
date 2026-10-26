from django.contrib import admin
from .models import (
    SectionComptable,
    LigneComptable,
    RubriqueEncaisseParent,
    RubriqueEncaisse,
    Mouvement,
    MouvementEncaisse,
)


@admin.register(SectionComptable)
class SectionComptableAdmin(admin.ModelAdmin):
    list_display = ("code", "libelle", "sens", "ordre", "actif")
    list_filter = ("sens", "actif")
    search_fields = ("code", "libelle")
    ordering = ("ordre", "code")


@admin.register(LigneComptable)
class LigneComptableAdmin(admin.ModelAdmin):
    list_display = ("menu_sub", "compte", "libelle", "section", "parent", "actif")
    list_filter = ("section", "actif")
    search_fields = ("menu_sub", "compte", "libelle", "section__code", "section__libelle")
    ordering = ("section__ordre", "menu_sub")
    raw_id_fields = ("parent",)


@admin.register(RubriqueEncaisseParent)
class RubriqueEncaisseParentAdmin(admin.ModelAdmin):
    list_display = ("id_encaisse", "libelle")
    search_fields = ("id_encaisse", "libelle")


@admin.register(RubriqueEncaisse)
class RubriqueEncaisseAdmin(admin.ModelAdmin):
    list_display = ("menu_sub", "compte", "libelle", "rubrique_parent")
    list_filter = ("rubrique_parent",)
    search_fields = ("compte", "libelle", "menu_sub")


@admin.register(Mouvement)
class MouvementAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "date_operation",
        "periode_gestion",
        "ligne_comptable",
        "montant",
        "montant_rectifie",
        "saisi_par",
        "rectifie_par",
    )
    list_filter = ("date_operation", "periode_gestion__bureau")
    search_fields = ("ligne_comptable__compte", "ligne_comptable__libelle", "motif_rectification")


@admin.register(MouvementEncaisse)
class MouvementEncaisseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "date_operation",
        "periode_gestion",
        "rubrique_encaisse",
        "sens",
        "montant",
        "saisi_par",
    )
    list_filter = ("sens", "date_operation", "periode_gestion__bureau")
    search_fields = ("rubrique_encaisse__compte", "rubrique_encaisse__libelle")

