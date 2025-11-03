"""
Views for devices app.

Following Django REST Framework best practices with thin views.
Business logic should be in services/ or managers/.
"""
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Max, Min, DecimalField
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

from .models import Category, Device, Measurement, Alert
from .serializers import CategorySerializer, DeviceSerializer, MeasurementSerializer, AlertSerializer

logger = logging.getLogger(__name__)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Category model.
    
    Provides full CRUD operations (Create, Read, Update, Delete).
    Uses JWT authentication (configured globally in settings).
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes: list = [IsAuthenticated]
    
    def get_queryset(self):
        """Return queryset ordered by name (as defined in model Meta)."""
        # Model Meta already defines ordering by 'name', but we make it explicit here
        return Category.objects.all()


class DeviceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Device model.
    
    Provides list and retrieve actions (as per task 1.7 requirements).
    Uses JWT authentication (configured globally in settings).
    """
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes: list = [IsAuthenticated]
    http_method_names: list[str] = ['get']  # Only allow GET (list and retrieve)
    
    def get_queryset(self):
        """Optimize queryset with select_related/prefetch_related if needed."""
        queryset = Device.objects.all()
        
        # Order by created_at (newest first) as defined in model Meta
        queryset = queryset.order_by('-created_at')
        
        return queryset


class MeasurementIngestionView(APIView):
    """
    APIView for ingesting measurement data from devices.
    
    Endpoint: POST /api/devices/{device_id}/measurements/
    Creates a new measurement for a specific device.
    """
    permission_classes: list = [IsAuthenticated]
    
    def post(self, request, device_id: int) -> Response:
        """
        Create a new measurement for the specified device.
        
        Args:
            request: HTTP request object
            device_id: ID of the device to associate the measurement with
        
        Returns:
            Response: 201 Created with measurement data, or 400/404 with errors
        """
        # Get device or return 404
        device = get_object_or_404(Device, id=device_id)
        
        # Prepare data with device_id
        data = request.data.copy()
        data['device'] = device.id
        
        # Validate and create measurement
        serializer = MeasurementSerializer(data=data)
        
        if serializer.is_valid():
            measurement = serializer.save()
            measurement_data = MeasurementSerializer(measurement).data
            
            # Send real-time update via WebSocket
            self._send_measurement_update(device.public_id, measurement_data)
            
            return Response(
                measurement_data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _send_measurement_update(self, device_public_id, measurement_data):
        """
        Send measurement update to connected WebSocket clients via Channel Layer.
        
        Args:
            device_public_id: UUID of the device (public_id)
            measurement_data: Serialized measurement data dictionary
        """
        try:
            channel_layer = get_channel_layer()
            if channel_layer is None:
                logger.warning("Channel layer is not configured. WebSocket update skipped.")
                return
            
            # Group name for device broadcasting
            group_name = f'device_{device_public_id}'
            
            # Send message to device group
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'measurement_update',
                    'measurement': measurement_data
                }
            )
            
            logger.info(f"Sent measurement update via WebSocket for device {device_public_id}")
            
        except Exception as e:
            # Log error but don't fail the HTTP request
            logger.error(
                f"Failed to send WebSocket update for device {device_public_id}: {str(e)}",
                exc_info=True
            )


class AlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Alert model.
    
    Provides full CRUD operations (Create, Read, Update, Delete).
    Uses JWT authentication (configured globally in settings).
    """
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    permission_classes: list = [IsAuthenticated]
    
    def get_queryset(self):
        """Optimize queryset with select_related."""
        queryset = Alert.objects.select_related('device').all()
        
        # Filtrar por device_id se fornecido como query parameter
        device_id = self.request.query_params.get('device_id', None)
        if device_id is not None:
            try:
                queryset = queryset.filter(device_id=int(device_id))
            except (ValueError, TypeError):
                pass
        
        # Filtrar por status se fornecido como query parameter
        status = self.request.query_params.get('status', None)
        if status is not None:
            valid_statuses = [choice[0] for choice in Alert.Status.choices]
            if status in valid_statuses:
                queryset = queryset.filter(status=status)
        
        # Filtrar apenas alertas não resolvidos (para uso comum)
        unresolved_only = self.request.query_params.get('unresolved_only', None)
        if unresolved_only is not None and unresolved_only.lower() == 'true':
            queryset = queryset.filter(status=Alert.Status.PENDING)
        
        # Order by created_at (newest first) as defined in model Meta
        queryset = queryset.order_by('-created_at')
        
        return queryset


class DeviceAggregatedDataView(APIView):
    """
    APIView for retrieving aggregated measurement data for a device.
    
    Endpoint: GET /api/devices/{device_id}/aggregated-data/
    Returns the last 100 measurement points and aggregated statistics
    (mean, max, min) for a specific device.
    """
    permission_classes: list = [IsAuthenticated]
    
    def get(self, request, device_id: int) -> Response:
        """
        Retrieve aggregated measurement data for the specified device.
        
        Args:
            request: HTTP request object
            device_id: ID of the device
        
        Returns:
            Response: 200 OK with aggregated data, or 404 if device not found
        """
        # Get device or return 404
        device = get_object_or_404(Device, id=device_id)
        
        # Get last 100 measurements for this device, ordered by timestamp (newest first)
        measurements_qs = Measurement.objects.filter(
            device=device
        ).order_by('-timestamp')[:100]
        
        # Calculate aggregated statistics first (before evaluating the QuerySet)
        aggregates = measurements_qs.aggregate(
            avg_value=Avg('value', output_field=DecimalField()),
            max_value=Max('value'),
            min_value=Min('value')
        )
        
        # Prepare statistics dictionary
        if aggregates['avg_value'] is not None:
            statistics = {
                'mean': float(aggregates['avg_value']),
                'max': float(aggregates['max_value']) if aggregates['max_value'] is not None else None,
                'min': float(aggregates['min_value']) if aggregates['min_value'] is not None else None,
            }
        else:
            # No measurements found
            statistics = {
                'mean': None,
                'max': None,
                'min': None,
            }
        
        # Serialize measurements
        measurement_data = MeasurementSerializer(measurements_qs, many=True).data
        
        # Prepare response data
        response_data = {
            'measurements': measurement_data,
            'statistics': statistics,
            'count': len(measurement_data)
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
