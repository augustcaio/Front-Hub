from django.apps import AppConfig
from typing import Final


class AccountsConfig(AppConfig):
    default_auto_field: Final[str] = 'django.db.models.BigAutoField'
    name: Final[str] = 'accounts'
    verbose_name: Final[str] = 'Accounts'
