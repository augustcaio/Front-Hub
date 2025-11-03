from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUserRole(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, 'role', None) == 'admin')


class IsOperatorOrAdminCanWriteElseReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        if request.method in SAFE_METHODS:
            return bool(user and user.is_authenticated)
        # Métodos de escrita: apenas admin ou operator
        return bool(user and user.is_authenticated and getattr(user, 'role', None) in ('admin', 'operator'))


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, 'role', None) == 'admin')


