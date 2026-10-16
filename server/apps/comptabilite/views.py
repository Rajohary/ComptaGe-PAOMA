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
