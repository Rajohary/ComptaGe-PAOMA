"""
Services métier pour l'application Audit (détection des écarts et tableau de bord Inspecteur).
Conforme à ARCHITECTURE.md (§ 3 : la logique métier vit dans services.py).
"""

import json
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import (
    F,
    Q,
    Sum,
    Count,
    Case,
    When,
    DecimalField,
    ExpressionWrapper,
    Value,
)
from apps.audit.models import AuditLogEntry
from apps.comptabilite.models import Mouvement
from apps.referentiel.models import Bureau



def get_ecarts_queryset(filters=None):
    """
    Construit le QuerySet des mouvements en anomalie / écart (équivalent vue DIF du CDC).
    Critère d'écart : montant_rectifie != montant OU augmentation > 0 OU diminution > 0.
    """
    filters = filters or {}

    # Écart : montant_rectifie != montant OU augmentation != 0 OU diminution != 0
    qs = Mouvement.objects.filter(
        ~Q(montant=F("montant_rectifie")) | Q(augmentation__gt=0) | Q(diminution__gt=0)
    ).select_related(
        "periode_gestion__bureau__province",
        "ligne_comptable__section",
        "saisi_par",
        "rectifie_par",
    )

    # 1. Filtre Bureau
    bureau_filter = filters.get("bureau")
    if bureau_filter:
        if str(bureau_filter).isdigit():
            b_val = int(bureau_filter)
            qs = qs.filter(
                Q(periode_gestion__bureau_id=b_val)
                | Q(periode_gestion__bureau__ncodique=b_val)
            )
        else:
            qs = qs.filter(periode_gestion__bureau__nom_bureau__icontains=bureau_filter)

    # 2. Filtre Province
    province_filter = filters.get("province")
    if province_filter:
        if str(province_filter).isdigit():
            qs = qs.filter(periode_gestion__bureau__province_id=int(province_filter))
        else:
            qs = qs.filter(periode_gestion__bureau__province__nom__icontains=province_filter)

    # 3. Filtre Période de gestion
    periode_filter = filters.get("periode")
    if periode_filter and str(periode_filter).isdigit():
        qs = qs.filter(periode_gestion_id=int(periode_filter))

    # 4. Plage de dates de l'opération
    date_min = filters.get("date_min")
    if date_min:
        qs = qs.filter(date_operation__gte=date_min)

    date_max = filters.get("date_max")
    if date_max:
        qs = qs.filter(date_operation__lte=date_max)

    # 5. Statut de rectification
    statut = filters.get("statut")
    if statut == "non_rectifie":
        # En attente de traitement : motif vide ou pas d'inspecteur rectificateur
        qs = qs.filter(Q(rectifie_par__isnull=True) | Q(motif_rectification=""))
    elif statut == "rectifie":
        # Traité : inspecteur renseigné et motif explicité
        qs = qs.filter(rectifie_par__isnull=False).exclude(motif_rectification="")

    # 6. Recherche textuelle (compte, libellé, motif, nom du bureau)
    search = filters.get("search")
    if search:
        qs = qs.filter(
            Q(motif_rectification__icontains=search)
            | Q(ligne_comptable__compte__icontains=search)
            | Q(ligne_comptable__libelle__icontains=search)
            | Q(periode_gestion__bureau__nom_bureau__icontains=search)
        )

    # 7. Tri / Ordonnancement
    ordering = filters.get("ordering", "-date_operation")
    valid_orderings = {
        "date_operation": "date_operation",
        "-date_operation": "-date_operation",
        "montant": "montant",
        "-montant": "-montant",
        "montant_rectifie": "montant_rectifie",
        "-montant_rectifie": "-montant_rectifie",
        "created_at": "created_at",
        "-created_at": "-created_at",
    }
    qs = qs.order_by(valid_orderings.get(ordering, "-date_operation"), "-id")

    return qs


