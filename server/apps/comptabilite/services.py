"""
Services métier pour l'application Comptabilité — Journal G58.

Centralise les règles métier critiques :
  - Validation de la période de gestion (active, non clôturée).
  - Validation de la date d'opération (comprise dans l'intervalle de la période).
  - Cohérence de l'imputation sur une ligne comptable active et imputable (feuille).
  - Initialisation stricte de montant_rectifie = montant (et augmentation = diminution = 0) à la création.
  - Calcul et validation de l'équation comptable :
      montant_rectifie == montant + augmentation - diminution
  - Traçabilité et historique d'audit.
"""

from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import transaction
from .models import Mouvement, LigneComptable
from apps.referentiel.models import PeriodeGestion


def valider_periode_active(periode_gestion: PeriodeGestion) -> None:
    """Vérifie qu'une période de gestion est active et non clôturée."""
    if not periode_gestion:
        raise ValidationError({"periode_gestion": "La période de gestion est obligatoire."})
    if periode_gestion.cloturee:
        raise ValidationError(
            {"periode_gestion": "Opération impossible : la période de gestion est clôturée."}
        )


def valider_date_operation(periode_gestion: PeriodeGestion, date_operation) -> None:
    """Vérifie que la date d'opération est comprise entre date_debut et date_fin de la période."""
    if not date_operation:
        raise ValidationError({"date_operation": "La date d'opération est obligatoire."})

    # Si c'est une chaîne, la convertir ou comparer en date si nécessaire
    from datetime import date, datetime
    d_op = date_operation
    if isinstance(d_op, str):
        d_op = datetime.strptime(d_op, "%Y-%m-%d").date()

    if periode_gestion.date_debut and d_op < periode_gestion.date_debut:
        raise ValidationError(
            {"date_operation": f"La date d'opération ({d_op}) est antérieure au début de période ({periode_gestion.date_debut})."}
        )
    if periode_gestion.date_fin and d_op > periode_gestion.date_fin:
        raise ValidationError(
            {"date_operation": f"La date d'opération ({d_op}) est postérieure à la fin de période ({periode_gestion.date_fin})."}
        )


def valider_ligne_comptable(ligne: LigneComptable) -> None:
    """Vérifie que la ligne comptable existe, est active et imputable (non regroupement)."""
    if not ligne:
        raise ValidationError({"ligne_comptable": "La ligne comptable est obligatoire."})
    if not ligne.actif:
        raise ValidationError({"ligne_comptable": f"La ligne comptable '{ligne}' est désactivée."})
    if ligne.sous_lignes.exists():
        raise ValidationError(
            {"ligne_comptable": f"La ligne '{ligne}' est un regroupement et ne peut recevoir d'imputation directe."}
        )


def verifier_coherence_montants(
    montant: Decimal,
    augmentation: Decimal = Decimal("0.00"),
    diminution: Decimal = Decimal("0.00"),
    montant_rectifie: Decimal = None,
) -> Decimal:
    """
    Vérifie l'équation comptable :
      montant_rectifie = montant + augmentation - diminution
    Si montant_rectifie n'est pas fourni, le calcule automatiquement.
    """
    montant = Decimal(str(montant or 0))
    augmentation = Decimal(str(augmentation or 0))
    diminution = Decimal(str(diminution or 0))

    if montant < 0:
        raise ValidationError({"montant": "Le montant ne peut pas être négatif."})
    if augmentation < 0:
        raise ValidationError({"augmentation": "L'augmentation ne peut pas être négative."})
    if diminution < 0:
        raise ValidationError({"diminution": "La diminution ne peut pas être négative."})

    calcule = montant + augmentation - diminution
    if calcule < 0:
        raise ValidationError(
            {"diminution": f"La diminution ({diminution}) excède le montant cumulé ({montant + augmentation})."}
        )

    if montant_rectifie is not None:
        montant_rectifie = Decimal(str(montant_rectifie))
        if montant_rectifie != calcule:
            raise ValidationError(
                {"montant_rectifie": f"Incohérence : montant_rectifie ({montant_rectifie}) ≠ montant ({montant}) + augmentation ({augmentation}) - diminution ({diminution}) = {calcule}."}
            )
    else:
        montant_rectifie = calcule

    return montant_rectifie


