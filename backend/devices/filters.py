"""
FilterSets for devices app using django-filters.

Following Django Filter best practices with explicit filter definitions
and proper field types.
"""
import django_filters
from django.db import models

from .models import Device, Measurement, Alert


class DeviceFilter(django_filters.FilterSet):
    """
    FilterSet for Device model.
    
    Supports filtering by:
    - status: Exact match on device status (active, inactive, maintenance, error)
    - category: Filter by category ID
    - name: Case-insensitive partial match on device name
    - search: Search across name and description fields (handled by SearchFilter)
    """
    
    # Exact match filters
    status = django_filters.ChoiceFilter(
        choices=Device.Status.choices,
        help_text='Filter by device status (active, inactive, maintenance, error)'
    )
    
    category = django_filters.NumberFilter(
        field_name='category',
        help_text='Filter by category ID'
    )
    
    # Case-insensitive partial match on name
    name = django_filters.CharFilter(
        field_name='name',
        lookup_expr='icontains',
        help_text='Filter by device name (case-insensitive partial match)'
    )
    
    # Date range filters
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
        help_text='Filter devices created after this date (ISO 8601 format)'
    )
    
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
        help_text='Filter devices created before this date (ISO 8601 format)'
    )
    
    class Meta:
        model = Device
        fields = ['status', 'category', 'name']


class MeasurementFilter(django_filters.FilterSet):
    """
    FilterSet for Measurement model.
    
    Supports filtering by:
    - device: Filter by device ID
    - metric: Exact match on metric name
    - device__status: Filter by device status
    - timestamp_after: Filter measurements after a timestamp
    - timestamp_before: Filter measurements before a timestamp
    """
    
    device = django_filters.NumberFilter(
        field_name='device__id',
        help_text='Filter by device ID'
    )
    
    metric = django_filters.CharFilter(
        field_name='metric',
        lookup_expr='iexact',
        help_text='Filter by metric name (case-insensitive exact match)'
    )
    
    device_status = django_filters.ChoiceFilter(
        field_name='device__status',
        choices=Device.Status.choices,
        help_text='Filter by device status (active, inactive, maintenance, error)'
    )
    
    timestamp_after = django_filters.DateTimeFilter(
        field_name='timestamp',
        lookup_expr='gte',
        help_text='Filter measurements after this timestamp (ISO 8601 format)'
    )
    
    timestamp_before = django_filters.DateTimeFilter(
        field_name='timestamp',
        lookup_expr='lte',
        help_text='Filter measurements before this timestamp (ISO 8601 format)'
    )
    
    class Meta:
        model = Measurement
        fields = ['device', 'metric', 'device_status']


class AlertFilter(django_filters.FilterSet):
    """
    FilterSet for Alert model.
    
    Supports filtering by:
    - device: Filter by device ID
    - status: Filter by alert status (pending, resolved)
    - severity: Filter by alert severity (low, medium, high, critical)
    - device_status: Filter by device status
    """
    
    device = django_filters.NumberFilter(
        field_name='device__id',
        help_text='Filter by device ID'
    )
    
    status = django_filters.ChoiceFilter(
        choices=Alert.Status.choices,
        help_text='Filter by alert status (pending, resolved)'
    )
    
    severity = django_filters.ChoiceFilter(
        choices=Alert.Severity.choices,
        help_text='Filter by alert severity (low, medium, high, critical)'
    )
    
    device_status = django_filters.ChoiceFilter(
        field_name='device__status',
        choices=Device.Status.choices,
        help_text='Filter by device status (active, inactive, maintenance, error)'
    )
    
    unresolved_only = django_filters.BooleanFilter(
        field_name='status',
        method='filter_unresolved',
        help_text='Filter only unresolved alerts (true/false)'
    )
    
    class Meta:
        model = Alert
        fields = ['device', 'status', 'severity', 'device_status']
    
    def filter_unresolved(self, queryset, name, value):
        """
        Custom filter method for unresolved_only.
        
        Filters alerts by pending status when value is True.
        """
        if value is True:
            return queryset.filter(status=Alert.Status.PENDING)
        return queryset

