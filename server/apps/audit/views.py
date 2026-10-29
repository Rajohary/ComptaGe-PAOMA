"""
Vues API pour l'application Audit (Tableau de bord Inspecteur et vue DIF des écarts).
Conforme à ARCHITECTURE.md (§ 3 : les vues orchestrent, ne calculent pas).
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.generics import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError

from apps.accounts.permissions import IsInspecteurOrAdmin
from apps.audit.services import (
    get_ecarts_queryset,
    calculate_ecarts_kpis,
    format_mouvement_ecart,
    rectifier_mouvement,
)
from apps.audit.serializers import (
    EcartItemSerializer,
    InspecteurDashboardResponseSerializer,
    InspecteurKPIsSerializer,
    RectificationMouvementInputSerializer,
)
from apps.comptabilite.models import Mouvement



class StandardResultsPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class EcartsListView(APIView):
    """
    Endpoint listant les mouvements en anomalie / écart (équivalent vue DIF du CDC).
    Réservé aux Inspecteurs et Administrateurs.

    Filtres disponibles :
      - bureau : identifiant ou ncodique ou nom du bureau
      - province : identifiant ou nom de la province
      - periode : identifiant de la période de gestion
      - date_min, date_max : plage temporelle sur date_operation
      - statut : 'non_rectifie' (en attente), 'rectifie' (traité), 'tous'
      - search : recherche textuelle
      - ordering : tri (-date_operation, date_operation, -montant, montant)
      - page, page_size : pagination DRF standard
    """
    permission_classes = [IsAuthenticated, IsInspecteurOrAdmin]

    def get(self, request):
        filters = {
            "bureau": request.query_params.get("bureau"),
            "province": request.query_params.get("province"),
            "periode": request.query_params.get("periode"),
            "date_min": request.query_params.get("date_min"),
            "date_max": request.query_params.get("date_max"),
            "statut": request.query_params.get("statut"),
            "search": request.query_params.get("search"),
            "ordering": request.query_params.get("ordering", "-date_operation"),
        }

        qs = get_ecarts_queryset(filters)
        kpis = calculate_ecarts_kpis(qs)

        paginator = StandardResultsPagination()
        paginated_qs = paginator.paginate_queryset(qs, request, view=self)

        formatted_items = [format_mouvement_ecart(m) for m in paginated_qs]
        serializer = EcartItemSerializer(formatted_items, many=True)

        response_data = {
            "count": paginator.page.paginator.count,
            "next": paginator.get_next_link(),
            "previous": paginator.get_previous_link(),
            "kpis": kpis,
            "results": serializer.data,
        }

        return Response(response_data)


class InspecteurDashboardView(APIView):
    """
    Tableau de bord Inspecteur : KPIs de synthèse des écarts, répartition par bureau
    et dernières anomalies constatées.
    Réservé aux Inspecteurs et Administrateurs.
    """
    permission_classes = [IsAuthenticated, IsInspecteurOrAdmin]

    def get(self, request):
        filters = {
            "bureau": request.query_params.get("bureau"),
            "province": request.query_params.get("province"),
            "date_min": request.query_params.get("date_min"),
            "date_max": request.query_params.get("date_max"),
            "statut": request.query_params.get("statut"),
            "search": request.query_params.get("search"),
        }

        qs = get_ecarts_queryset(filters)
        kpis = calculate_ecarts_kpis(qs)

        # Les 10 écarts les plus récents
        derniers_qs = qs.order_by("-date_operation", "-id")[:10]
        derniers_items = [format_mouvement_ecart(m) for m in derniers_qs]

        data = {
            "kpis": kpis,
            "derniers_ecarts": derniers_items,
        }

        serializer = InspecteurDashboardResponseSerializer(data)
        return Response(serializer.data)


class RectifierMouvementView(APIView):
    """
    Endpoint de rectification d'un mouvement par un Inspecteur ou Administrateur (UC-04).
    PATCH /api/v1/mouvements/{id}/rectifier/

    Règles métier :
      - Réservé aux profils INSPECTEUR et ADMIN (IsInspecteurOrAdmin).
      - Obligation d'un motif explicite.
      - Cohérence mathématique : MontantRectif = Montant + Augmentation - Diminution.
      - Génère un enregistrement immuable dans AuditLogEntry.
    """
    permission_classes = [IsAuthenticated, IsInspecteurOrAdmin]

    def patch(self, request, pk=None, id=None):
        mouvement_id = pk if pk is not None else id
        mouvement = get_object_or_404(Mouvement, pk=mouvement_id)

        serializer = RectificationMouvementInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        try:
            mouvement_rectifie = rectifier_mouvement(
                mouvement=mouvement,
                inspecteur=request.user,
                motif=data.get("motif"),
                augmentation=data.get("augmentation", 0),
                diminution=data.get("diminution", 0),
                montant_rectifie=data.get("montant_rectifie"),
            )
        except DjangoValidationError as e:
            return Response(
                e.message_dict if hasattr(e, "message_dict") else {"detail": e.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )

        formatted = format_mouvement_ecart(mouvement_rectifie)
        out_serializer = EcartItemSerializer(formatted)
        return Response(out_serializer.data, status=status.HTTP_200_OK)

