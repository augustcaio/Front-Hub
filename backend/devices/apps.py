from django.apps import AppConfig
from typing import Final


class DevicesConfig(AppConfig):
    default_auto_field: Final[str] = 'django.db.models.BigAutoField'
    name: Final[str] = 'devices'
    verbose_name: Final[str] = 'Devices'

