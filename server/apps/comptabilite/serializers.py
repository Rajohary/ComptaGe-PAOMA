"""
Serializers pour l'application Comptabilité (Tableaux de bord et Journal G58).
"""

from rest_framework import serializers


class BureauProgressionSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    ncodique = serializers.IntegerField()
    nom_bureau = serializers.CharField()
    classe = serializers.CharField()
    province_nom = serializers.CharField(allow_blank=True)


class PeriodeProgressionSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nom_receveur = serializers.CharField()
    date_debut = serializers.DateField()
    date_fin = serializers.DateField()
    cloturee = serializers.BooleanField()
    date_cloture = serializers.DateTimeField(allow_null=True)


class SectionProgressionItemSerializer(serializers.Serializer):
    section_id = serializers.IntegerField()
    code = serializers.CharField()
    libelle = serializers.CharField()
    sens = serializers.CharField()
    sens_code = serializers.IntegerField()
    nb_mouvements = serializers.IntegerField()
    total_montant = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_rectifie = serializers.DecimalField(max_digits=15, decimal_places=2)
    lignes_utilisees = serializers.IntegerField()
    lignes_total = serializers.IntegerField()


class TotauxMouvementsProgressionSerializer(serializers.Serializer):
    nb_mouvements = serializers.IntegerField()
    total_debit = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_credit = serializers.DecimalField(max_digits=15, decimal_places=2)
    solde_mouvements = serializers.DecimalField(max_digits=15, decimal_places=2)
    nb_ecarts = serializers.IntegerField()
    dernier_mouvement_date = serializers.DateField(allow_null=True)


class EncaisseProgressionSerializer(serializers.Serializer):
    reserve_numeraire_depart = serializers.DecimalField(max_digits=15, decimal_places=2)
    valeurs_postales_depart = serializers.DecimalField(max_digits=15, decimal_places=2)
    timbres_fiscaux_depart = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_inventaire_depart = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_entrees_encaisse = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_sorties_encaisse = serializers.DecimalField(max_digits=15, decimal_places=2)
    variation_nette = serializers.DecimalField(max_digits=15, decimal_places=2)
    montant_caisse_actuel = serializers.DecimalField(max_digits=15, decimal_places=2)


class ReceveurDashboardResponseSerializer(serializers.Serializer):
    bureau = BureauProgressionSummarySerializer()
    periode = PeriodeProgressionSummarySerializer(allow_null=True)
    has_active_periode = serializers.BooleanField()
    message = serializers.CharField()
    progression_sections = SectionProgressionItemSerializer(many=True)
    totaux_mouvements = TotauxMouvementsProgressionSerializer()
    encaisse = EncaisseProgressionSerializer()
