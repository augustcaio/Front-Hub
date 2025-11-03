"""
Device model definition.

Following Django & Python best practices with type hinting,
UUIDField for public_id, and clean model structure.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid


class Category(models.Model):
    """
    Category model representing device categories.
    
    Fields:
        - id: Auto-generated primary key (BigAutoField)
        - name: Category name (CharField)
        - description: Optional category description (TextField)
        - created_at: Creation timestamp (DateTimeField)
        - updated_at: Last update timestamp (DateTimeField)
    """
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Category information
    name = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text=_('Category name')
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        help_text=_('Optional category description')
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text=_('Category creation timestamp')
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        db_index=True,
        help_text=_('Last update timestamp')
    )
    
    class Meta:
        db_table: str = 'categories'
        verbose_name: str = _('Category')
        verbose_name_plural: str = _('Categories')
        ordering: list[str] = ['name']
        indexes: list[models.Index] = [
            models.Index(fields=['name'], name='category_name_idx'),
            models.Index(fields=['created_at'], name='category_created_at_idx'),
        ]
    
    def __str__(self) -> str:
        """Return string representation of Category."""
        return self.name
    
    def __repr__(self) -> str:
        """Return developer-friendly representation."""
        return f"<Category: {self.name} (id={self.id})>"


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
    
    # Category relationship (ForeignKey with PROTECT on delete to prevent accidental category deletion)
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='devices',
        db_index=True,
        null=True,
        blank=True,
        help_text=_('Category this device belongs to')
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
            models.Index(fields=['category'], name='device_category_idx'),
            models.Index(fields=['category', 'status'], name='device_category_status_idx'),
        ]
    
    def __str__(self) -> str:
        """Return string representation of Device."""
        return f"{self.name} ({self.public_id})"
    
    def __repr__(self) -> str:
        """Return developer-friendly representation."""
        return f"<Device: {self.name} (status={self.status}, public_id={self.public_id}, category_id={self.category_id})>"


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


class Alert(models.Model):
    """
    Alert model representing alerts/notifications for devices.
    
    Fields:
        - id: Auto-generated primary key (BigAutoField)
        - device: Foreign key to Device model
        - title: Alert title (CharField)
        - message: Alert message/description (TextField)
        - severity: Alert severity level (CharField with choices)
        - status: Alert status - resolved or not (CharField with choices)
        - created_at: Creation timestamp (DateTimeField)
        - updated_at: Last update timestamp (DateTimeField)
        - resolved_at: Resolution timestamp (DateTimeField, nullable)
    """
    
    class Severity(models.TextChoices):
        """Alert severity choices."""
        LOW = 'low', _('Low')
        MEDIUM = 'medium', _('Medium')
        HIGH = 'high', _('High')
        CRITICAL = 'critical', _('Critical')
    
    class Status(models.TextChoices):
        """Alert status choices."""
        PENDING = 'pending', _('Pending')
        RESOLVED = 'resolved', _('Resolved')
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Device relationship (ForeignKey with CASCADE on delete)
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='alerts',
        db_index=True,
        help_text=_('Device associated with this alert')
    )
    
    # Alert information
    title = models.CharField(
        max_length=255,
        help_text=_('Alert title')
    )
    
    message = models.TextField(
        help_text=_('Alert message/description')
    )
    
    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.MEDIUM,
        db_index=True,
        help_text=_('Alert severity level')
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
        help_text=_('Alert status (pending or resolved)')
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text=_('Alert creation timestamp')
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        db_index=True,
        help_text=_('Last update timestamp')
    )
    
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text=_('Alert resolution timestamp')
    )
    
    class Meta:
        db_table: str = 'alerts'
        verbose_name: str = _('Alert')
        verbose_name_plural: str = _('Alerts')
        ordering: list[str] = ['-created_at']
        indexes: list[models.Index] = [
            models.Index(fields=['device', 'status'], name='alert_device_status_idx'),
            models.Index(fields=['status'], name='alert_status_idx'),
            models.Index(fields=['severity'], name='alert_severity_idx'),
            models.Index(fields=['device', 'created_at'], name='alert_device_created_idx'),
            models.Index(fields=['created_at'], name='alert_created_at_idx'),
        ]
    
    def __str__(self) -> str:
        """Return string representation of Alert."""
        return f"{self.title} - {self.device.name} ({self.status})"
    
    def __repr__(self) -> str:
        """Return developer-friendly representation."""
        return f"<Alert: {self.title} (device_id={self.device_id}, status={self.status}, severity={self.severity})>"


class MeasurementThreshold(models.Model):
    """
    MeasurementThreshold model representing min/max limits for a device metric.
    
    Fields:
        - id: Auto-generated primary key (BigAutoField)
        - device: Foreign key to Device model
        - metric_name: Name of the metric this threshold applies to (CharField)
        - min_limit: Minimum allowed value (DecimalField)
        - max_limit: Maximum allowed value (DecimalField)
        - is_active: Whether threshold is active (BooleanField)
        - created_at: Creation timestamp (DateTimeField)
        - updated_at: Last update timestamp (DateTimeField)
    """
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Device relationship
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='thresholds',
        db_index=True,
        help_text=_('Device this threshold belongs to')
    )
    
    # Metric identification
    metric_name = models.CharField(
        max_length=100,
        db_index=True,
        help_text=_('Metric name this threshold applies to (e.g., temperature)')
    )
    
    # Limits
    min_limit = models.DecimalField(
        max_digits=20,
        decimal_places=10,
        help_text=_('Minimum allowed value for the metric')
    )
    
    max_limit = models.DecimalField(
        max_digits=20,
        decimal_places=10,
        help_text=_('Maximum allowed value for the metric')
    )
    
    # Active flag
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text=_('Whether this threshold is active')
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text=_('Threshold creation timestamp')
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        db_index=True,
        help_text=_('Last update timestamp')
    )
    
    class Meta:
        db_table: str = 'measurement_thresholds'
        verbose_name: str = _('Measurement Threshold')
        verbose_name_plural: str = _('Measurement Thresholds')
        ordering: list[str] = ['metric_name']
        indexes: list[models.Index] = [
            models.Index(fields=['device', 'metric_name'], name='thresh_device_metric_idx'),
            models.Index(fields=['is_active'], name='thresh_is_active_idx'),
            models.Index(fields=['created_at'], name='thresh_created_at_idx'),
        ]
        constraints = [
            # Ensure only one ACTIVE threshold per device/metric pair
            models.UniqueConstraint(
                fields=['device', 'metric_name'],
                condition=models.Q(('is_active', True)),
                name='unique_active_threshold_per_device_metric',
            )
        ]
    
    def __str__(self) -> str:
        """Return string representation of MeasurementThreshold."""
        return f"{self.metric_name} min={self.min_limit} max={self.max_limit} @ {self.device.name}"
    
    def __repr__(self) -> str:
        """Return developer-friendly representation."""
        return (
            f"<MeasurementThreshold: metric={self.metric_name} min={self.min_limit} "
            f"max={self.max_limit} active={self.is_active} device_id={self.device_id}>"
        )