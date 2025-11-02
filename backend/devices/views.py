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
from .models import Device, Measurement
from .serializers import DeviceSerializer, MeasurementSerializer


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
            return Response(
                MeasurementSerializer(measurement).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
