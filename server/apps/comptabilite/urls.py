from rest_framework.routers import DefaultRouter
from .views import SectionComptableViewSet, LigneComptableViewSet

router = DefaultRouter()
router.register(r"sections-comptables", SectionComptableViewSet, basename="section-comptable")
router.register(r"lignes-comptables", LigneComptableViewSet, basename="ligne-comptable")

urlpatterns = router.urls
