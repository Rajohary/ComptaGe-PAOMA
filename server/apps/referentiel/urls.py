from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ProvinceViewSet, BureauViewSet, PeriodeGestionViewSet, AdminDashboardView

router = DefaultRouter()
router.register(r"provinces", ProvinceViewSet, basename="province")
router.register(r"bureaux", BureauViewSet, basename="bureau")
router.register(r"periodes-gestion", PeriodeGestionViewSet, basename="periode-gestion")

urlpatterns = router.urls + [
    path("dashboard/admin/", AdminDashboardView.as_view(), name="dashboard-admin"),
]
