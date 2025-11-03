"""
Custom serializers for accounts app.

Following Django REST Framework best practices.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt import exceptions as jwt_exceptions
from rest_framework.exceptions import AuthenticationFailed as DRFAuthenticationFailed
from accounts.models import User
from django.contrib.auth.password_validation import validate_password


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user data (read-only).
    
    Used to return user information without exposing sensitive data.
    """
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'role')
        read_only_fields = fields


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    
    Handles user creation with proper password validation.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password', 'role')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }
    
    def create(self, validated_data):
        """
        Create and return a new user instance.
        
        Args:
            validated_data: Validated user data
            
        Returns:
            User instance
        """
        password = validated_data.pop('password')
        # Garantir default para role se não vier no payload
        if 'role' not in validated_data or not validated_data['role']:
            validated_data['role'] = User.Role.OPERATOR
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom serializer for JWT token obtain that uses the custom User model.
    
    This ensures proper authentication with the accounts.User model.
    """
    
    @classmethod
    def get_token(cls, user: User) -> RefreshToken:
        """
        Get token for the user.
        
        Args:
            user: User instance
            
        Returns:
            RefreshToken instance
        """
        token = super().get_token(user)
        # Custom claims
        token['role'] = user.role
        # Garantir user_id numérico conforme esperado nos testes
        token['user_id'] = user.id
        return token
    
    def validate(self, attrs):
        """
        Validate user credentials and return token.
        
        Args:
            attrs: Dictionary with username and password
            
        Returns:
            Dictionary with access and refresh tokens
        """
        try:
            data = super().validate(attrs)
        except (jwt_exceptions.AuthenticationFailed, DRFAuthenticationFailed):
            # Converter para ValidationError em non_field_errors para que is_valid() retorne False
            raise serializers.ValidationError({'non_field_errors': ['Usuário e/ou senha incorreto(s)']})
        
        # Opcional: retornar role no corpo da resposta também
        data['role'] = self.user.role
        
        return data