@transaction.atomic
def creer_mouvement(
    periode_gestion: PeriodeGestion,
    ligne_comptable: LigneComptable,
    saisi_par,
    date_operation,
    montant: Decimal,
) -> Mouvement:
    """
    Création initiale d'une écriture comptable dans le Journal G58.

    Règles métier :
      - Période active et non clôturée.
      - Date d'opération comprise dans les limites de la période.
      - Ligne comptable active et imputable.
      - À la création initiale :
          * augmentation = 0
          * diminution = 0
          * montant_rectifie = montant
          * rectifie_par = None, motif_rectification = ""
    """
    valider_periode_active(periode_gestion)
    valider_date_operation(periode_gestion, date_operation)
    valider_ligne_comptable(ligne_comptable)

    montant_dec = Decimal(str(montant or 0))
    if montant_dec < 0:
        raise ValidationError({"montant": "Le montant initial déclaré ne peut pas être négatif."})

    mouvement = Mouvement.objects.create(
        periode_gestion=periode_gestion,
        ligne_comptable=ligne_comptable,
        saisi_par=saisi_par,
        date_operation=date_operation,
        montant=montant_dec,
        augmentation=Decimal("0.00"),
        diminution=Decimal("0.00"),
        montant_rectifie=montant_dec,
        motif_rectification="",
        rectifie_par=None,
    )
    return mouvement


@transaction.atomic
def modifier_mouvement(
    mouvement: Mouvement,
    date_operation=None,
    montant: Decimal = None,
    ligne_comptable: LigneComptable = None,
) -> Mouvement:
    """
    Modification d'un mouvement par l'opérateur de saisie avant audit.

    Règles métier :
      - Période toujours active et non clôturée.
      - Si le mouvement n'a pas encore fait l'objet de redressement inspecteur,
        montant_rectifie est réinitialisé avec le nouveau montant.
    """
    valider_periode_active(mouvement.periode_gestion)

    if date_operation is not None:
        valider_date_operation(mouvement.periode_gestion, date_operation)
        mouvement.date_operation = date_operation

    if ligne_comptable is not None:
        valider_ligne_comptable(ligne_comptable)
        mouvement.ligne_comptable = ligne_comptable

    if montant is not None:
        montant_dec = Decimal(str(montant))
        if montant_dec < 0:
            raise ValidationError({"montant": "Le montant ne peut pas être négatif."})
        mouvement.montant = montant_dec

        # Si pas encore rectifié par l'inspecteur, recalculer montant_rectifie = montant
        if mouvement.augmentation == 0 and mouvement.diminution == 0:
            mouvement.montant_rectifie = montant_dec
        else:
            # Revalider la cohérence avec augmentation et diminution
            mouvement.montant_rectifie = verifier_coherence_montants(
                montant=mouvement.montant,
                augmentation=mouvement.augmentation,
                diminution=mouvement.diminution,
                montant_rectifie=None,
            )

    mouvement.save()
    return mouvement


