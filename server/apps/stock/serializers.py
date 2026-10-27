from decimal import Decimal
from rest_framework import serializers
from .models import ProduitPostal, StockValeurPostale
from apps.referentiel.serializers import BureauSerializer, PeriodeGestionSerializer


class ProduitPostalSerializer(serializers.ModelSerializer):
    """
    Serializer pour le référentiel des produits postaux (valeurs postales, timbres fiscaux...).
    """
    categorie_libelle = serializers.CharField(source="get_categorie_display", read_only=True)

    class Meta:
        model = ProduitPostal
        fields = [
            "id",
            "nom",
            "categorie",
            "categorie_libelle",
            "valeur_faciale",
            "actif",
        ]


class StockValeurPostaleSerializer(serializers.ModelSerializer):
    """
    Serializer pour le suivi du Stock de valeurs postales et timbres (Tableau A G58).
    Gère la cohérence comptable :
      - quantite_finale = quantite_initiale + quantite_recue - quantite_vendue
      - valeur_finale   = valeur_initiale + valeur_recue - valeur_vendue
      - calcul automatique des valeurs si non fournies ou vérification avec la valeur faciale.
    """
    bureau_detail = BureauSerializer(source="bureau", read_only=True)
    produit_detail = ProduitPostalSerializer(source="produit", read_only=True)
    periode_detail = serializers.SerializerMethodField()

    class Meta:
        model = StockValeurPostale
        fields = [
            "id",
            "bureau",
            "bureau_detail",
            "periode_gestion",
            "periode_detail",
            "produit",
            "produit_detail",
            "quantite_initiale",
            "quantite_recue",
            "quantite_vendue",
            "quantite_finale",
            "valeur_initiale",
            "valeur_recue",
            "valeur_vendue",
            "valeur_finale",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_periode_detail(self, obj):
        periode = obj.periode_gestion
        if not periode:
            return None
        return {
            "id": periode.id,
            "nom_receveur": periode.nom_receveur,
            "date_debut": str(periode.date_debut),
            "date_fin": str(periode.date_fin),
            "cloturee": periode.cloturee,
        }

    def validate(self, attrs):
        # Récupérer les valeurs (en tenant compte de l'instance si mise à jour partielle)
        instance = self.instance

        bureau = attrs.get("bureau", getattr(instance, "bureau", None))
        periode = attrs.get("periode_gestion", getattr(instance, "periode_gestion", None))
        produit = attrs.get("produit", getattr(instance, "produit", None))

        # 1. Vérifier que la période appartient bien au bureau
        if bureau and periode and periode.bureau_id != bureau.id:
            raise serializers.ValidationError(
                {"periode_gestion": "La période de gestion spécifiée n'appartient pas au bureau indiqué."}
            )

        # 2. Vérifier que la période n'est pas clôturée
        if periode and periode.cloturee:
            raise serializers.ValidationError(
                {"periode_gestion": "Impossible de saisir ou modifier un stock sur une période de gestion clôturée."}
            )

        # 3. Quantités
        q_init = attrs.get("quantite_initiale", getattr(instance, "quantite_initiale", 0))
        q_recu = attrs.get("quantite_recue", getattr(instance, "quantite_recue", 0))
        q_vendu = attrs.get("quantite_vendue", getattr(instance, "quantite_vendue", 0))

        # Vérifier que les ventes ne dépassent pas le disponible
        disponible_q = q_init + q_recu
        if q_vendu > disponible_q:
            raise serializers.ValidationError(
                {"quantite_vendue": f"La quantité vendue ({q_vendu}) ne peut excéder le disponible initial + reçu ({disponible_q})."}
            )

        # Calcul ou vérification de quantite_finale
        q_final_calcule = disponible_q - q_vendu
        if "quantite_finale" in attrs:
            if attrs["quantite_finale"] != q_final_calcule:
                raise serializers.ValidationError(
                    {"quantite_finale": f"Incohérence : la quantité finale ({attrs['quantite_finale']}) doit être égale à initiale + reçue - vendue ({q_final_calcule})."}
                )
        else:
            attrs["quantite_finale"] = q_final_calcule

        # 4. Valeurs monétaires
        val_faciale = produit.valeur_faciale if produit else getattr(getattr(instance, "produit", None), "valeur_faciale", None)

        # Si le produit a une valeur faciale et que les valeurs ne sont pas spécifiées, calcul automatique
        if val_faciale is not None:
            val_faciale = Decimal(str(val_faciale))
            if "valeur_initiale" not in attrs and not (instance and instance.valeur_initiale):
                attrs["valeur_initiale"] = Decimal(q_init) * val_faciale
            if "valeur_recue" not in attrs and not (instance and instance.valeur_recue):
                attrs["valeur_recue"] = Decimal(q_recu) * val_faciale
            if "valeur_vendue" not in attrs and not (instance and instance.valeur_vendue):
                attrs["valeur_vendue"] = Decimal(q_vendu) * val_faciale

        v_init = attrs.get("valeur_initiale", getattr(instance, "valeur_initiale", Decimal("0.00")))
        v_recu = attrs.get("valeur_recue", getattr(instance, "valeur_recue", Decimal("0.00")))
        v_vendu = attrs.get("valeur_vendue", getattr(instance, "valeur_vendue", Decimal("0.00")))

        disponible_v = Decimal(str(v_init)) + Decimal(str(v_recu))
        if Decimal(str(v_vendu)) > disponible_v:
            raise serializers.ValidationError(
                {"valeur_vendue": f"La valeur vendue ({v_vendu} MGA) ne peut excéder la valeur disponible initiale + reçue ({disponible_v} MGA)."}
            )

        v_final_calcule = disponible_v - Decimal(str(v_vendu))
        if "valeur_finale" in attrs:
            if Decimal(str(attrs["valeur_finale"])) != v_final_calcule:
                raise serializers.ValidationError(
                    {"valeur_finale": f"Incohérence : la valeur finale ({attrs['valeur_finale']}) doit être égale à initiale + reçue - vendue ({v_final_calcule})."}
                )
        else:
            attrs["valeur_finale"] = v_final_calcule

        return attrs
