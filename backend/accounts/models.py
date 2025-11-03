"""
User model definition.

Following Django & Python best practices with type hinting
and clean model structure.
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _
class UserManager(BaseUserManager):
    """Custom manager to enforce email requirement."""

    use_in_migrations = True

    def create_user(self, username: str, email: str, password: str | None = None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, username: str, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(username, email, password, **extra_fields)



class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    
    Fields:
        - id: Auto-generated primary key (BigAutoField)
        - username: Inherited from AbstractUser
        - email: Inherited from AbstractUser (unique)
        - password: Inherited from AbstractUser (hashed)
        - first_name: Inherited from AbstractUser
        - last_name: Inherited from AbstractUser
        - date_joined: Inherited from AbstractUser
        - is_active: Inherited from AbstractUser
        - is_staff: Inherited from AbstractUser
        - is_superuser: Inherited from AbstractUser
    
    Additional customizations can be added here following SRP.
    """
    class Role(models.TextChoices):
        ADMIN = 'admin', _('Admin')
        OPERATOR = 'operator', _('Operator')
        VISITOR = 'visitor', _('Visitor')

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.OPERATOR,
        db_index=True,
        help_text=_('User role for permission checks (admin, operator, visitor).')
    )

    email = models.EmailField(
        _('email address'),
        unique=True,
        help_text=_('Required. Enter a valid email address.')
    )
    
    first_name = models.CharField(
        _('first name'),
        max_length=150,
        help_text=_('User first name.')
    )
    
    last_name = models.CharField(
        _('last name'),
        max_length=150,
        help_text=_('User last name.')
    )
    
    # Attach custom manager
    objects = UserManager()
    
    class Meta:
        db_table = 'users'
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email'], name='user_email_idx'),
            models.Index(fields=['username'], name='user_username_idx'),
        ]
    
    def __str__(self) -> str:
        """Return string representation of User."""
        return f"{self.get_full_name() or self.username} ({self.email})"
    
    def get_full_name(self) -> str:
        """Return the full name of the user."""
        full_name: str = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.username
    
    def get_short_name(self) -> str:
        """Return the short name of the user."""
        return self.first_name if self.first_name else self.username
