"""
Serializers for devices app.

Following Django REST Framework best practices:
- Data validation logic in Serializers
- Clean data representation
"""
from rest_framework import serializers
from .models import Device, Measurement


class DeviceSerializer(serializers.ModelSerializer):
    """
    Serializer for Device model.
    
    Handles data validation and representation for Device resources.
    """
    
    class Meta:
        model = Device
        fields: list[str] = [
            'id',
            'public_id',
            'name',
            'status',
            'description',
            'created_at',
            'updated_at',
        ]
        read_only_fields: list[str] = [
            'id',
            'public_id',
            'created_at',
            'updated_at',
        ]
    
    def validate_name(self, value: str) -> str:
        """Validate device name."""
        if not value or not value.strip():
            raise serializers.ValidationError("Device name cannot be empty.")
        
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Device name must be at least 3 characters long.")
        
        return value.strip()
    
    def validate_status(self, value: str) -> str:
        """Validate device status."""
        valid_statuses = [choice[0] for choice in Device.Status.choices]
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Status must be one of: {', '.join(valid_statuses)}"
            )
        return value


class MeasurementSerializer(serializers.ModelSerializer):
    """
    Serializer for Measurement model.
    
    Handles data validation and representation for Measurement resources.
    Used for ingesting measurement data from devices.
    """
    
    class Meta:
        model = Measurement
        fields: list[str] = [
            'id',
            'device',
            'metric',
            'value',
            'unit',
            'timestamp',
        ]
        read_only_fields: list[str] = ['id']
    
    def validate_metric(self, value: str) -> str:
        """Validate metric name."""
        if not value or not value.strip():
            raise serializers.ValidationError("Metric cannot be empty.")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Metric must be at least 2 characters long.")
        
        return value.strip()
    
    def validate_unit(self, value: str) -> str:
        """Validate unit of measurement."""
        if not value or not value.strip():
            raise serializers.ValidationError("Unit cannot be empty.")
        
        return value.strip()
    
    def validate_value(self, value) -> float:
        """Validate measurement value."""
        if value is None:
            raise serializers.ValidationError("Value cannot be null.")
        
        return value