def calcul_totaux_periode(periode_gestion: PeriodeGestion, date_operation=None) -> dict:
    """
    Calcule les totaux comptables du Journal G58 pour une période de gestion donnée :
      - Totaux par section (Sections A, B, C, D, E)
      - Totaux spécifiques par sous-section de la section B (B1, B2, B3, B4)
      - Total général Débit
      - Total général Crédit
      - Solde net de la période (Débit - Crédit ou selon règles comptables)

    Paramètres optionnels :
      - date_operation : permet de filtrer jusqu'à une date précise ou pour une journée donnée.
    """
    from django.db.models import Sum, Q
    from .models import SectionComptable

    if not periode_gestion:
        raise ValidationError({"periode_gestion": "La période de gestion est obligatoire."})

    qs = Mouvement.objects.filter(periode_gestion=periode_gestion)
    if date_operation:
        qs = qs.filter(date_operation=date_operation)

    # 1. Total par section comptable
    sections = SectionComptable.objects.all().order_by("ordre")
    totaux_sections = {}
    total_debit = Decimal("0.00")
    total_credit = Decimal("0.00")

    for sec in sections:
        sec_mouvements = qs.filter(ligne_comptable__section=sec)
        agg = sec_mouvements.aggregate(
            total_declare=Sum("montant"),
            total_rectifie=Sum("montant_rectifie"),
        )
        total_declare = agg["total_declare"] or Decimal("0.00")
        total_rectifie = agg["total_rectifie"] or Decimal("0.00")

        totaux_sections[sec.code] = {
            "section_id": sec.id,
            "code": sec.code,
            "libelle": sec.libelle,
            "sens": sec.sens,
            "sens_libelle": sec.get_sens_display(),
            "total_declare": total_declare,
            "total_rectifie": total_rectifie,
        }

        if sec.sens == SectionComptable.Sens.DEBIT:
            total_debit += total_rectifie
        elif sec.sens == SectionComptable.Sens.CREDIT:
            total_credit += total_rectifie

    # 2. Détail spécifique pour les sous-sections de B (B1, B2, B3, B4)
    # Chercher les lignes parentes de code B1, B2, B3, B4 ou dont les lignes filles ont un parent B1..B4
    sous_sections_b = {}
    for code_b in ["B1", "B2", "B3", "B4"]:
        # Mouvements rattachés soit directement à B1..B4 (si imputation) soit à leurs lignes filles
        mvt_b = qs.filter(
            Q(ligne_comptable__section__code="B") &
            (Q(ligne_comptable__compte__startswith=code_b) | Q(ligne_comptable__parent__compte__startswith=code_b))
        )
        agg_b = mvt_b.aggregate(
            total_declare=Sum("montant"),
            total_rectifie=Sum("montant_rectifie"),
        )
        sous_sections_b[code_b] = {
            "total_declare": agg_b["total_declare"] or Decimal("0.00"),
            "total_rectifie": agg_b["total_rectifie"] or Decimal("0.00"),
        }

    # 3. Calcul du solde
    solde_net = total_debit - total_credit

    return {
        "periode_gestion_id": periode_gestion.id,
        "date_operation": str(date_operation) if date_operation else None,
        "totaux_sections": totaux_sections,
        "sous_sections_b": sous_sections_b,
        "total_general_debit": total_debit,
        "total_general_credit": total_credit,
        "solde_net": solde_net,
    }


def get_periode_precedente(periode: PeriodeGestion) -> PeriodeGestion | None:
    """
    Recherche la période de gestion immédiatement antérieure pour le même bureau.
    """
    return (
        PeriodeGestion.objects
        .filter(bureau=periode.bureau, date_fin__lt=periode.date_debut)
        .order_by("-date_fin", "-id")
        .first()
    )


