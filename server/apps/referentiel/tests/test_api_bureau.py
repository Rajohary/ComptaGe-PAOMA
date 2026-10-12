import unittest
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from apps.referentiel.views import BureauViewSet
from apps.referentiel.models import Province, Bureau


class MockUser:
    def __init__(self, is_auth=True, is_staff=False, is_super=False, role="AGENT_SAISIE"):
        self.is_authenticated = is_auth
        self.is_staff = is_staff
        self.is_superuser = is_super
        self.role = role


class BureauAPITestCase(unittest.TestCase):
    def setUp(self):
        self.province = Province.objects.create(nprovince=60, nom="Province Test Suite")
        self.factory = APIRequestFactory()

    def tearDown(self):
        Bureau.objects.filter(province=self.province).delete()
        self.province.delete()

    def test_bureau_crud_flow(self):
        # 1. GET list
        view_list = BureauViewSet.as_view({"get": "list"})
        req = self.factory.get("/api/v1/bureaux/")
        resp = view_list(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # 2. POST non-admin
        view_create = BureauViewSet.as_view({"post": "create"})
        payload = {
            "province": self.province.id,
            "ncodique": 60100,
            "nom_bureau": "Bureau Test Runner",
            "classe": "R1",
            "ccp": "60001",
        }
        req_usr = self.factory.post("/api/v1/bureaux/", payload, format="json")
        force_authenticate(req_usr, user=MockUser(role="RECEVEUR"))
        resp_usr = view_create(req_usr)
        self.assertEqual(resp_usr.status_code, status.HTTP_403_FORBIDDEN)

        # 3. POST admin
        req_adm = self.factory.post("/api/v1/bureaux/", payload, format="json")
        force_authenticate(req_adm, user=MockUser(role="ADMIN"))
        resp_adm = view_create(req_adm)
        self.assertEqual(resp_adm.status_code, status.HTTP_201_CREATED)
        b_id = resp_adm.data["id"]
        self.assertEqual(resp_adm.data["nom_bureau"], "Bureau Test Runner")
        self.assertEqual(resp_adm.data["province_detail"]["nom"], "Province Test Suite")

        # 4. GET detail
        view_det = BureauViewSet.as_view({"get": "retrieve"})
        req_det = self.factory.get(f"/api/v1/bureaux/{b_id}/")
        resp_det = view_det(req_det, pk=b_id)
        self.assertEqual(resp_det.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_det.data["ncodique"], 60100)

        # 5. PATCH non-admin
        view_patch = BureauViewSet.as_view({"patch": "partial_update"})
        req_patch_bad = self.factory.patch(f"/api/v1/bureaux/{b_id}/", {"classe": "HC"}, format="json")
        force_authenticate(req_patch_bad, user=MockUser(role="RECEVEUR"))
        resp_patch_bad = view_patch(req_patch_bad, pk=b_id)
        self.assertEqual(resp_patch_bad.status_code, status.HTTP_403_FORBIDDEN)

        # 6. PATCH admin
        req_patch_ok = self.factory.patch(f"/api/v1/bureaux/{b_id}/", {"classe": "HC"}, format="json")
        force_authenticate(req_patch_ok, user=MockUser(role="ADMIN"))
        resp_patch_ok = view_patch(req_patch_ok, pk=b_id)
        self.assertEqual(resp_patch_ok.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_patch_ok.data["classe"], "HC")

        # 7. DELETE non-admin
        view_del = BureauViewSet.as_view({"delete": "destroy"})
        req_del_bad = self.factory.delete(f"/api/v1/bureaux/{b_id}/")
        force_authenticate(req_del_bad, user=MockUser(role="RECEVEUR"))
        resp_del_bad = view_del(req_del_bad, pk=b_id)
        self.assertEqual(resp_del_bad.status_code, status.HTTP_403_FORBIDDEN)

        # 8. DELETE admin
        req_del_ok = self.factory.delete(f"/api/v1/bureaux/{b_id}/")
        force_authenticate(req_del_ok, user=MockUser(role="ADMIN"))
        resp_del_ok = view_del(req_del_ok, pk=b_id)
        self.assertEqual(resp_del_ok.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Bureau.objects.filter(id=b_id).exists())