def calculate_ecarts_kpis(base_qs):
    """
    Calcule les indicateurs clés (KPIs) pour le tableau de bord Inspecteur.
    """
    total_count = base_qs.count()

    if total_count == 0:
        return {
            "total_ecarts_count": 0,
            "total_montant_declare": Decimal("0.00"),
            "total_montant_rectifie": Decimal("0.00"),
            "total_ecart_net": Decimal("0.00"),
            "total_ecart_absolu": Decimal("0.00"),
            "total_augmentation": Decimal("0.00"),
            "total_diminution": Decimal("0.00"),
            "nb_bureaux_impactes": 0,
            "nb_non_rectifies": 0,
            "nb_rectifies": 0,
            "bureaux_avec_ecarts": [],
        }

    agg = base_qs.aggregate(
        montant_declare=Sum("montant"),
        montant_rectif=Sum("montant_rectifie"),
        total_aug=Sum("augmentation"),
        total_dim=Sum("diminution"),
    )

    montant_declare = agg["montant_declare"] or Decimal("0.00")
    montant_rectif = agg["montant_rectif"] or Decimal("0.00")
    total_aug = agg["total_aug"] or Decimal("0.00")
    total_dim = agg["total_dim"] or Decimal("0.00")
    ecart_net = montant_rectif - montant_declare

    # Calcul de l'écart absolu et décompte des statuts
    total_absolu = Decimal("0.00")
    nb_non_rectifies = 0
    nb_rectifies = 0

    for m in base_qs:
        diff = abs(m.montant_rectifie - m.montant)
        total_absolu += diff
        if m.rectifie_par and m.motif_rectification:
            nb_rectifies += 1
        else:
            nb_non_rectifies += 1

    # Bureaux impactés avec nombre d'écarts
    bureaux_stats = (
        base_qs.values(
            "periode_gestion__bureau_id",
            "periode_gestion__bureau__ncodique",
            "periode_gestion__bureau__nom_bureau",
            "periode_gestion__bureau__province__nom",
        )
        .annotate(
            nb_ecarts=Count("id"),
            total_declare=Sum("montant"),
            total_rectifie=Sum("montant_rectifie"),
        )
        .order_by("-nb_ecarts")[:10]
    )

    bureaux_avec_ecarts = [
        {
            "bureau_id": b["periode_gestion__bureau_id"],
            "ncodique": b["periode_gestion__bureau__ncodique"],
            "nom_bureau": b["periode_gestion__bureau__nom_bureau"],
            "province_nom": b["periode_gestion__bureau__province__nom"] or "",
            "nb_ecarts": b["nb_ecarts"],
            "total_declare": b["total_declare"] or Decimal("0.00"),
            "total_rectifie": b["total_rectifie"] or Decimal("0.00"),
            "ecart_net": (b["total_rectifie"] or Decimal("0.00")) - (b["total_declare"] or Decimal("0.00")),
        }
        for b in bureaux_stats
    ]

    nb_bureaux_impactes = (
        base_qs.values("periode_gestion__bureau_id").distinct().count()
    )

    return {
        "total_ecarts_count": total_count,
        "total_montant_declare": montant_declare,
        "total_montant_rectifie": montant_rectif,
        "total_ecart_net": ecart_net,
        "total_ecart_absolu": total_absolu,
        "total_augmentation": total_aug,
        "total_diminution": total_dim,
        "nb_bureaux_impactes": nb_bureaux_impactes,
        "nb_non_rectifies": nb_non_rectifies,
        "nb_rectifies": nb_rectifies,
        "bureaux_avec_ecarts": bureaux_avec_ecarts,
    }


def format_mouvement_ecart(m):
    """
    Formate un objet Mouvement pour la représentation détaillée d'un écart.
    """
    bureau = m.periode_gestion.bureau if m.periode_gestion else None
    province = bureau.province if bureau else None
    ligne = m.ligne_comptable
    section = ligne.section if ligne else None

    return {
        "id": m.id,
        "date_operation": m.date_operation,
        "bureau": {
            "id": bureau.id if bureau else None,
            "ncodique": bureau.ncodique if bureau else None,
            "nom_bureau": bureau.nom_bureau if bureau else "",
            "classe": bureau.classe if bureau else "",
            "province_nom": province.nom if province else "",
        },
        "periode_gestion_id": m.periode_gestion_id,
        "ligne_comptable": {
            "id": ligne.id if ligne else None,
            "menu_sub": ligne.menu_sub if ligne else None,
            "compte": ligne.compte if ligne else "",
            "libelle": ligne.libelle if ligne else "",
            "section_code": section.code if section else "",
        },
        "montant": m.montant,
        "augmentation": m.augmentation,
        "diminution": m.diminution,
        "montant_rectifie": m.montant_rectifie,
        "ecart": m.montant_rectifie - m.montant,
        "motif_rectification": m.motif_rectification,
        "saisi_par": m.saisi_par.username if m.saisi_par else "",
        "rectifie_par": m.rectifie_par.username if m.rectifie_par else None,
        "est_rectifie": bool(m.rectifie_par and m.motif_rectification),
        "created_at": m.created_at,
        "updated_at": m.updated_at,
    }


