"""
Tests for accounts app.

Following Django & Python best practices.
Test coverage for User model and CustomTokenObtainPairSerializer.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import CustomTokenObtainPairSerializer

User = get_user_model()


class UserModelTestCase(TestCase):
    """Test cases for User model."""

    def setUp(self):
        """Set up test data."""
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
        }

    def test_create_user(self):
        """Test creating a basic user."""
        user = User.objects.create_user(**self.user_data)
        
        self.assertIsNotNone(user.id)
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.first_name, 'Test')
        self.assertEqual(user.last_name, 'User')
        self.assertTrue(user.check_password('testpass123'))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser(self):
        """Test creating a superuser."""
        superuser = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )
        
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)
        self.assertTrue(superuser.is_active)

    def test_user_str_representation(self):
        """Test User __str__ method."""
        user = User.objects.create_user(**self.user_data)
        expected_str = f"{user.get_full_name()} ({user.email})"
        self.assertEqual(str(user), expected_str)

    def test_user_str_without_names(self):
        """Test User __str__ method when names are not provided."""
        user = User.objects.create_user(
            username='minimaluser',
            email='minimal@example.com',
            password='pass123'
        )
        expected_str = f"{user.username} ({user.email})"
        self.assertEqual(str(user), expected_str)

    def test_get_full_name(self):
        """Test get_full_name method."""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.get_full_name(), 'Test User')

    def test_get_full_name_without_names(self):
        """Test get_full_name when names are empty."""
        user = User.objects.create_user(
            username='nouser',
            email='no@example.com',
            password='pass123'
        )
        self.assertEqual(user.get_full_name(), user.username)

    def test_get_short_name(self):
        """Test get_short_name method."""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.get_short_name(), 'Test')

    def test_get_short_name_without_first_name(self):
        """Test get_short_name when first_name is empty."""
        user = User.objects.create_user(
            username='shortuser',
            email='short@example.com',
            password='pass123'
        )
        self.assertEqual(user.get_short_name(), user.username)

    def test_user_email_unique(self):
        """Test that email must be unique."""
        User.objects.create_user(**self.user_data)
        
        with self.assertRaises(Exception):
            User.objects.create_user(
                username='anotheruser',
                email='test@example.com',
                password='pass123'
            )

    def test_user_email_required(self):
        """Test that email is required."""
        with self.assertRaises(Exception):
            User.objects.create_user(
                username='noemail',
                password='pass123'
            )

    def test_user_ordering(self):
        """Test that users are ordered by -date_joined."""
        user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='pass123'
        )
        user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='pass123'
        )
        
        users = list(User.objects.all())
        # Mais recente primeiro
        self.assertEqual(users[0], user2)
        self.assertEqual(users[1], user1)


class CustomTokenObtainPairSerializerTestCase(APITestCase):
    """Test cases for CustomTokenObtainPairSerializer."""

    def setUp(self):
        """Set up test data."""
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
        }
        self.user = User.objects.create_user(**self.user_data)

    def test_get_token(self):
        """Test get_token method returns RefreshToken."""
        token = CustomTokenObtainPairSerializer.get_token(self.user)
        
        self.assertIsNotNone(token)
        self.assertIsInstance(token, RefreshToken)
        self.assertEqual(token['user_id'], self.user.id)

    def test_validate_with_correct_credentials(self):
        """Test validate method with correct credentials."""
        serializer = CustomTokenObtainPairSerializer(data={
            'username': 'testuser',
            'password': 'testpass123',
        })
        
        self.assertTrue(serializer.is_valid())
        data = serializer.validated_data
        
        self.assertIn('access', data)
        self.assertIn('refresh', data)
        self.assertIsNotNone(data['access'])
        self.assertIsNotNone(data['refresh'])

    def test_validate_with_incorrect_username(self):
        """Test validate method with incorrect username."""
        serializer = CustomTokenObtainPairSerializer(data={
            'username': 'wronguser',
            'password': 'testpass123',
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)

    def test_validate_with_incorrect_password(self):
        """Test validate method with incorrect password."""
        serializer = CustomTokenObtainPairSerializer(data={
            'username': 'testuser',
            'password': 'wrongpass',
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)

    def test_validate_with_inactive_user(self):
        """Test validate method with inactive user."""
        self.user.is_active = False
        self.user.save()
        
        serializer = CustomTokenObtainPairSerializer(data={
            'username': 'testuser',
            'password': 'testpass123',
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)

    def test_token_contains_user_id(self):
        """Test that token contains user_id claim."""
        serializer = CustomTokenObtainPairSerializer(data={
            'username': 'testuser',
            'password': 'testpass123',
        })
        
        self.assertTrue(serializer.is_valid())
        
        # Decode token to verify claims
        from rest_framework_simplejwt.tokens import AccessToken
        access_token = serializer.validated_data['access']
        token = AccessToken(access_token)
        
        self.assertEqual(token['user_id'], self.user.id)
