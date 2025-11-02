"""
User model definition.

Following Django & Python best practices with type hinting
and clean model structure.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


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
