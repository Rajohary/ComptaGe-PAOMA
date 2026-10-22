from rest_framework import serializers
from .models import (
    SectionComptable,
    LigneComptable,
    Mouvement,
    RubriqueEncaisseParent,
    RubriqueEncaisse,
    MouvementEncaisse,
)


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
    Prend en charge la création et la modification (POST / PUT / PATCH) par les administrateurs.
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

    def validate(self, attrs):
        parent = attrs.get("parent", getattr(self.instance, "parent", None))
        section = attrs.get("section", getattr(self.instance, "section", None))

        # 1. Cohérence parent-section : si un parent est défini, sa section doit correspondre
        if parent is not None and section is not None:
            if parent.section_id != section.id:
                raise serializers.ValidationError(
                    {"parent": f"La ligne parente (section {parent.section.code}) doit appartenir à la même section ({section.code})."}
                )

        # 2. Empêcher une boucle de parenté : une ligne ne peut pas être son propre parent
        if self.instance and parent is not None:
            if parent.id == self.instance.id:
                raise serializers.ValidationError(
                    {"parent": "Une ligne comptable ne peut pas être son propre parent."}
                )

        return attrs



class MouvementSerializer(serializers.ModelSerializer):
    """
    Serializer pour les écritures comptables du Journal G58.
    Intègre les détails de la ligne comptable, de la période et de l'agent.
    Délègue les validations strictes au module services.py.
    """
    ligne_detail = LigneComptableSerializer(source="ligne_comptable", read_only=True)
    saisi_par_username = serializers.CharField(source="saisi_par.username", read_only=True)
    rectifie_par_username = serializers.CharField(source="rectifie_par.username", read_only=True)
    a_ecart = serializers.BooleanField(read_only=True)

    class Meta:
        model = Mouvement
        fields = [
            "id",
            "periode_gestion",
            "ligne_comptable",
            "ligne_detail",
            "saisi_par",
            "saisi_par_username",
            "rectifie_par",
            "rectifie_par_username",
            "date_operation",
            "montant",
            "augmentation",
            "diminution",
            "montant_rectifie",
            "motif_rectification",
            "a_ecart",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "saisi_par",
            "saisi_par_username",
            "rectifie_par",
            "rectifie_par_username",
            "augmentation",
            "diminution",
            "montant_rectifie",
            "motif_rectification",
            "a_ecart",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        from .services import (
            valider_periode_active,
            valider_date_operation,
            valider_ligne_comptable,
        )
        from django.core.exceptions import ValidationError as DjangoValidationError

        instance = self.instance
        periode = attrs.get("periode_gestion", getattr(instance, "periode_gestion", None))
        ligne = attrs.get("ligne_comptable", getattr(instance, "ligne_comptable", None))
        date_op = attrs.get("date_operation", getattr(instance, "date_operation", None))
        montant = attrs.get("montant", getattr(instance, "montant", None))

        try:
            valider_periode_active(periode)
            valider_date_operation(periode, date_op)
            valider_ligne_comptable(ligne)
            if montant is not None and montant < 0:
                raise serializers.ValidationError({"montant": "Le montant ne peut pas être négatif."})
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict if hasattr(e, "message_dict") else e.messages)

        return attrs

    def create(self, validated_data):
        from .services import creer_mouvement
        from django.core.exceptions import ValidationError as DjangoValidationError

        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else validated_data.get("saisi_par")

        try:
            return creer_mouvement(
                periode_gestion=validated_data["periode_gestion"],
                ligne_comptable=validated_data["ligne_comptable"],
                saisi_par=user,
                date_operation=validated_data["date_operation"],
                montant=validated_data["montant"],
            )
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict if hasattr(e, "message_dict") else e.messages)

    def update(self, instance, validated_data):
        from .services import modifier_mouvement
        from django.core.exceptions import ValidationError as DjangoValidationError

        try:
            return modifier_mouvement(
                mouvement=instance,
                date_operation=validated_data.get("date_operation"),
                montant=validated_data.get("montant"),
                ligne_comptable=validated_data.get("ligne_comptable"),
            )
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict if hasattr(e, "message_dict") else e.messages)


class RubriqueEncaisseParentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RubriqueEncaisseParent
        fields = ["id", "id_encaisse", "libelle"]


class RubriqueEncaisseSerializer(serializers.ModelSerializer):
    parent_libelle = serializers.CharField(source="rubrique_parent.libelle", read_only=True)

    class Meta:
        model = RubriqueEncaisse
        fields = [
            "id",
            "rubrique_parent",
            "parent_libelle",
            "menu_sub",
            "compte",
            "libelle",
        ]


class MouvementEncaisseSerializer(serializers.ModelSerializer):
    """
    Serializer pour les flux physiques de caisse et de coffre (MouvementEncaisse).
    """
    rubrique_detail = RubriqueEncaisseSerializer(source="rubrique_encaisse", read_only=True)
    sens_libelle = serializers.CharField(source="get_sens_display", read_only=True)
    saisi_par_username = serializers.CharField(source="saisi_par.username", read_only=True)

    class Meta:
        model = MouvementEncaisse
        fields = [
            "id",
            "periode_gestion",
            "rubrique_encaisse",
            "rubrique_detail",
            "sens",
            "sens_libelle",
            "date_operation",
            "montant",
            "saisi_par",
            "saisi_par_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "sens_libelle",
            "saisi_par",
            "saisi_par_username",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        from .services import valider_periode_active, valider_date_operation
        from django.core.exceptions import ValidationError as DjangoValidationError

        instance = self.instance
        periode = attrs.get("periode_gestion", getattr(instance, "periode_gestion", None))
        date_op = attrs.get("date_operation", getattr(instance, "date_operation", None))
        montant = attrs.get("montant", getattr(instance, "montant", None))

        try:
            valider_periode_active(periode)
            valider_date_operation(periode, date_op)
            if montant is not None and montant < 0:
                raise serializers.ValidationError({"montant": "Le montant ne peut pas être négatif."})
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict if hasattr(e, "message_dict") else e.messages)

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else validated_data.get("saisi_par")
        validated_data["saisi_par"] = user
        return super().create(validated_data)
