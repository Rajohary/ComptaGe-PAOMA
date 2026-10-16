"""
Vues API pour l'application Audit (Tableau de bord Inspecteur et vue DIF des écarts).
Conforme à ARCHITECTURE.md (§ 3 : les vues orchestrent, ne calculent pas).
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from apps.accounts.permissions import IsInspecteurOrAdmin
from apps.audit.services import (
    get_ecarts_queryset,
    calculate_ecarts_kpis,
    format_mouvement_ecart,
)
from apps.audit.serializers import (
    EcartItemSerializer,
    InspecteurDashboardResponseSerializer,
    InspecteurKPIsSerializer,
)


class StandardResultsPagination(PageNumberPagination):
    page_size = 20
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
