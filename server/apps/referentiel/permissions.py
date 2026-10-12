from rest_framework import permissions


class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Permission permettant à tout le monde (ou utilisateurs authentifiés) de lire (GET, HEAD, OPTIONS),
    mais restreignant la création, modification et suppression (POST, PUT, PATCH, DELETE)
    uniquement aux administrateurs (is_staff ou is_superuser ou role == 'ADMIN').
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Supporte à la fois les superutilisateurs/staff Django et le rôle métier ADMIN
        user_role = getattr(user, "role", None)
        return bool(user.is_staff or user.is_superuser or user_role == "ADMIN")


class IsReceveurOrAdmin(permissions.BasePermission):
    """
    Permission pour les périodes de gestion :
    - GET : Accessible à tout utilisateur authentifié (Receveurs, Admins, Inspecteurs).
    - POST (ouverture) : Réservé aux Receveurs ou Admins.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        user_role = getattr(user, "role", None)
        return bool(user.is_staff or user.is_superuser or user_role in ["ADMIN", "RECEVEUR"])

