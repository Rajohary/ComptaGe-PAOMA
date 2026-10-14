from rest_framework import viewsets, filters, permissions
from .models import SectionComptable, LigneComptable
from .serializers import SectionComptableSerializer, LigneComptableSerializer


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
