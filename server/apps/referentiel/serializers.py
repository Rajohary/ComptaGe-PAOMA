from rest_framework import serializers
from .models import Province, Bureau, PeriodeGestion


class ProvinceSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Province."""

    class Meta:
        model = Province
        fields = ["id", "nprovince", "nom"]


class BureauSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle Bureau.
    Gère la représentation imbriquée de la province en lecture,
    et accepte l'ID de la province en écriture.
    """
    province_detail = ProvinceSerializer(source="province", read_only=True)

    class Meta:
        model = Bureau
        fields = [
            "id",
            "province",
            "province_detail",
            "nbur",
            "codeclasse",
            "ncodique",
            "nom_bureau",
            "classe",
            "ccp",
            "ncf",
            "cf_codik",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PeriodeGestionSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle PeriodeGestion.
    Valide obligatoirement l'inventaire initial (numéraire, valeurs postales, timbres fiscaux >= 0)
    ainsi que la cohérence des dates (date_fin >= date_debut).
    Empêche la présence de multiples périodes ouvertes simultanées pour un même bureau.
    """
    bureau_detail = BureauSerializer(source="bureau", read_only=True)

    class Meta:
        model = PeriodeGestion
        fields = [
            "id",
            "bureau",
            "bureau_detail",
            "receveur",
            "nom_receveur",
            "date_debut",
            "date_fin",
            "reserve_numeraire",
            "valeurs_postales",
            "timbres_fiscaux",
            "solde_debiteur_depart",
            "solde_crediteur_depart",
            "cloturee",
            "date_cloture",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "cloturee", "date_cloture", "created_at", "updated_at"]
        extra_kwargs = {
            "reserve_numeraire": {"required": True, "allow_null": False},
            "valeurs_postales": {"required": True, "allow_null": False},
            "timbres_fiscaux": {"required": True, "allow_null": False},
            "nom_receveur": {"required": True, "allow_blank": False},
            "date_debut": {"required": True},
            "date_fin": {"required": True},
        }

    def validate(self, attrs):
        date_debut = attrs.get("date_debut")
        date_fin = attrs.get("date_fin")
        if date_debut and date_fin and date_fin < date_debut:
            raise serializers.ValidationError({
                "date_fin": "La date de fin de gestion doit être supérieure ou égale à la date de début."
            })

        # Validation stricte des montants de l'inventaire initial
        for field_name in ["reserve_numeraire", "valeurs_postales", "timbres_fiscaux"]:
            val = attrs.get(field_name)
            if val is None or val < 0:
                raise serializers.ValidationError({
                    field_name: f"Le champ {field_name} est obligatoire et doit être un montant positif ou nul."
                })

        bureau = attrs.get("bureau")
        # Vérification qu'il n'y a pas déjà une période ouverte pour ce bureau
        if self.instance is None and bureau:
            periode_active = PeriodeGestion.objects.filter(bureau=bureau, cloturee=False).exists()
            if periode_active:
                raise serializers.ValidationError({
                    "bureau": f"Une période de gestion est déjà ouverte et non clôturée pour le bureau {bureau.nom_bureau}."
                })

        return attrs
