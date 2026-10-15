"""
Services métier pour l'application Référentiel et le tableau de bord Admin.
Conforme à ARCHITECTURE.md (§ 3 : la logique métier vit dans services.py).
"""

from decimal import Decimal
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q, F

from apps.referentiel.models import Bureau, Province, PeriodeGestion
from apps.comptabilite.models import Mouvement, MouvementEncaisse, SectionComptable
from apps.audit.models import AuditLogEntry

User = get_user_model()


def get_admin_dashboard_overview():
    """
    Calcule la vue d'ensemble globale du système pour le tableau de bord Administrateur.
    Agrège :
      - Maillage territorial et couverture postale (bureaux actifs / inactifs)
      - Suivi des périodes de gestion (ouvertes / clôturées)
      - Utilisateurs et répartition par rôles (RBAC)
      - Volumétrie financière globale du réseau
      - Indicateurs d'audit et de vigilance
    """
    # 1. Territoire & Bureaux
    total_bureaux = Bureau.objects.count()
    total_provinces = Province.objects.count()

    # Bureaux ayant au moins une période active (non clôturée)
    bureaux_actifs_ids = set(
        PeriodeGestion.objects.filter(cloturee=False).values_list("bureau_id", flat=True)
    )
    bureaux_actifs_count = len(bureaux_actifs_ids)
    bureaux_sans_periode_active = total_bureaux - bureaux_actifs_count

    # Répartition des bureaux par classe (R1, R2, HC...)
    classes_qs = (
        Bureau.objects.values("classe")
        .annotate(nb=Count("id"))
        .order_by("-nb")
    )
    repartition_classes = [
        {"classe": c["classe"] or "Non définie", "nb_bureaux": c["nb"]}
        for c in classes_qs
    ]

    # Répartition des bureaux par province
    provinces_qs = (
        Province.objects.annotate(nb_bureaux=Count("bureaux"))
        .order_by("nprovince")
    )
    repartition_provinces = [
        {
            "province_id": p.id,
            "nprovince": p.nprovince,
            "province_nom": p.nom,
            "nb_bureaux": p.nb_bureaux,
        }
        for p in provinces_qs
    ]

    # 2. Périodes de gestion
    total_periodes = PeriodeGestion.objects.count()
    periodes_en_cours = PeriodeGestion.objects.filter(cloturee=False).count()
    periodes_cloturees = PeriodeGestion.objects.filter(cloturee=True).count()
    taux_cloture = (
        round((periodes_cloturees / total_periodes) * 100, 1)
        if total_periodes > 0
        else 0.0
    )

    # 3. Utilisateurs & RBAC
    total_utilisateurs = User.objects.count()
    utilisateurs_actifs = User.objects.filter(is_active=True).count()
    roles_qs = User.objects.values("role").annotate(nb=Count("id"))
    repartition_roles = {
        role_choice: 0
        for role_choice in ["ADMIN", "RECEVEUR", "AGENT_SAISIE", "INSPECTEUR"]
    }
    for item in roles_qs:
        if item["role"] in repartition_roles:
            repartition_roles[item["role"]] = item["nb"]

    # 4. Volumétrie comptable globale
    total_mouvements_g58 = Mouvement.objects.count()

    debit_agg = Mouvement.objects.filter(
        ligne_comptable__section__sens=SectionComptable.Sens.DEBIT
    ).aggregate(total=Sum("montant_rectifie"))
    total_debit = debit_agg["total"] or Decimal("0.00")

    credit_agg = Mouvement.objects.filter(
        ligne_comptable__section__sens=SectionComptable.Sens.CREDIT
    ).aggregate(total=Sum("montant_rectifie"))
    total_credit = credit_agg["total"] or Decimal("0.00")

    total_mouvements_encaisse = MouvementEncaisse.objects.count()

    # 5. Vigilance & Audit
    total_ecarts = Mouvement.objects.filter(
        ~Q(montant=F("montant_rectifie")) | Q(augmentation__gt=0) | Q(diminution__gt=0)
    ).count()

    ecarts_en_attente = Mouvement.objects.filter(
        ~Q(montant=F("montant_rectifie")),
        Q(rectifie_par__isnull=True) | Q(motif_rectification=""),
    ).count()

    total_logs_audit = AuditLogEntry.objects.count()
    derniers_logs_qs = AuditLogEntry.objects.select_related("auteur").order_by(
        "-created_at"
    )[:5]

    derniers_logs = [
        {
            "id": log.id,
            "created_at": log.created_at,
            "action": log.action,
            "action_label": log.get_action_display(),
            "auteur": log.auteur.username if log.auteur else "Système",
            "model_name": log.model_name,
            "object_repr": log.object_repr,
            "detail": log.detail,
        }
        for log in derniers_logs_qs
    ]

    return {
        "territoire": {
            "total_bureaux": total_bureaux,
            "total_provinces": total_provinces,
            "bureaux_actifs_count": bureaux_actifs_count,
            "bureaux_sans_periode_active": bureaux_sans_periode_active,
            "repartition_classes": repartition_classes,
            "repartition_provinces": repartition_provinces,
        },
        "periodes": {
            "total_periodes": total_periodes,
            "periodes_en_cours": periodes_en_cours,
            "periodes_cloturees": periodes_cloturees,
            "taux_cloture_pourcentage": taux_cloture,
        },
        "utilisateurs": {
            "total_utilisateurs": total_utilisateurs,
            "utilisateurs_actifs": utilisateurs_actifs,
            "repartition_roles": repartition_roles,
        },
        "comptabilite": {
            "total_mouvements_g58": total_mouvements_g58,
            "total_debit": total_debit,
            "total_credit": total_credit,
            "solde_global": total_debit - total_credit,
            "total_mouvements_encaisse": total_mouvements_encaisse,
        },
        "audit": {
            "total_ecarts_detectes": total_ecarts,
            "ecarts_en_attente": ecarts_en_attente,
            "total_logs_audit": total_logs_audit,
            "derniers_logs": derniers_logs,
        },
    }
