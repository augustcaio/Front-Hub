"""
Views for accounts app.

Following Django REST Framework best practices with thin views.
Business logic should be in services/ or managers/.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.serializers import UserRegistrationSerializer, UserSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request) -> Response:
    """
    Register a new user and return JWT tokens.
    
    Endpoint: POST /api/register/
    
    Request body:
    {
        "username": "string",
        "email": "string",
        "first_name": "string",
        "last_name": "string",
        "password": "string"
    }
    
    Returns:
        Response with user data, access_token, and refresh_token
        {
            "user": {
                "id": int,
                "username": "string",
                "email": "string",
                "first_name": "string",
                "last_name": "string"
            },
            "access": "string",
            "refresh": "string"
        }
        or validation errors
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate JWT tokens for the newly created user
        refresh = RefreshToken.for_user(user)
        
        # Return user data with JWT tokens
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request) -> Response:
    """
    Get current authenticated user information.
    
    Endpoint: GET /api/me/
    
    Returns:
        Response with current user data
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)
