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


class ReceveurDashboardView(APIView):
    """
    Tableau de bord Receveur : progression de la saisie du mois en cours par section,
    montant en caisse actuel et équilibre débit/crédit.
    - GET /api/v1/dashboard/receveur/
    - Query params:
        - bureau : optionnel (id ou ncodique du bureau à consulter)
        - periode : optionnel (id de la période de gestion, sinon période active courante)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models import Q
        from apps.referentiel.models import Bureau, PeriodeGestion
        from .services import get_progression_saisie_receveur

        user = request.user
        role = getattr(user, "role", None)
        bureau_param = request.query_params.get("bureau")
        periode_param = request.query_params.get("periode")

        target_bureau = None

        # 1. Résolution du bureau
        if bureau_param:
            if str(bureau_param).isdigit():
                target_bureau = Bureau.objects.filter(
                    Q(id=int(bureau_param)) | Q(ncodique=int(bureau_param))
                ).first()
            if not target_bureau:
                return Response(
                    {"detail": f"Bureau '{bureau_param}' introuvable."},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            bureau_code = getattr(user, "bureau_code", None)
            if bureau_code is not None:
                target_bureau = Bureau.objects.filter(ncodique=bureau_code).first()
            if not target_bureau:
                if user.is_staff or user.is_superuser or role in ["ADMIN", "INSPECTEUR"]:
                    target_bureau = Bureau.objects.first()
                if not target_bureau:
                    return Response(
                        {"detail": "Aucun bureau associé ni spécifié."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        # 2. Vérification RBAC : isolation stricte
        if not (user.is_staff or user.is_superuser or role in ["ADMIN", "INSPECTEUR"]):
            user_bureau_code = getattr(user, "bureau_code", None)
            if user_bureau_code is None or user_bureau_code != target_bureau.ncodique:
                return Response(
                    {"detail": "Vous n'êtes pas autorisé à consulter un autre bureau."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # 3. Résolution de la période
        target_periode = None
        if periode_param and str(periode_param).isdigit():
            target_periode = PeriodeGestion.objects.filter(
                id=int(periode_param),
                bureau=target_bureau
            ).first()
        else:
            target_periode = PeriodeGestion.objects.filter(
                bureau=target_bureau,
                cloturee=False
            ).order_by("-date_debut", "-id").first()

        if not target_periode:
            return Response({
                "bureau": {
                    "id": target_bureau.id,
                    "ncodique": target_bureau.ncodique,
                    "nom_bureau": target_bureau.nom_bureau,
                    "classe": target_bureau.classe,
                    "province_nom": target_bureau.province.nom if target_bureau.province else None,
                },
                "periode": None,
                "has_active_periode": False,
                "message": "Aucune période de gestion active trouvée pour ce bureau.",
                "progression_sections": [],
                "totaux_mouvements": {
                    "nb_mouvements": 0,
                    "total_debit": "0.00",
                    "total_credit": "0.00",
                    "solde_mouvements": "0.00",
                    "nb_ecarts": 0,
                    "dernier_mouvement_date": None,
                },
                "encaisse": {
                    "reserve_numeraire_depart": "0.00",
                    "valeurs_postales_depart": "0.00",
                    "timbres_fiscaux_depart": "0.00",
                    "total_inventaire_depart": "0.00",
                    "total_entrees_encaisse": "0.00",
                    "total_sorties_encaisse": "0.00",
                    "variation_nette": "0.00",
                    "montant_caisse_actuel": "0.00",
                },
            }, status=status.HTTP_200_OK)

        data = get_progression_saisie_receveur(target_periode)
        return Response(data, status=status.HTTP_200_OK)

