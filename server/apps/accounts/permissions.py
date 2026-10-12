from rest_framework.permissions import BasePermission


class HasRole(BasePermission):
    required_roles = ()

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or getattr(user, "role", None) in self.required_roles)
        )


class IsAdmin(HasRole):
    required_roles = ("ADMIN",)


class IsReceveur(HasRole):
    required_roles = ("RECEVEUR",)


class IsAgentSaisie(HasRole):
    required_roles = ("AGENT_SAISIE",)


class IsInspecteur(HasRole):
    required_roles = ("INSPECTEUR",)


class IsSameBureau(HasRole):
    required_roles = ("RECEVEUR", "AGENT_SAISIE")

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or request.user.role == "ADMIN":
            return True
        obj_bureau = getattr(obj, "bureau_code", None)
        return obj_bureau is not None and obj_bureau == getattr(request.user, "bureau_code", None)
