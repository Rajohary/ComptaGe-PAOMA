from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status


class HealthCheckView(APIView):
    """
    Endpoint public de healthcheck du backend ComptaGeWeb.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        return Response(
            {
                "status": "healthy",
                "service": "ComptaGeWeb Backend",
                "version": "1.0.0",
            },
            status=status.HTTP_200_OK,
        )
