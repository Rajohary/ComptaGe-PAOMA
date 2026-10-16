from rest_framework import viewsets, filters, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import (
    SectionComptable,
    LigneComptable,
    Mouvement,
    RubriqueEncaisse,
    MouvementEncaisse,
)
from .serializers import (
    SectionComptableSerializer,
    LigneComptableSerializer,
    MouvementSerializer,
    RubriqueEncaisseSerializer,
    MouvementEncaisseSerializer,
)
from .permissions import IsSaisieAllowed


class SectionComptableViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API ReadOnly pour les sections macro-comptables (A à E).
    - GET /api/v1/sections-comptables/ : liste des sections (filtrable par actif, sens)
    - GET /api/v1/sections-comptables/{id}/ : détail d'une section
    """
    queryset = SectionComptable.objects.all().order_by("ordre", "code")
    serializer_class = SectionComptableSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "libelle"]
    ordering_fields = ["ordre", "code", "sens"]

    def get_queryset(self):
        qs = super().get_queryset()
        actif_param = self.request.query_params.get("actif")
        if actif_param is not None:
            if actif_param.lower() in ["true", "1"]:
                qs = qs.filter(actif=True)
            elif actif_param.lower() in ["false", "0"]:
                qs = qs.filter(actif=False)

        sens_param = self.request.query_params.get("sens")
        if sens_param is not None:
            qs = qs.filter(sens=sens_param)

        return qs


class LigneComptableViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API ReadOnly pour la recherche instantanée et le référentiel des lignes comptables.
    Consommée par le composant d'autocomplétion / recherche instantanée qui remplace le TreeView legacy.

    - GET /api/v1/lignes-comptables/ : liste paginée des lignes comptables
    - GET /api/v1/lignes-comptables/{id}/ : détail d'une ligne comptable

    Filtres disponibles en query params :
      - search : recherche instantanée textuelle sur 'compte', 'libelle', 'section__code', 'section__libelle'
      - section : filtrage par code de section (ex: 'A', 'B') ou par ID de section
      - sens : filtrage par sens comptable de la section (1 = Débit, 2 = Crédit, 0 = NA)
      - parent : ID de la ligne parente, ou 'null' pour récupérer uniquement les lignes racines
      - feuille : 'true' ou '1' pour ne retourner que les lignes imputables (qui n'ont pas de sous-lignes)
      - actif : 'true' ou 'false' (par défaut actif=True si non spécifié, passer actif=all pour tout inclure)
    """
    queryset = (
        LigneComptable.objects
        .select_related("section", "parent")
        .all()
        .order_by("section__ordre", "menu_sub")
    )
    serializer_class = LigneComptableSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["compte", "libelle", "section__code", "section__libelle"]
    ordering_fields = ["menu_sub", "compte", "libelle", "section__ordre"]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        # 1. Filtre actif (par défaut on filtre les actifs, sauf si actif=all)
        actif_param = params.get("actif")
        if actif_param is None or actif_param.lower() in ["true", "1"]:
            qs = qs.filter(actif=True)
        elif actif_param.lower() in ["false", "0"]:
            qs = qs.filter(actif=False)
        # si actif="all", aucun filtre sur actif n'est appliqué

        # 2. Filtre section (par ID ou par code de section insensible à la casse)
        section_param = params.get("section")
        if section_param:
            if section_param.isdigit():
                qs = qs.filter(section_id=int(section_param))
            else:
                qs = qs.filter(section__code__iexact=section_param)

        # 3. Filtre sens (1=Débit, 2=Crédit)
        sens_param = params.get("sens")
        if sens_param is not None and sens_param.isdigit():
            qs = qs.filter(section__sens=int(sens_param))

        # 4. Filtre parent (ID ou 'null' / 'none')
        parent_param = params.get("parent")
        if parent_param is not None:
            if parent_param.lower() in ["null", "none"]:
                qs = qs.filter(parent__isnull=True)
            elif parent_param.isdigit():
                qs = qs.filter(parent_id=int(parent_param))

        # 5. Filtre feuille (lignes imputables directement, excluant les regroupements comme B1, B2)
        feuille_param = params.get("feuille")
        if feuille_param is not None and feuille_param.lower() in ["true", "1"]:
            qs = qs.filter(sous_lignes__isnull=True)

        return qs


