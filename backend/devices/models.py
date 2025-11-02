"""
Device model definition.

Following Django & Python best practices with type hinting,
UUIDField for public_id, and clean model structure.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid


class Device(models.Model):
    """
    Device model representing IoT devices or sensors.
    
    Fields:
        - id: Auto-generated primary key (BigAutoField)
        - public_id: UUID for public-facing identification (UUIDField)
        - name: Device name (CharField)
        - status: Device status (CharField with choices)
        - description: Optional device description (TextField)
        - created_at: Creation timestamp (DateTimeField)
        - updated_at: Last update timestamp (DateTimeField)
    """
    
    class Status(models.TextChoices):
        """Device status choices."""
        ACTIVE = 'active', _('Active')
        INACTIVE = 'inactive', _('Inactive')
        MAINTENANCE = 'maintenance', _('Maintenance')
        ERROR = 'error', _('Error')
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Public identifier (UUIDField for non-sequential unique IDs)
    public_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        db_index=True,
        help_text=_('Public unique identifier for the device')
    )
    
    # Device information
    name = models.CharField(
        max_length=255,
        help_text=_('Device name')
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.INACTIVE,
        db_index=True,
        help_text=_('Current device status')
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        help_text=_('Optional device description')
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text=_('Device creation timestamp')
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        db_index=True,
        help_text=_('Last update timestamp')
    )
    
    class Meta:
        db_table: str = 'devices'
        verbose_name: str = _('Device')
        verbose_name_plural: str = _('Devices')
        ordering: list[str] = ['-created_at']
        indexes: list[models.Index] = [
            models.Index(fields=['public_id'], name='device_public_id_idx'),
            models.Index(fields=['status'], name='device_status_idx'),
            models.Index(fields=['created_at'], name='device_created_at_idx'),
        ]
    
    def __str__(self) -> str:
        """Return string representation of Device."""
        return f"{self.name} ({self.public_id})"
    
    def __repr__(self) -> str:
        """Return developer-friendly representation."""
        return f"<Device: {self.name} (status={self.status}, public_id={self.public_id})>"


class Measurement(models.Model):
    """
    Measurement model representing precision data from devices.
    
    Fields:
        - id: Auto-generated primary key (BigAutoField)
        - device: Foreign key to Device model
        - metric: Type of measurement/metric (CharField)
        - value: Measurement value (DecimalField for precision)
        - unit: Unit of measurement (CharField)
        - timestamp: When the measurement was taken (DateTimeField)
    """
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Device relationship (ForeignKey with CASCADE on delete)
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='measurements',
        db_index=True,
        help_text=_('Device that generated this measurement')
    )
    
    # Measurement data
    metric = models.CharField(
        max_length=100,
        db_index=True,
        help_text=_('Type of measurement/metric (e.g., temperature, humidity, pressure)')
    )
    
    value = models.DecimalField(
        max_digits=20,
        decimal_places=10,
        help_text=_('Measurement value with precision')
    )
    
    unit = models.CharField(
        max_length=50,
        help_text=_('Unit of measurement (e.g., °C, %, hPa, m/s)')
    )
    
    # Timestamp
    timestamp = models.DateTimeField(
        db_index=True,
        help_text=_('When the measurement was taken')
    )
    
    class Meta:
        db_table: str = 'measurements'
        verbose_name: str = _('Measurement')
        verbose_name_plural: str = _('Measurements')
        ordering: list[str] = ['-timestamp']
        indexes: list[models.Index] = [
            models.Index(fields=['device', 'timestamp'], name='meas_device_timestamp_idx'),
            models.Index(fields=['metric'], name='meas_metric_idx'),
            models.Index(fields=['timestamp'], name='meas_timestamp_idx'),
            models.Index(fields=['device', 'metric'], name='meas_device_metric_idx'),
        ]
    
    def __str__(self) -> str:
        """Return string representation of Measurement."""
        return f"{self.metric}={self.value} {self.unit} @ {self.device.name} ({self.timestamp})"
    
    def __repr__(self) -> str:
        """Return developer-friendly representation."""
        return f"<Measurement: {self.metric}={self.value}{self.unit} (device_id={self.device_id}, timestamp={self.timestamp})>"