def calcul_situation_comptable(periode: PeriodeGestion) -> dict:
    """
    Génère la Situation Comptable Mensuelle officielle (Journal G58) :
      1. Report automatique du solde du mois précédent :
         - Si une période précédente existe :
             solde_debiteur_reporte = solde_debiteur_fin de la période précédente
             solde_crediteur_reporte = solde_crediteur_fin de la période précédente
         - Sinon :
             on utilise les soldes de départ saisis à l'ouverture (solde_debiteur_depart, solde_crediteur_depart).
      2. Mouvements du mois :
         - total_debit_mois = somme des débits du mois (Sections A, C...)
         - total_credit_mois = somme des crédits du mois (Sections B, D...)
      3. Cumuls généraux :
         - cumul_debit = solde_debiteur_reporte + total_debit_mois
         - cumul_credit = solde_crediteur_reporte + total_credit_mois
      4. Solde de clôture de fin de mois :
         - Si cumul_debit >= cumul_credit :
             solde_debiteur_fin = cumul_debit - cumul_credit
             solde_crediteur_fin = 0
         - Sinon :
             solde_debiteur_fin = 0
             solde_crediteur_fin = cumul_credit - cumul_debit
    """
    if not periode:
        raise ValidationError({"periode_gestion": "La période de gestion est requise."})

    # 1. Recherche de la période antérieure
    periode_prec = get_periode_precedente(periode)
    if periode_prec:
        sit_prec = calcul_situation_comptable(periode_prec)
        solde_debiteur_reporte = Decimal(str(sit_prec["solde_debiteur_fin"]))
        solde_crediteur_reporte = Decimal(str(sit_prec["solde_crediteur_fin"]))
        source_report = f"Période précédente #{periode_prec.id} ({periode_prec.date_debut} au {periode_prec.date_fin})"
    else:
        solde_debiteur_reporte = Decimal(str(periode.solde_debiteur_depart or 0))
        solde_crediteur_reporte = Decimal(str(periode.solde_crediteur_depart or 0))
        source_report = "Solde initial déclaré à l'ouverture"

    # 2. Totaux des mouvements de la période courante
    totaux_mois = calcul_totaux_periode(periode)
    total_debit_mois = totaux_mois["total_general_debit"]
    total_credit_mois = totaux_mois["total_general_credit"]

    # 3. Cumuls
    cumul_debit = solde_debiteur_reporte + total_debit_mois
    cumul_credit = solde_crediteur_reporte + total_credit_mois

    # 4. Soldes de fin de période
    if cumul_debit >= cumul_credit:
        solde_debiteur_fin = cumul_debit - cumul_credit
        solde_crediteur_fin = Decimal("0.00")
    else:
        solde_debiteur_fin = Decimal("0.00")
        solde_crediteur_fin = cumul_credit - cumul_debit

    return {
        "periode_id": periode.id,
        "bureau_id": periode.bureau.id,
        "bureau_nom": periode.bureau.nom_bureau,
        "bureau_ncodique": periode.bureau.ncodique,
        "nom_receveur": periode.nom_receveur,
        "date_debut": str(periode.date_debut),
        "date_fin": str(periode.date_fin),
        "cloturee": periode.cloturee,
        "source_report": source_report,
        "periode_precedente_id": periode_prec.id if periode_prec else None,
        "solde_debiteur_reporte": solde_debiteur_reporte,
        "solde_crediteur_reporte": solde_crediteur_reporte,
        "total_debit_mois": total_debit_mois,
        "total_credit_mois": total_credit_mois,
        "cumul_debit": cumul_debit,
        "cumul_credit": cumul_credit,
        "solde_debiteur_fin": solde_debiteur_fin,
        "solde_crediteur_fin": solde_crediteur_fin,
        "totaux_sections": totaux_mois["totaux_sections"],
        "sous_sections_b": totaux_mois["sous_sections_b"],
    }


