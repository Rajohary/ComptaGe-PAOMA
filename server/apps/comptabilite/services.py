"""
Services métier pour l'application Comptabilité.
Conforme à ARCHITECTURE.md (§ 3 : la logique métier vit dans services.py).
"""

from decimal import Decimal
from django.db.models import Sum, Count, Q
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound

from apps.comptabilite.models import (
    SectionComptable,
    LigneComptable,
    Mouvement,
    MouvementEncaisse,
)
from apps.referentiel.models import Bureau, PeriodeGestion


def get_progression_saisie_receveur(user, bureau_id=None, periode_id=None):
    """
    Agrège les données de progression de saisie du mois en cours pour un bureau.
    Destiné au tableau de bord Receveur (et Agent de saisie rattaché).

    Règles d'accès :
      - Un RECEVEUR ou AGENT_SAISIE ne peut consulter que son propre bureau.
      - Un ADMIN ou INSPECTEUR peut spécifier n'importe quel bureau via bureau_id.
    """
    # 1. Résolution du bureau cible
    bureau = None

    if bureau_id:
        try:
            # Recherche par clé primaire ou ncodique
            if str(bureau_id).isdigit():
                bureau = Bureau.objects.filter(
                    Q(id=int(bureau_id)) | Q(ncodique=int(bureau_id))
                ).first()
            if not bureau:
                raise NotFound(detail=f"Bureau '{bureau_id}' introuvable.")
        except ValueError:
            raise NotFound(detail=f"Identifiant de bureau invalide : '{bureau_id}'.")
    else:
        # Aucun bureau_id fourni : déduire depuis le profil utilisateur
        if getattr(user, "bureau_code", None) is not None:
            bureau = Bureau.objects.filter(
                Q(ncodique=user.bureau_code) | Q(id=user.bureau_code)
            ).first()

        if not bureau:
            # Si admin ou inspecteur sans bureau rattaché, prendre le premier bureau
            if user.is_superuser or getattr(user, "role", None) in ("ADMIN", "INSPECTEUR"):
                bureau = Bureau.objects.order_by("ncodique").first()
            if not bureau:
                raise ValidationError(
                    detail="Aucun bureau de poste spécifié ou rattaché à cet utilisateur."
                )

    # 2. Vérification RBAC du rattachement
    user_role = getattr(user, "role", None)
    if not (user.is_superuser or user_role in ("ADMIN", "INSPECTEUR")):
        user_bureau_code = getattr(user, "bureau_code", None)
        if user_bureau_code is None or (
            bureau.ncodique != user_bureau_code and bureau.id != user_bureau_code
        ):
            raise PermissionDenied(
                detail="Vous n'êtes pas autorisé à consulter les données d'un autre bureau."
            )

    # 3. Résolution de la période de gestion
    periode = None
    if periode_id:
        periode = PeriodeGestion.objects.filter(id=periode_id, bureau=bureau).first()
        if not periode:
            raise NotFound(
                detail=f"Période de gestion #{periode_id} introuvable pour le bureau {bureau.nom_bureau}."
            )
    else:
        # Période active courante (non clôturée)
        periode = PeriodeGestion.objects.filter(bureau=bureau, cloturee=False).order_by("-date_debut").first()
        if not periode:
            # Si aucune en cours, prendre la plus récente clôturée
            periode = PeriodeGestion.objects.filter(bureau=bureau).order_by("-date_debut").first()

    # Si aucune période n'existe encore pour ce bureau
    if not periode:
        return {
            "bureau": {
                "id": bureau.id,
                "ncodique": bureau.ncodique,
                "nom_bureau": bureau.nom_bureau,
                "classe": bureau.classe,
                "province_nom": bureau.province.nom if bureau.province else "",
            },
            "periode": None,
            "has_active_periode": False,
            "message": "Aucune période de gestion ouverte pour ce bureau.",
            "progression_sections": [],
            "totaux_mouvements": {
                "nb_mouvements": 0,
                "total_debit": Decimal("0.00"),
                "total_credit": Decimal("0.00"),
                "solde_mouvements": Decimal("0.00"),
                "nb_ecarts": 0,
                "dernier_mouvement_date": None,
            },
            "encaisse": {
                "reserve_numeraire_depart": Decimal("0.00"),
                "valeurs_postales_depart": Decimal("0.00"),
                "timbres_fiscaux_depart": Decimal("0.00"),
                "total_inventaire_depart": Decimal("0.00"),
                "total_entrees_encaisse": Decimal("0.00"),
                "total_sorties_encaisse": Decimal("0.00"),
                "variation_nette": Decimal("0.00"),
                "montant_caisse_actuel": Decimal("0.00"),
            },
        }

    # 4. Mouvements du Journal G58 pour cette période
    mouvements_qs = Mouvement.objects.filter(periode_gestion=periode)

    # Totaux globaux
    debits_agg = mouvements_qs.filter(
        ligne_comptable__section__sens=SectionComptable.Sens.DEBIT
    ).aggregate(total=Sum("montant_rectifie"))
    total_debit = debits_agg["total"] or Decimal("0.00")

    credits_agg = mouvements_qs.filter(
        ligne_comptable__section__sens=SectionComptable.Sens.CREDIT
    ).aggregate(total=Sum("montant_rectifie"))
    total_credit = credits_agg["total"] or Decimal("0.00")

    nb_mouvements = mouvements_qs.count()
    dernier_mvt = mouvements_qs.order_by("-date_operation", "-id").first()
    dernier_mouvement_date = dernier_mvt.date_operation if dernier_mvt else None

    from django.db.models import F
    nb_ecarts = mouvements_qs.filter(~Q(montant=F("montant_rectifie"))).count()

    # 5. Progression détaillée par Section Comptable (A, B, C, D, E, ENC…)
    sections = SectionComptable.objects.filter(actif=True).order_by("ordre", "code")
    progression_sections = []

    for sec in sections:
        sec_mvts = mouvements_qs.filter(ligne_comptable__section=sec)
        sec_agg = sec_mvts.aggregate(
            total_nominal=Sum("montant"),
            total_rectif=Sum("montant_rectifie"),
            count=Count("id"),
        )
        nb_lignes_distinctes = sec_mvts.values("ligne_comptable").distinct().count()
        total_lignes_section = LigneComptable.objects.filter(section=sec, actif=True).count()

        progression_sections.append({
            "section_id": sec.id,
            "code": sec.code,
            "libelle": sec.libelle,
            "sens": sec.get_sens_display(),
            "sens_code": sec.sens,
            "nb_mouvements": sec_agg["count"] or 0,
            "total_montant": sec_agg["total_nominal"] or Decimal("0.00"),
            "total_rectifie": sec_agg["total_rectif"] or Decimal("0.00"),
            "lignes_utilisees": nb_lignes_distinctes,
            "lignes_total": total_lignes_section,
        })

    # 6. Suivi des liquidités / Encaisse actuelle
    mvts_encaisse = MouvementEncaisse.objects.filter(periode_gestion=periode)
    entrees_agg = mvts_encaisse.filter(
        sens=MouvementEncaisse.SensEncaisse.ENTREE
    ).aggregate(total=Sum("montant"))
    total_entrees = entrees_agg["total"] or Decimal("0.00")

    sorties_agg = mvts_encaisse.filter(
        sens=MouvementEncaisse.SensEncaisse.SORTIE
    ).aggregate(total=Sum("montant"))
    total_sorties = sorties_agg["total"] or Decimal("0.00")

    variation_nette = total_entrees - total_sorties
    montant_caisse_actuel = (periode.reserve_numeraire or Decimal("0.00")) + variation_nette

    total_inventaire_depart = (
        (periode.reserve_numeraire or Decimal("0.00"))
        + (periode.valeurs_postales or Decimal("0.00"))
        + (periode.timbres_fiscaux or Decimal("0.00"))
    )

    return {
        "bureau": {
            "id": bureau.id,
            "ncodique": bureau.ncodique,
            "nom_bureau": bureau.nom_bureau,
            "classe": bureau.classe,
            "province_nom": bureau.province.nom if bureau.province else "",
        },
        "periode": {
            "id": periode.id,
            "nom_receveur": periode.nom_receveur,
            "date_debut": periode.date_debut,
            "date_fin": periode.date_fin,
            "cloturee": periode.cloturee,
            "date_cloture": periode.date_cloture,
        },
        "has_active_periode": not periode.cloturee,
        "message": "Période en cours active." if not periode.cloturee else "Période clôturée.",
        "progression_sections": progression_sections,
        "totaux_mouvements": {
            "nb_mouvements": nb_mouvements,
            "total_debit": total_debit,
            "total_credit": total_credit,
            "solde_mouvements": total_debit - total_credit,
            "nb_ecarts": nb_ecarts,
            "dernier_mouvement_date": dernier_mouvement_date,
        },
        "encaisse": {
            "reserve_numeraire_depart": periode.reserve_numeraire or Decimal("0.00"),
            "valeurs_postales_depart": periode.valeurs_postales or Decimal("0.00"),
            "timbres_fiscaux_depart": periode.timbres_fiscaux or Decimal("0.00"),
            "total_inventaire_depart": total_inventaire_depart,
            "total_entrees_encaisse": total_entrees,
            "total_sorties_encaisse": total_sorties,
            "variation_nette": variation_nette,
            "montant_caisse_actuel": montant_caisse_actuel,
        },
    }
