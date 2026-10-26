from django.db.models import Q
from rest_framework import viewsets, filters, status, decorators
from rest_framework.response import Response
from .models import Province, Bureau, PeriodeGestion
from .serializers import ProvinceSerializer, BureauSerializer, PeriodeGestionSerializer
from .permissions import IsAdminUserOrReadOnly, IsReceveurOrAdmin


class ProvinceViewSet(viewsets.ModelViewSet):
    """
    CRUD pour les Provinces de Madagascar.
    Lecture accessible à tous, écriture réservée aux Administrateurs.
    """
    queryset = Province.objects.all().order_by("nprovince")
    serializer_class = ProvinceSerializer
    permission_classes = [IsAdminUserOrReadOnly]
    search_fields = ["nom"]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]


class BureauViewSet(viewsets.ModelViewSet):
    """
    CRUD complet pour les Bureaux de poste.
    - GET /api/v1/bureaux/ : liste paginée avec recherche possible par nom ou ncodique
    - POST /api/v1/bureaux/ : création (réservée Admin)
    - GET /api/v1/bureaux/{id}/ : détail d'un bureau
    - PUT / PATCH /api/v1/bureaux/{id}/ : modification (réservée Admin)
    - DELETE /api/v1/bureaux/{id}/ : suppression (réservée Admin)
    """
    queryset = Bureau.objects.select_related("province").all().order_by("ncodique")
    serializer_class = BureauSerializer
    permission_classes = [IsAdminUserOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nom_bureau", "ncodique", "classe", "ccp"]
    ordering_fields = ["ncodique", "nom_bureau", "created_at"]


class PeriodeGestionViewSet(viewsets.ModelViewSet):
    """
    Gestion des périodes de gestion comptable (Journal G58) :
    - GET /api/v1/periodes-gestion/ : liste des périodes (filtrable par bureau, cloturee)
    - POST /api/v1/periodes-gestion/ : ouverture d'une période de gestion avec inventaire initial obligatoire
    - GET /api/v1/periodes-gestion/{id}/ : détail d'une période
    """
    queryset = PeriodeGestion.objects.select_related("bureau", "receveur").all().order_by("-date_debut", "-id")
    serializer_class = PeriodeGestionSerializer
    permission_classes = [IsReceveurOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nom_receveur", "bureau__nom_bureau", "bureau__ncodique"]
    ordering_fields = ["date_debut", "date_fin", "created_at"]

    def perform_create(self, serializer):
        user = self.request.user
        from django.contrib.auth import get_user_model
        UserModel = get_user_model()
        # Si un utilisateur authentifié Django crée la période et que receveur n'est pas spécifié
        if user and user.is_authenticated and isinstance(user, UserModel) and not serializer.validated_data.get("receveur"):
            serializer.save(receveur=user)
        else:
            serializer.save()

    @decorators.action(detail=True, methods=["post"], url_path="cloturer")
    def cloturer(self, request, pk=None):
        """
        Clôture officielle d'une période de gestion comptable (Journal G58).
        - Passe `cloturee` à True (coupure = 1).
        - Détermine et fige la `date_fin` (fournie dans la requête ou par défaut la date du jour).
        - Enregistre `date_cloture` à l'instant présent.
        - Interdit la re-clôture si la période est déjà clôturée (400 Bad Request).
        - Accessible uniquement au Receveur ou à l'Admin.
        """
        from django.utils import timezone
        import datetime
        periode = self.get_object()

        if periode.cloturee:
            return Response(
                {"detail": "Cette période de gestion est déjà clôturée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        date_fin_str = request.data.get("date_fin")
        if date_fin_str:
            try:
                date_fin_val = datetime.date.fromisoformat(str(date_fin_str))
            except ValueError:
                return Response(
                    {"date_fin": "Format de date de fin invalide (attendu: YYYY-MM-DD)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            date_fin_val = timezone.now().date()

        if date_fin_val < periode.date_debut:
            return Response(
                {"date_fin": f"La date de fin ({date_fin_val}) ne peut pas être antérieure à la date de début ({periode.date_debut})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        periode.cloturee = True
        periode.date_fin = date_fin_val
        periode.date_cloture = timezone.now()
        periode.save(update_fields=["cloturee", "date_fin", "date_cloture", "updated_at"])

        serializer = self.get_serializer(periode)
        return Response(serializer.data, status=status.HTTP_200_OK)


from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdmin
from .services import get_admin_dashboard_overview, get_historique_periodes_bureau
from .serializers import AdminDashboardResponseSerializer, HistoriquePassationResponseSerializer


class AdminDashboardView(APIView):
    """
    Tableau de bord Administrateur : vue d'ensemble globale du système
    (réseau postal, périodes actives, utilisateurs RBAC, volumétrie et alertes d'audit).
    Réservé aux Administrateurs.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        data = get_admin_dashboard_overview()
        serializer = AdminDashboardResponseSerializer(data)
        return Response(serializer.data)


class HistoriquePeriodesBureauView(APIView):
    """
    Historique chronologique des périodes de gestion et passations d'un bureau de poste.
    - Accessible aux Administrateurs et Inspecteurs pour n'importe quel bureau.
    - Accessible aux Receveurs et Agents de saisie uniquement pour leur propre bureau (user.bureau_code == bureau.ncodique).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, bureau_id):
        # Recherche du bureau par ID ou ncodique
        try:
            if str(bureau_id).isdigit():
                val = int(bureau_id)
                bureau = Bureau.objects.filter(Q(id=val) | Q(ncodique=val)).first()
            else:
                bureau = Bureau.objects.filter(ncodique=bureau_id).first()
        except Exception:
            bureau = None

        if not bureau:
            return Response(
                {"detail": "Bureau introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Contrôle RBAC
        user = request.user
        role = getattr(user, "role", None)

        if not (user.is_superuser or role in ["ADMIN", "INSPECTEUR"]):
            # RECEVEUR ou AGENT_SAISIE restreints à leur bureau
            user_bureau = getattr(user, "bureau_code", None)
            if not user_bureau or str(user_bureau) != str(bureau.ncodique):
                return Response(
                    {"detail": "Accès refusé : vous n'êtes pas autorisé à consulter l'historique d'un autre bureau."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        data = get_historique_periodes_bureau(bureau.id)
        serializer = HistoriquePassationResponseSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)



