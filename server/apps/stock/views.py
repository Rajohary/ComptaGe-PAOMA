from django.db.models import Sum
from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ProduitPostal, StockValeurPostale
from .serializers import ProduitPostalSerializer, StockValeurPostaleSerializer
from .permissions import IsReceveurOrAdminOrReadOnly
from apps.referentiel.permissions import IsAdminUserOrReadOnly


class ProduitPostalViewSet(viewsets.ModelViewSet):
    """
    CRUD et consultation du référentiel des produits postaux.
    - GET /api/v1/produits-postaux/ : accessible à tout utilisateur authentifié (filtrable par catégorie, actif, recherche textuelle).
    - POST / PUT / PATCH / DELETE : réservé aux Administrateurs.
    """
    queryset = ProduitPostal.objects.all().order_by("categorie", "nom")
    serializer_class = ProduitPostalSerializer
    permission_classes = [IsAdminUserOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nom"]
    ordering_fields = ["nom", "categorie", "valeur_faciale"]

    def get_queryset(self):
        qs = super().get_queryset()
        categorie = self.request.query_params.get("categorie")
        if categorie:
            qs = qs.filter(categorie__iexact=categorie)
        actif = self.request.query_params.get("actif")
        if actif is not None:
            if actif.lower() in ["true", "1"]:
                qs = qs.filter(actif=True)
            elif actif.lower() in ["false", "0"]:
                qs = qs.filter(actif=False)
        return qs


class StockValeurPostaleViewSet(viewsets.ModelViewSet):
    """
    Gestion et consultation du Stock de valeurs postales et timbres (Tableau A G58).
    - GET /api/v1/stocks-valeurs/ : liste filtrable par bureau, periode_gestion, produit, categorie.
    - POST /api/v1/stocks-valeurs/ : enregistrement d'une ligne de stock (Receveur du bureau ou Admin).
    - GET /api/v1/stocks-valeurs/{id}/ : détail d'une ligne de stock.
    - PUT / PATCH / DELETE : modification / suppression (Receveur du bureau ou Admin).
    - GET /api/v1/stocks-valeurs/recapitulatif/ : totaux agrégés par bureau et par période.
    """
    queryset = (
        StockValeurPostale.objects
        .select_related("bureau", "periode_gestion", "produit")
        .all()
        .order_by("bureau", "periode_gestion", "produit")
    )
    serializer_class = StockValeurPostaleSerializer
    permission_classes = [IsReceveurOrAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["produit__nom", "bureau__nom_bureau", "bureau__ncodique"]
    ordering_fields = ["bureau", "periode_gestion", "produit", "created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        # Filtre bureau (ID ou ncodique)
        bureau_param = params.get("bureau")
        if bureau_param:
            if bureau_param.isdigit():
                # Peut être l'ID ou le ncodique
                from django.db.models import Q
                qs = qs.filter(Q(bureau_id=int(bureau_param)) | Q(bureau__ncodique=int(bureau_param)))

        # Filtre periode_gestion (ID)
        periode_param = params.get("periode_gestion") or params.get("periode")
        if periode_param and periode_param.isdigit():
            qs = qs.filter(periode_gestion_id=int(periode_param))

        # Filtre produit (ID)
        produit_param = params.get("produit")
        if produit_param and produit_param.isdigit():
            qs = qs.filter(produit_id=int(produit_param))

        # Filtre catégorie de produit (ex: VP, TF)
        cat_param = params.get("categorie")
        if cat_param:
            qs = qs.filter(produit__categorie__iexact=cat_param)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        # Si un Receveur crée le stock et ne spécifie pas le bureau, on peut utiliser son bureau_code
        if (
            not serializer.validated_data.get("bureau")
            and getattr(user, "role", None) == "RECEVEUR"
            and getattr(user, "bureau_code", None)
        ):
            from apps.referentiel.models import Bureau
            bureau = Bureau.objects.filter(ncodique=user.bureau_code).first()
            if bureau:
                serializer.save(bureau=bureau)
                return
        serializer.save()

    @action(detail=False, methods=["get"], url_path="recapitulatif")
    def recapitulatif(self, request):
        """
        Retourne la synthèse et les totaux financiers du stock (Tableau A) pour une période donnée.
        Query params obligatoires ou recommandés : ?periode=<id>&bureau=<id_ou_ncodique>
        """
        qs = self.get_queryset()
        totaux = qs.aggregate(
            total_valeur_initiale=Sum("valeur_initiale"),
            total_valeur_recue=Sum("valeur_recue"),
            total_valeur_vendue=Sum("valeur_vendue"),
            total_valeur_finale=Sum("valeur_finale"),
            total_quantite_initiale=Sum("quantite_initiale"),
            total_quantite_recue=Sum("quantite_recue"),
            total_quantite_vendue=Sum("quantite_vendue"),
            total_quantite_finale=Sum("quantite_finale"),
        )
        # Remplacer None par 0
        data = {k: (v if v is not None else 0) for k, v in totaux.items()}
        data["nb_lignes"] = qs.count()
        return Response(data, status=status.HTTP_200_OK)
