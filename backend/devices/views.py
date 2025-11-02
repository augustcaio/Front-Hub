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
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

from .models import Device, Measurement
from .serializers import DeviceSerializer, MeasurementSerializer

logger = logging.getLogger(__name__)


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
