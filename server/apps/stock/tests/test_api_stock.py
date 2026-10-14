import unittest
import uuid
from decimal import Decimal
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from apps.referentiel.models import Province, Bureau, PeriodeGestion
from apps.stock.models import ProduitPostal, StockValeurPostale
from apps.stock.views import ProduitPostalViewSet, StockValeurPostaleViewSet


class MockUser:
    """Mock utilisateur pour tester les rôles et permissions RBAC."""
    def __init__(self, is_auth=True, role="RECEVEUR", bureau_code=None):
        self.is_authenticated = is_auth
        self.is_staff = False
        self.is_superuser = False
        self.role = role
        self.bureau_code = bureau_code


class StockValeurPostaleAPITestCase(unittest.TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.uid = uuid.uuid4().hex[:6].upper()

        # Création province et bureau de test
        self.province = Province.objects.create(
            nprovince=80 + (int(self.uid, 16) % 10),
            nom=f"Province Stock {self.uid}",
        )
        self.ncodique = 80100 + (int(self.uid, 16) % 800)
        self.bureau = Bureau.objects.create(
            province=self.province,
            ncodique=self.ncodique,
            nom_bureau=f"Bureau Stock {self.uid}",
            classe="R1",
        )

        # Création d'une période de gestion ouverte
        self.periode = PeriodeGestion.objects.create(
            bureau=self.bureau,
            nom_receveur="Receveur Test Stock",
            date_debut="2026-06-01",
            date_fin="2026-06-30",
            reserve_numeraire=100000,
            valeurs_postales=50000,
            timbres_fiscaux=20000,
            cloturee=False,
        )

        # Création d'un produit postal
        self.produit = ProduitPostal.objects.create(
            nom=f"Timbre Test {self.uid}",
            categorie=ProduitPostal.Categorie.VALEUR_POSTALE,
            valeur_faciale=Decimal("500.00"),
            actif=True,
        )

    def tearDown(self):
        StockValeurPostale.objects.filter(bureau=self.bureau).delete()
        self.produit.delete()
        self.periode.delete()
        self.bureau.delete()
        self.province.delete()

    def test_produits_postaux_list(self):
        """La liste des produits postaux est accessible en lecture à tout utilisateur authentifié."""
        view = ProduitPostalViewSet.as_view({"get": "list"})
        req = self.factory.get("/api/v1/produits-postaux/")
        force_authenticate(req, user=MockUser(role="AGENT_SAISIE"))
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        noms = [item["nom"] for item in resp.data["results"]]
        self.assertIn(self.produit.nom, noms)

    def test_stock_create_receveur_calcul_auto(self):
        """Un receveur peut saisir une ligne de stock et les calculs sont validés."""
        view = StockValeurPostaleViewSet.as_view({"post": "create"})
        payload = {
            "bureau": self.bureau.id,
            "periode_gestion": self.periode.id,
            "produit": self.produit.id,
            "quantite_initiale": 100,
            "quantite_recue": 50,
            "quantite_vendue": 30,
            # quantite_finale (120) et valeurs monétaires calculées automatiquement
        }
        req = self.factory.post("/api/v1/stocks-valeurs/", payload, format="json")
        force_authenticate(req, user=MockUser(role="RECEVEUR", bureau_code=self.ncodique))
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["quantite_finale"], 120)
        self.assertEqual(Decimal(str(resp.data["valeur_initiale"])), Decimal("50000.00"))
        self.assertEqual(Decimal(str(resp.data["valeur_recue"])), Decimal("25000.00"))
        self.assertEqual(Decimal(str(resp.data["valeur_vendue"])), Decimal("15000.00"))
        self.assertEqual(Decimal(str(resp.data["valeur_finale"])), Decimal("60000.00"))

    def test_stock_quantite_vendue_trop_grande_rejected(self):
        """Une quantité vendue supérieure au stock disponible (initial + reçu) doit être refusée (400)."""
        view = StockValeurPostaleViewSet.as_view({"post": "create"})
        payload = {
            "bureau": self.bureau.id,
            "periode_gestion": self.periode.id,
            "produit": self.produit.id,
            "quantite_initiale": 10,
            "quantite_recue": 5,
            "quantite_vendue": 20,  # > 15
        }
        req = self.factory.post("/api/v1/stocks-valeurs/", payload, format="json")
        force_authenticate(req, user=MockUser(role="RECEVEUR", bureau_code=self.ncodique))
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("quantite_vendue", resp.data)

    def test_stock_periode_cloturee_rejected(self):
        """Impossible de créer un stock sur une période clôturée."""
        self.periode.cloturee = True
        self.periode.save()

        view = StockValeurPostaleViewSet.as_view({"post": "create"})
        payload = {
            "bureau": self.bureau.id,
            "periode_gestion": self.periode.id,
            "produit": self.produit.id,
            "quantite_initiale": 10,
            "quantite_recue": 0,
            "quantite_vendue": 0,
        }
        req = self.factory.post("/api/v1/stocks-valeurs/", payload, format="json")
        force_authenticate(req, user=MockUser(role="RECEVEUR", bureau_code=self.ncodique))
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("periode_gestion", resp.data)

    def test_stock_recapitulatif_action(self):
        """L'action recapitulatif/ agrège les totaux du Tableau A pour un bureau et une période."""
        # Créer une ligne de stock
        StockValeurPostale.objects.create(
            bureau=self.bureau,
            periode_gestion=self.periode,
            produit=self.produit,
            quantite_initiale=100,
            quantite_recue=20,
            quantite_vendue=50,
            quantite_finale=70,
            valeur_initiale=Decimal("50000.00"),
            valeur_recue=Decimal("10000.00"),
            valeur_vendue=Decimal("25000.00"),
            valeur_finale=Decimal("35000.00"),
        )

        view = StockValeurPostaleViewSet.as_view({"get": "recapitulatif"})
        req = self.factory.get(f"/api/v1/stocks-valeurs/recapitulatif/?bureau={self.bureau.id}&periode={self.periode.id}")
        force_authenticate(req, user=MockUser(role="INSPECTEUR"))
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["nb_lignes"], 1)
        self.assertEqual(Decimal(str(resp.data["total_valeur_finale"])), Decimal("35000.00"))
        self.assertEqual(resp.data["total_quantite_finale"], 70)
