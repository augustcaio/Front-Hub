from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.contrib.auth import get_user_model

User = get_user_model()


class IsAdminUserRole(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            # leitura permitida a qualquer autenticado
            return True
        # escrita apenas admin
        return getattr(user, 'role', None) == getattr(User, 'Role').ADMIN


class IsOperatorOrAdminCanWriteElseReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            # leitura para autenticados
            return True
        # escrita para operador ou admin
        return getattr(user, 'role', None) in {getattr(User, 'Role').OPERATOR, getattr(User, 'Role').ADMIN}


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False if request.method in SAFE_METHODS else False
        if request.method in SAFE_METHODS:
            return True
        return getattr(user, 'role', None) == getattr(User, 'Role').ADMIN


