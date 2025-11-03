from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUserRole(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        # Fase pausada: considerar apenas autenticação, ignorar role
        return bool(user and user.is_authenticated)


class IsOperatorOrAdminCanWriteElseReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        if request.method in SAFE_METHODS:
            return bool(user and user.is_authenticated)
        # Fase pausada: permitir escrita para qualquer usuário autenticado
        return bool(user and user.is_authenticated)


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        # Fase pausada: permitir métodos de escrita a usuários autenticados
        return bool(user and user.is_authenticated)


