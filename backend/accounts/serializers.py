"""
Custom serializers for accounts app.

Following Django REST Framework best practices.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User
from django.contrib.auth.password_validation import validate_password


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user data (read-only).
    
    Used to return user information without exposing sensitive data.
    """
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined')
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
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password')
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
        
        # Add custom claims here if needed
        # token['custom_claim'] = user.some_field
        
        return token
    
    def validate(self, attrs):
        """
        Validate user credentials and return token.
        
        Args:
            attrs: Dictionary with username and password
            
        Returns:
            Dictionary with access and refresh tokens
        """
        data = super().validate(attrs)
        
        # Add custom response data here if needed
        # data['user'] = {
        #     'id': self.user.id,
        #     'username': self.user.username,
        #     'email': self.user.email
        # }
        
        return data

