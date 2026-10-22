from decimal import Decimal
import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from apps.audit.models import AuditLogEntry
from apps.audit.views import RectifierMouvementView
from apps.audit.services import rectifier_mouvement
from apps.comptabilite.models import SectionComptable, LigneComptable, Mouvement
from apps.referentiel.models import Province, Bureau, PeriodeGestion

User = get_user_model()


class RectificationMouvementTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.view_rectifier = RectifierMouvementView.as_view()

        # Référentiel
        self.province = Province.objects.create(nprovince=1, nom="Antananarivo")
        self.bureau = Bureau.objects.create(
            province=self.province,
            ncodique=10101,
            nom_bureau="Antaninarenina",
            classe="R1",
        )

        # Utilisateurs
        self.inspecteur = User.objects.create_user(
            username="inspecteur_test",
            password="Password123!",
            role="INSPECTEUR",
        )
        self.admin = User.objects.create_user(
            username="admin_test",
            password="Password123!",
            role="ADMIN",
        )
        self.receveur = User.objects.create_user(
            username="receveur_test",
            password="Password123!",
            role="RECEVEUR",
            bureau_code=10101,
        )
        self.agent = User.objects.create_user(
            username="agent_test",
            password="Password123!",
            role="AGENT_SAISIE",
            bureau_code=10101,
        )

        # Période
        self.periode = PeriodeGestion.objects.create(
            bureau=self.bureau,
            receveur=self.receveur,
            nom_receveur="Receveur Test",
            date_debut="2026-06-01",
            date_fin="2026-06-30",
            reserve_numeraire=Decimal("100000.00"),
            valeurs_postales=Decimal("50000.00"),
            timbres_fiscaux=Decimal("25000.00"),
            cloturee=False,
        )

        # Plan comptable
        self.section = SectionComptable.objects.create(
            code="A",
            libelle="Recettes postales",
            sens=SectionComptable.Sens.DEBIT,
        )
        self.ligne = LigneComptable.objects.create(
            section=self.section,
            menu_sub=101,
            compte="AD01",
            libelle="Vente timbres",
        )

        # Mouvement initial déclaré (sans écart au départ)
        self.mouvement = Mouvement.objects.create(
            periode_gestion=self.periode,
            ligne_comptable=self.ligne,
            saisi_par=self.receveur,
            date_operation="2026-06-05",
            montant=Decimal("50000.00"),
            augmentation=Decimal("0.00"),
            diminution=Decimal("0.00"),
            montant_rectifie=Decimal("50000.00"),
            motif_rectification="",
        )

    def test_rectification_success_avec_calcul_auto_et_audit_log(self):
        """
        Un inspecteur rectifie avec succès un mouvement :
        - montant_rectifie calculé automatiquement : montant + aug - dim
        - audit log immuable créé avec le détail avant/après
        - rectifie_par et motif mis à jour
        """
        payload = {
            "motif": "Sous-déclaration constatée lors de la vérification sur pièces",
            "augmentation": "15000.00",
            "diminution": "0.00",
        }
        request = self.factory.patch(
            f"/api/v1/mouvements/{self.mouvement.id}/rectifier/",
            data=payload,
            format="json",
        )
        force_authenticate(request, user=self.inspecteur)
        response = self.view_rectifier(request, pk=self.mouvement.id)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.mouvement.refresh_from_db()

        self.assertEqual(self.mouvement.montant, Decimal("50000.00"))
        self.assertEqual(self.mouvement.augmentation, Decimal("15000.00"))
        self.assertEqual(self.mouvement.diminution, Decimal("0.00"))
        self.assertEqual(self.mouvement.montant_rectifie, Decimal("65000.00"))
        self.assertEqual(self.mouvement.rectifie_par, self.inspecteur)
        self.assertEqual(
            self.mouvement.motif_rectification,
            "Sous-déclaration constatée lors de la vérification sur pièces",
        )
        self.assertTrue(self.mouvement.a_ecart())

        # Vérification de l'entrée d'audit log
        log_entry = AuditLogEntry.objects.filter(
            model_name="Mouvement",
            object_id=str(self.mouvement.id),
            action=AuditLogEntry.ActionType.RECTIFICATION,
        ).first()
        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.auteur, self.inspecteur)
        detail_json = json.loads(log_entry.detail)
        self.assertEqual(detail_json["avant"]["montant_rectifie"], "50000.00")
        self.assertEqual(detail_json["apres"]["montant_rectifie"], "65000.00")
        self.assertEqual(detail_json["motif"], payload["motif"])

    def test_rectification_sans_motif_rejetee(self):
        """Une rectification sans motif (vide ou absent) est rejetée avec une erreur 400."""
        payload_vide = {
            "motif": "   ",
            "augmentation": "10000.00",
        }
        request = self.factory.patch(
            f"/api/v1/mouvements/{self.mouvement.id}/rectifier/",
            data=payload_vide,
            format="json",
        )
        force_authenticate(request, user=self.inspecteur)
        response = self.view_rectifier(request, pk=self.mouvement.id)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("motif", response.data)

        # Mouvement inchangé
        self.mouvement.refresh_from_db()
        self.assertEqual(self.mouvement.montant_rectifie, Decimal("50000.00"))

    def test_seul_inspecteur_ou_admin_peut_rectifier(self):
        """
        Un agent de saisie ou un receveur ne peut pas appeler l'endpoint de rectification (403 Forbidden).
        Un admin est en revanche autorisé.
        """
        payload = {
            "motif": "Tentative de redressement non autorisé",
            "augmentation": "5000.00",
        }

        # Receveur rejeté
        req_rec = self.factory.patch(
            f"/api/v1/mouvements/{self.mouvement.id}/rectifier/",
            data=payload,
            format="json",
        )
        force_authenticate(req_rec, user=self.receveur)
        res_rec = self.view_rectifier(req_rec, pk=self.mouvement.id)
        self.assertEqual(res_rec.status_code, status.HTTP_403_FORBIDDEN)

        # Agent de saisie rejeté
        req_agent = self.factory.patch(
            f"/api/v1/mouvements/{self.mouvement.id}/rectifier/",
            data=payload,
            format="json",
        )
        force_authenticate(req_agent, user=self.agent)
        res_agent = self.view_rectifier(req_agent, pk=self.mouvement.id)
        self.assertEqual(res_agent.status_code, status.HTTP_403_FORBIDDEN)

        # Utilisateur non authentifié rejeté
        req_anon = self.factory.patch(
            f"/api/v1/mouvements/{self.mouvement.id}/rectifier/",
            data=payload,
            format="json",
        )
        res_anon = self.view_rectifier(req_anon, pk=self.mouvement.id)
        self.assertEqual(res_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # Admin accepté
        req_admin = self.factory.patch(
            f"/api/v1/mouvements/{self.mouvement.id}/rectifier/",
            data=payload,
            format="json",
        )
        force_authenticate(req_admin, user=self.admin)
        res_admin = self.view_rectifier(req_admin, pk=self.mouvement.id)
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)

    def test_incoherence_montant_rectifie_rejete(self):
        """Si un montant_rectifie explicite ne respecte pas montant + aug - dim, la requête est rejetée."""
        payload_faux = {
            "motif": "Erreur volontaire sur montant_rectifie",
            "augmentation": "10000.00",
            "diminution": "0.00",
            "montant_rectifie": "99999.00",  # Faux : 50000 + 10000 = 60000 != 99999
        }
        request = self.factory.patch(
            f"/api/v1/mouvements/{self.mouvement.id}/rectifier/",
            data=payload_faux,
            format="json",
        )
        force_authenticate(request, user=self.inspecteur)
        response = self.view_rectifier(request, pk=self.mouvement.id)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("montant_rectifie", response.data)