def get_progression_saisie_receveur(periode: PeriodeGestion) -> dict:
    """
    Calcule la progression de saisie et les indicateurs clés pour le tableau de bord Receveur :
      1. Progression par section comptable (A à E) avec compteurs de lignes et volumes
      2. Totaux des mouvements (débits, crédits, solde, détection des anomalies/écarts)
      3. Suivi de l'encaisse physique (réserve numéraire + entrées - sorties = caisse actuelle)
    """
    from django.db.models import Sum, Q, F
    from .models import SectionComptable, Mouvement, MouvementEncaisse, LigneComptable

    bureau = periode.bureau
    bureau_data = {
        "id": bureau.id,
        "ncodique": bureau.ncodique,
        "nom_bureau": bureau.nom_bureau,
        "classe": bureau.classe,
        "province_nom": bureau.province.nom if bureau.province else None,
    }

    periode_data = {
        "id": periode.id,
        "nom_receveur": periode.nom_receveur,
        "date_debut": str(periode.date_debut),
        "date_fin": str(periode.date_fin),
        "cloturee": periode.cloturee,
        "date_cloture": str(periode.date_cloture) if getattr(periode, "date_cloture", None) else None,
    }

    # 1. Progression par section comptable
    sections = SectionComptable.objects.filter(actif=True).order_by("ordre", "code")
    progression_sections = []

    for sec in sections:
        sec_mvts = Mouvement.objects.filter(periode_gestion=periode, ligne_comptable__section=sec)
        agg = sec_mvts.aggregate(
            total_montant=Sum("montant"),
            total_rectifie=Sum("montant_rectifie"),
        )
        lignes_total = LigneComptable.objects.filter(section=sec, actif=True).count()
        lignes_utilisees = sec_mvts.values("ligne_comptable").distinct().count()

        progression_sections.append({
            "section_id": sec.id,
            "code": sec.code,
            "libelle": sec.libelle,
            "sens": sec.get_sens_display(),
            "sens_code": sec.sens,
            "nb_mouvements": sec_mvts.count(),
            "total_montant": agg["total_montant"] or Decimal("0.00"),
            "total_rectifie": agg["total_rectifie"] or Decimal("0.00"),
            "lignes_utilisees": lignes_utilisees,
            "lignes_total": lignes_total,
        })

    # 2. Totaux des mouvements
    all_mvts = Mouvement.objects.filter(periode_gestion=periode)
    nb_mouvements = all_mvts.count()

    total_debit = all_mvts.filter(
        ligne_comptable__section__sens=SectionComptable.Sens.DEBIT
    ).aggregate(s=Sum("montant_rectifie"))["s"] or Decimal("0.00")

    total_credit = all_mvts.filter(
        ligne_comptable__section__sens=SectionComptable.Sens.CREDIT
    ).aggregate(s=Sum("montant_rectifie"))["s"] or Decimal("0.00")

    solde_mouvements = total_debit - total_credit

    nb_ecarts = all_mvts.filter(
        Q(augmentation__gt=0) | Q(diminution__gt=0) | ~Q(montant=F("montant_rectifie"))
    ).count()

    dernier_mvt = all_mvts.order_by("-date_operation", "-id").first()
    dernier_mouvement_date = str(dernier_mvt.date_operation) if dernier_mvt else None

    totaux_mouvements = {
        "nb_mouvements": nb_mouvements,
        "total_debit": total_debit,
        "total_credit": total_credit,
        "solde_mouvements": solde_mouvements,
        "nb_ecarts": nb_ecarts,
        "dernier_mouvement_date": dernier_mouvement_date,
    }

    # 3. Encaisse
    reserve_numeraire = Decimal(str(periode.reserve_numeraire or 0))
    valeurs_postales = Decimal(str(periode.valeurs_postales or 0))
    timbres_fiscaux = Decimal(str(periode.timbres_fiscaux or 0))
    total_inventaire_depart = reserve_numeraire + valeurs_postales + timbres_fiscaux

    all_enc = MouvementEncaisse.objects.filter(periode_gestion=periode)
    total_entrees = all_enc.filter(
        sens=MouvementEncaisse.SensEncaisse.ENTREE
    ).aggregate(s=Sum("montant"))["s"] or Decimal("0.00")

    total_sorties = all_enc.filter(
        sens=MouvementEncaisse.SensEncaisse.SORTIE
    ).aggregate(s=Sum("montant"))["s"] or Decimal("0.00")

    variation_nette = total_entrees - total_sorties
    montant_caisse_actuel = reserve_numeraire + variation_nette

    encaisse_data = {
        "reserve_numeraire_depart": reserve_numeraire,
        "valeurs_postales_depart": valeurs_postales,
        "timbres_fiscaux_depart": timbres_fiscaux,
        "total_inventaire_depart": total_inventaire_depart,
        "total_entrees_encaisse": total_entrees,
        "total_sorties_encaisse": total_sorties,
        "variation_nette": variation_nette,
        "montant_caisse_actuel": montant_caisse_actuel,
    }

    return {
        "bureau": bureau_data,
        "periode": periode_data,
        "has_active_periode": True,
        "message": "Période en cours active.",
        "progression_sections": progression_sections,
        "totaux_mouvements": totaux_mouvements,
        "encaisse": encaisse_data,
    }

