from rest_framework import permissions


class IsSaisieAllowed(permissions.BasePermission):
    """
    Permission pour les mouvements du Journal G58 :
    - GET (lecture) : Accessible à tout utilisateur authentifié.
    - POST, PUT, PATCH, DELETE (saisie & modification) :
        * Réservé aux rôles AGENT_SAISIE, RECEVEUR et ADMIN.
        * Un RECEVEUR ou AGENT_SAISIE ne peut saisir/modifier que sur le bureau auquel il est rattaché.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        user_role = getattr(user, "role", None)
        return bool(user.is_staff or user.is_superuser or user_role in ["ADMIN", "RECEVEUR", "AGENT_SAISIE"])

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user
        if user.is_staff or user.is_superuser or getattr(user, "role", None) == "ADMIN":
            return True

        # Contrôle du bureau pour RECEVEUR et AGENT_SAISIE
        bureau_code = getattr(user, "bureau_code", None)
        obj_bureau_code = getattr(obj.periode_gestion.bureau, "ncodique", None)
        return bureau_code is not None and bureau_code == obj_bureau_code
