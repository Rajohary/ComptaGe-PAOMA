from rest_framework.routers import DefaultRouter
from .views import ProduitPostalViewSet, StockValeurPostaleViewSet

router = DefaultRouter()
router.register(r"produits-postaux", ProduitPostalViewSet, basename="produit-postal")
router.register(r"stocks-valeurs", StockValeurPostaleViewSet, basename="stock-valeur")

urlpatterns = router.urls