class MouvementViewSet(viewsets.ModelViewSet):
    """
    CRUD des mouvements comptables du Journal G58.
    - GET /api/v1/mouvements/ : consultation filtrable par période, bureau, date, section, sens, etc.
    - POST /api/v1/mouvements/ : saisie d'un nouveau mouvement (init: montant_rectifie=montant, aug=dim=0).
    - GET /api/v1/mouvements/{id}/ : détail d'un mouvement.
    - PUT / PATCH /api/v1/mouvements/{id}/ : modification par l'opérateur avant audit.
    - DELETE /api/v1/mouvements/{id}/ : suppression (période active requise).
    """
    queryset = (
        Mouvement.objects
        .select_related(
            "periode_gestion",
            "periode_gestion__bureau",
            "ligne_comptable",
            "ligne_comptable__section",
            "ligne_comptable__parent",
            "saisi_par",
            "rectifie_par",
        )
        .all()
        .order_by("-date_operation", "-id")
    )
    serializer_class = MouvementSerializer
    permission_classes = [IsSaisieAllowed]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "ligne_comptable__compte",
        "ligne_comptable__libelle",
        "ligne_comptable__section__code",
        "ligne_comptable__section__libelle",
        "periode_gestion__bureau__nom_bureau",
    ]
    ordering_fields = ["date_operation", "montant", "montant_rectifie", "created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        # 1. Filtre par période de gestion
        periode_param = params.get("periode_gestion") or params.get("periode")
        if periode_param and periode_param.isdigit():
            qs = qs.filter(periode_gestion_id=int(periode_param))

        # 2. Filtre par bureau (ID ou ncodique)
        bureau_param = params.get("bureau")
        if bureau_param and bureau_param.isdigit():
            from django.db.models import Q
            qs = qs.filter(
                Q(periode_gestion__bureau_id=int(bureau_param)) |
                Q(periode_gestion__bureau__ncodique=int(bureau_param))
            )

        # 3. Filtre par date exacte
        date_param = params.get("date_operation") or params.get("date")
        if date_param:
            qs = qs.filter(date_operation=date_param)

        # 4. Filtre par section (code ou ID)
        section_param = params.get("section")
        if section_param:
            if section_param.isdigit():
                qs = qs.filter(ligne_comptable__section_id=int(section_param))
            else:
                qs = qs.filter(ligne_comptable__section__code__iexact=section_param)

        # 5. Filtre par sens (1=Débit, 2=Crédit)
        sens_param = params.get("sens")
        if sens_param and sens_param.isdigit():
            qs = qs.filter(ligne_comptable__section__sens=int(sens_param))

        # 6. Filtre par ligne comptable (ID ou compte)
        compte_param = params.get("compte")
        if compte_param:
            qs = qs.filter(ligne_comptable__compte__iexact=compte_param)

        ligne_param = params.get("ligne_comptable") or params.get("ligne")
        if ligne_param and ligne_param.isdigit():
            qs = qs.filter(ligne_comptable_id=int(ligne_param))

        return qs

    def perform_destroy(self, instance):
        from .services import valider_periode_active
        from rest_framework.exceptions import ValidationError as DRFValidationError
        from django.core.exceptions import ValidationError as DjangoValidationError

        try:
            valider_periode_active(instance.periode_gestion)
        except DjangoValidationError as e:
            raise DRFValidationError(e.message_dict if hasattr(e, "message_dict") else e.messages)

        instance.delete()

    @action(detail=False, methods=["get"], url_path="totaux")
    def totaux(self, request):
        """
        Retourne le calcul consolidé des totaux du Journal G58 :
          - Totaux par section A à E
          - Totaux spécifiques sous-sections B1 à B4
          - Total général Débit, Crédit et Solde net
        Paramètres : ?periode=<id>&date=<YYYY-MM-DD (optionnel)>
        """
        from .services import calcul_totaux_periode
        from apps.referentiel.models import PeriodeGestion
        from rest_framework.response import Response

        periode_id = request.query_params.get("periode") or request.query_params.get("periode_gestion")
        if not periode_id or not periode_id.isdigit():
            return Response(
                {"detail": "Le paramètre query ?periode=<id> est obligatoire."},
                status=400,
            )

        periode = PeriodeGestion.objects.filter(id=int(periode_id)).first()
        if not periode:
            return Response({"detail": "Période de gestion introuvable."}, status=404)

        date_op = request.query_params.get("date") or request.query_params.get("date_operation")
        res = calcul_totaux_periode(periode_gestion=periode, date_operation=date_op)
        return Response(res, status=200)


class RubriqueEncaisseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Référentiel des rubriques d'encaisse et de coffre (TR, SF, CR...).
    """
    queryset = RubriqueEncaisse.objects.select_related("rubrique_parent").all().order_by("menu_sub")
    serializer_class = RubriqueEncaisseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["compte", "libelle", "rubrique_parent__libelle"]


class MouvementEncaisseViewSet(viewsets.ModelViewSet):
    """
    CRUD des mouvements de caisse et de coffre physique (MouvementEncaisse).
    - GET /api/v1/mouvements-encaisse/ : consultation filtrable par période, bureau, rubrique, sens, date.
    - POST /api/v1/mouvements-encaisse/ : enregistrement d'un flux d'encaisse (Entrée=1 / Sortie=2).
    - GET /api/v1/mouvements-encaisse/{id}/ : détail.
    - PUT / PATCH / DELETE : modification et suppression protégées par période active.
    """
    queryset = (
        MouvementEncaisse.objects
        .select_related("periode_gestion", "periode_gestion__bureau", "rubrique_encaisse", "saisi_par")
        .all()
        .order_by("-date_operation", "-id")
    )
    serializer_class = MouvementEncaisseSerializer
    permission_classes = [IsSaisieAllowed]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "rubrique_encaisse__compte",
        "rubrique_encaisse__libelle",
        "periode_gestion__bureau__nom_bureau",
    ]
    ordering_fields = ["date_operation", "montant", "created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        # 1. Filtre période
        periode_param = params.get("periode_gestion") or params.get("periode")
        if periode_param and periode_param.isdigit():
            qs = qs.filter(periode_gestion_id=int(periode_param))

        # 2. Filtre bureau
        bureau_param = params.get("bureau")
        if bureau_param and bureau_param.isdigit():
            from django.db.models import Q
            qs = qs.filter(
                Q(periode_gestion__bureau_id=int(bureau_param)) |
                Q(periode_gestion__bureau__ncodique=int(bureau_param))
            )

        # 3. Filtre date
        date_param = params.get("date_operation") or params.get("date")
        if date_param:
            qs = qs.filter(date_operation=date_param)

        # 4. Filtre sens (1=Entrée, 2=Sortie)
        sens_param = params.get("sens")
        if sens_param and sens_param.isdigit():
            qs = qs.filter(sens=int(sens_param))

        # 5. Filtre rubrique
        rubrique_param = params.get("rubrique_encaisse") or params.get("rubrique")
        if rubrique_param and rubrique_param.isdigit():
            qs = qs.filter(rubrique_encaisse_id=int(rubrique_param))

        compte_param = params.get("compte")
        if compte_param:
            qs = qs.filter(rubrique_encaisse__compte__iexact=compte_param)

        return qs

    def perform_destroy(self, instance):
        from .services import valider_periode_active
        from rest_framework.exceptions import ValidationError as DRFValidationError
        from django.core.exceptions import ValidationError as DjangoValidationError

        try:
            valider_periode_active(instance.periode_gestion)
        except DjangoValidationError as e:
            raise DRFValidationError(e.message_dict if hasattr(e, "message_dict") else e.messages)

        instance.delete()


class SituationComptableView(APIView):
    """
    Endpoint de Situation Comptable Mensuelle officielle (Journal G58) :
    - GET /api/v1/situation-comptable/{periode_id}/
    - Accessible aux RECEVEUR (sur leur bureau), ADMIN et INSPECTEUR.
    - Calcule automatiquement :
        * Le report automatique du solde du mois précédent
        * Les totaux des débits et crédits du mois
        * Les cumuls généraux et les soldes de clôture (débiteur ou créditeur)
        * La décomposition par section (A à E) et sous-sections B1 à B4.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, periode_id):
        from apps.referentiel.models import PeriodeGestion
        from .services import calcul_situation_comptable

        periode = PeriodeGestion.objects.select_related("bureau", "receveur").filter(id=periode_id).first()
        if not periode:
            return Response({"detail": "Période de gestion introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # Contrôle de permission : RECEVEUR isolé à son bureau
        user = request.user
        if not (user.is_staff or user.is_superuser):
            role = getattr(user, "role", None)
            if role == "RECEVEUR":
                bureau_code = getattr(user, "bureau_code", None)
                if bureau_code is not None and bureau_code != periode.bureau.ncodique:
                    return Response(
                        {"detail": "Accès non autorisé : vous ne pouvez consulter que la situation de votre bureau."},
                        status=status.HTTP_403_FORBIDDEN,
                    )

        situation = calcul_situation_comptable(periode)
        return Response(situation, status=status.HTTP_200_OK)
"""
Vues API pour l'application Comptabilité.
Conforme à ARCHITECTURE.md (§ 3 : les vues orchestrent, ne calculent pas).
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.accounts.permissions import HasRole
from apps.comptabilite.services import get_progression_saisie_receveur
from apps.comptabilite.serializers import ReceveurDashboardResponseSerializer


class IsReceveurOrAgentOrAuditeur(HasRole):
    """
    Autorise les rôles RECEVEUR, AGENT_SAISIE, INSPECTEUR et ADMIN.
    L'isolation par bureau pour RECEVEUR/AGENT_SAISIE est assurée dans services.py.
    """
    required_roles = ("RECEVEUR", "AGENT_SAISIE", "INSPECTEUR", "ADMIN")


class ReceveurDashboardView(APIView):
    """
    Tableau de bord Receveur : progression de la saisie du mois en cours par section,
    totaux Débit/Crédit, écarts détectés et situation de caisse actuelle.
    """
    permission_classes = [IsAuthenticated, IsReceveurOrAgentOrAuditeur]

    def get(self, request):
        bureau_id = request.query_params.get("bureau") or request.query_params.get("bureau_id")
        periode_id = request.query_params.get("periode") or request.query_params.get("periode_id")

        data = get_progression_saisie_receveur(
            user=request.user,
            bureau_id=bureau_id,
            periode_id=periode_id,
        )

        serializer = ReceveurDashboardResponseSerializer(data)
        return Response(serializer.data)
