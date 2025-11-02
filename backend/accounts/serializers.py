"""
Custom serializers for accounts app.

Following Django REST Framework best practices.
"""
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User


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

