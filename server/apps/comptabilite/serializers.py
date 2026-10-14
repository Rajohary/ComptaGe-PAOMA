from rest_framework import serializers
from .models import SectionComptable, LigneComptable


class SectionComptableSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle SectionComptable (Sections A à E, etc.).
    """
    sens_libelle = serializers.CharField(source="get_sens_display", read_only=True)

    class Meta:
        model = SectionComptable
        fields = [
            "id",
            "code",
            "libelle",
            "sens",
            "sens_libelle",
            "actif",
            "ordre",
        ]
        read_only_fields = ["id", "sens_libelle"]


class LigneComptableParentSerializer(serializers.ModelSerializer):
    """
    Représentation allégée de la ligne parente (ex: sous-section B1, B2, etc.).
    """
    class Meta:
        model = LigneComptable
        fields = [
            "id",
            "menu_sub",
            "compte",
            "libelle",
        ]


class LigneComptableSerializer(serializers.ModelSerializer):
    """
    Serializer complet pour LigneComptable.
    Enrichit chaque ligne avec le contexte de sa section et de sa ligne parente
    pour une consommation immédiate par le sélecteur / recherche instantanée.
    """
    section_code = serializers.CharField(source="section.code", read_only=True)
    section_libelle = serializers.CharField(source="section.libelle", read_only=True)
    sens = serializers.IntegerField(source="section.sens", read_only=True)
    sens_libelle = serializers.CharField(source="section.get_sens_display", read_only=True)
    parent_detail = LigneComptableParentSerializer(source="parent", read_only=True)

    class Meta:
        model = LigneComptable
        fields = [
            "id",
            "menu_sub",
            "compte",
            "libelle",
            "section",
            "section_code",
            "section_libelle",
            "sens",
            "sens_libelle",
            "parent",
            "parent_detail",
            "actif",
        ]
        read_only_fields = [
            "id",
            "section_code",
            "section_libelle",
            "sens",
            "sens_libelle",
            "parent_detail",
        ]