@transaction.atomic
def rectifier_mouvement(
    mouvement: Mouvement,
    inspecteur,
    motif: str,
    augmentation: Decimal = Decimal("0.00"),
    diminution: Decimal = Decimal("0.00"),
    montant_rectifie: Decimal = None,
) -> Mouvement:
    """
    Règle métier UC-04 (CDC) :
    Contrôle comptable, détection des écarts et redressement.

    Exigences :
      1. Obligation de motif : motif non vide et explicite.
      2. Calcul automatique ou cohérence stricte de montant_rectifie :
         MontantRectif = Montant + Augmentation - Diminution
      3. Trace immuable dans AuditLogEntry avec détail JSON avant/après.
      4. Met à jour rectifie_par = inspecteur et motif_rectification = motif.
    """
    if not inspecteur or not getattr(inspecteur, "is_authenticated", False):
        raise ValidationError({"inspecteur": "L'inspecteur effectuant la rectification est obligatoire."})

    motif_clean = (motif or "").strip()
    if not motif_clean:
        raise ValidationError(
            {"motif": "Le motif de la rectification est obligatoire (justification de l'écart constatée)."}
        )

    # Conversion en Decimal et validation positive
    aug_dec = Decimal(str(augmentation or 0))
    dim_dec = Decimal(str(diminution or 0))

    if aug_dec < 0:
        raise ValidationError({"augmentation": "L'augmentation ne peut pas être négative."})
    if dim_dec < 0:
        raise ValidationError({"diminution": "La diminution ne peut pas être négative."})

    montant_initial = Decimal(str(mouvement.montant or 0))
    nouveau_rectifie = montant_initial + aug_dec - dim_dec

    if nouveau_rectifie < 0:
        raise ValidationError(
            {"diminution": f"La diminution ({dim_dec}) ne peut excéder le montant initial + augmentation ({montant_initial + aug_dec})."}
        )

    if montant_rectifie is not None:
        rectifie_fourni = Decimal(str(montant_rectifie))
        if rectifie_fourni != nouveau_rectifie:
            raise ValidationError(
                {
                    "montant_rectifie": (
                        f"Incohérence : montant_rectifie ({rectifie_fourni}) doit être égal à "
                        f"montant ({montant_initial}) + augmentation ({aug_dec}) - diminution ({dim_dec}) = {nouveau_rectifie}."
                    )
                }
            )

    # Sauvegarde de l'état précédent pour l'audit log
    etat_avant = {
        "montant": str(mouvement.montant),
        "augmentation": str(mouvement.augmentation),
        "diminution": str(mouvement.diminution),
        "montant_rectifie": str(mouvement.montant_rectifie),
        "motif_rectification": mouvement.motif_rectification,
        "rectifie_par": mouvement.rectifie_par.username if mouvement.rectifie_par else None,
    }

    # Mise à jour du mouvement
    mouvement.augmentation = aug_dec
    mouvement.diminution = dim_dec
    mouvement.montant_rectifie = nouveau_rectifie
    mouvement.motif_rectification = motif_clean
    mouvement.rectifie_par = inspecteur
    mouvement.save()

    etat_apres = {
        "montant": str(mouvement.montant),
        "augmentation": str(mouvement.augmentation),
        "diminution": str(mouvement.diminution),
        "montant_rectifie": str(mouvement.montant_rectifie),
        "motif_rectification": mouvement.motif_rectification,
        "rectifie_par": inspecteur.username,
        "ecart_net": str(nouveau_rectifie - montant_initial),
    }

    # Création de l'entrée d'audit immuable
    AuditLogEntry.objects.create(
        auteur=inspecteur,
        app_label="comptabilite",
        model_name="Mouvement",
        object_id=str(mouvement.id),
        object_repr=f"Mouvement #{mouvement.id} ({mouvement.ligne_comptable.compte if mouvement.ligne_comptable else 'N/A'}) - Bureau {mouvement.periode_gestion.bureau.nom_bureau if mouvement.periode_gestion and mouvement.periode_gestion.bureau else 'N/A'}",
        action=AuditLogEntry.ActionType.RECTIFICATION,
        detail=json.dumps(
            {
                "action": "rectification_inspecteur",
                "avant": etat_avant,
                "apres": etat_apres,
                "motif": motif_clean,
            },
            ensure_ascii=False,
        ),
    )

    return mouvement

