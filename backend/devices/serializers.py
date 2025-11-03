"""
Serializers for devices app.

Following Django REST Framework best practices:
- Data validation logic in Serializers
- Clean data representation
"""
from rest_framework import serializers
from django.utils import timezone
from .models import Category, Device, Measurement, Alert


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for Category model.
    
    Handles data validation and representation for Category resources.
    """
    
    class Meta:
        model = Category
        fields: list[str] = [
            'id',
            'name',
            'description',
            'created_at',
            'updated_at',
        ]
        read_only_fields: list[str] = [
            'id',
            'created_at',
            'updated_at',
        ]
    
    def validate_name(self, value: str) -> str:
        """Validate category name."""
        if not value or not value.strip():
            raise serializers.ValidationError("Category name cannot be empty.")
        
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Category name must be at least 3 characters long.")
        
        return value.strip()


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
            'category',
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


class AggregatedDataSerializer(serializers.Serializer):
    """
    Serializer for aggregated measurement data endpoint.
    
    Returns the last 100 measurement points and aggregated statistics
    (mean, max, min) for a device.
    """
    measurements = MeasurementSerializer(many=True)
    statistics = serializers.DictField()
    
    def to_representation(self, instance: dict) -> dict:
        """Custom representation for aggregated data."""
        return {
            'measurements': instance['measurements'],
            'statistics': instance['statistics'],
            'count': instance['count']
        }


class AlertSerializer(serializers.ModelSerializer):
    """
    Serializer for Alert model.
    
    Handles data validation and representation for Alert resources.
    """
    
    class Meta:
        model = Alert
        fields: list[str] = [
            'id',
            'device',
            'title',
            'message',
            'severity',
            'status',
            'created_at',
            'updated_at',
            'resolved_at',
        ]
        read_only_fields: list[str] = [
            'id',
            'created_at',
            'updated_at',
            'resolved_at',
        ]
    
    def validate_title(self, value: str) -> str:
        """Validate alert title."""
        if not value or not value.strip():
            raise serializers.ValidationError("Alert title cannot be empty.")
        
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Alert title must be at least 3 characters long.")
        
        return value.strip()
    
    def validate_message(self, value: str) -> str:
        """Validate alert message."""
        if not value or not value.strip():
            raise serializers.ValidationError("Alert message cannot be empty.")
        
        return value.strip()
    
    def validate_severity(self, value: str) -> str:
        """Validate alert severity."""
        valid_severities = [choice[0] for choice in Alert.Severity.choices]
        if value not in valid_severities:
            raise serializers.ValidationError(
                f"Severity must be one of: {', '.join(valid_severities)}"
            )
        return value
    
    def validate_status(self, value: str) -> str:
        """Validate alert status."""
        valid_statuses = [choice[0] for choice in Alert.Status.choices]
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Status must be one of: {', '.join(valid_statuses)}"
            )
        return value
    
    def update(self, instance: Alert, validated_data: dict) -> Alert:
        """Override update to handle resolved_at timestamp."""
        status = validated_data.get('status', instance.status)
        
        # Se está mudando para resolved e não tem resolved_at, definir agora
        if status == Alert.Status.RESOLVED and instance.status != Alert.Status.RESOLVED:
            if not instance.resolved_at:
                validated_data['resolved_at'] = timezone.now()
        
        # Se está mudando de resolved para pending, limpar resolved_at
        if status == Alert.Status.PENDING and instance.status == Alert.Status.RESOLVED:
            validated_data['resolved_at'] = None
        
        return super().update(instance, validated_data)
