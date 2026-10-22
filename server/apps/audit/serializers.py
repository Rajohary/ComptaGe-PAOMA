"""
Serializers pour l'application Audit (Tableau de bord Inspecteur et vue DIF des écarts).
"""

from rest_framework import serializers


class EcartBureauSerializer(serializers.Serializer):
    id = serializers.IntegerField(allow_null=True)
    ncodique = serializers.IntegerField(allow_null=True)
    nom_bureau = serializers.CharField(allow_blank=True)
    classe = serializers.CharField(allow_blank=True)
    province_nom = serializers.CharField(allow_blank=True)


class EcartLigneComptableSerializer(serializers.Serializer):
    id = serializers.IntegerField(allow_null=True)
    menu_sub = serializers.IntegerField(allow_null=True)
    compte = serializers.CharField(allow_blank=True)
    libelle = serializers.CharField(allow_blank=True)
    section_code = serializers.CharField(allow_blank=True)


class EcartItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    date_operation = serializers.DateField()
    bureau = EcartBureauSerializer()
    periode_gestion_id = serializers.IntegerField()
    ligne_comptable = EcartLigneComptableSerializer()
    montant = serializers.DecimalField(max_digits=15, decimal_places=2)
    augmentation = serializers.DecimalField(max_digits=15, decimal_places=2)
    diminution = serializers.DecimalField(max_digits=15, decimal_places=2)
    montant_rectifie = serializers.DecimalField(max_digits=15, decimal_places=2)
    ecart = serializers.DecimalField(max_digits=15, decimal_places=2)
    motif_rectification = serializers.CharField(allow_blank=True)
    saisi_par = serializers.CharField(allow_blank=True)
    rectifie_par = serializers.CharField(allow_null=True)
    est_rectifie = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


class BureauAvecEcartsItemSerializer(serializers.Serializer):
    bureau_id = serializers.IntegerField()
    ncodique = serializers.IntegerField()
    nom_bureau = serializers.CharField()
    province_nom = serializers.CharField(allow_blank=True)
    nb_ecarts = serializers.IntegerField()
    total_declare = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_rectifie = serializers.DecimalField(max_digits=15, decimal_places=2)
    ecart_net = serializers.DecimalField(max_digits=15, decimal_places=2)


class InspecteurKPIsSerializer(serializers.Serializer):
    total_ecarts_count = serializers.IntegerField()
    total_montant_declare = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_montant_rectifie = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_ecart_net = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_ecart_absolu = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_augmentation = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_diminution = serializers.DecimalField(max_digits=15, decimal_places=2)
    nb_bureaux_impactes = serializers.IntegerField()
    nb_non_rectifies = serializers.IntegerField()
    nb_rectifies = serializers.IntegerField()
    bureaux_avec_ecarts = BureauAvecEcartsItemSerializer(many=True)


class InspecteurDashboardResponseSerializer(serializers.Serializer):
    kpis = InspecteurKPIsSerializer()
    derniers_ecarts = EcartItemSerializer(many=True)


class EcartsListResponseSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    next = serializers.CharField(allow_null=True)
    previous = serializers.CharField(allow_null=True)
    kpis = InspecteurKPIsSerializer(required=False)
    results = EcartItemSerializer(many=True)


class RectificationMouvementInputSerializer(serializers.Serializer):
    """
    Serializer d'entrée pour la rectification d'un mouvement par un inspecteur (UC-04).
    """
    motif = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=250,
        trim_whitespace=True,
        help_text="Motif obligatoire justifiant le redressement d'audit"
    )
    augmentation = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        required=False,
        default=0,
        min_value=0,
        help_text="Montant de régularisation à la hausse"
    )
    diminution = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        required=False,
        default=0,
        min_value=0,
        help_text="Montant de régularisation à la baisse"
    )
    montant_rectifie = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        required=False,
        allow_null=True,
        min_value=0,
        help_text="Optionnel : montant final consolidé vérifié (doit être égal à montant + augmentation - diminution)"
    )

