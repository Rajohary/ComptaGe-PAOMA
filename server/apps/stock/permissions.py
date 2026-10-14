from rest_framework import permissions


class IsReceveurOrAdminOrReadOnly(permissions.BasePermission):
    """
    Permission pour les stocks de valeurs postales :
    - SAFE_METHODS (GET, HEAD, OPTIONS) : Accessible à tout utilisateur authentifié.
    - Écriture (POST, PUT, PATCH, DELETE) : Réservée aux RECEVEUR (sur leur bureau) et ADMIN.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        user_role = getattr(user, "role", None)
        return bool(user.is_staff or user.is_superuser or user_role in ["ADMIN", "RECEVEUR"])

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user
        if user.is_staff or user.is_superuser or getattr(user, "role", None) == "ADMIN":
            return True

        # Pour un Receveur, restreindre au bureau qui lui est affecté
        bureau_code = getattr(user, "bureau_code", None)
        obj_bureau_code = getattr(obj.bureau, "ncodique", None)
        return bureau_code is not None and bureau_code == obj_bureau_code
