"""
Views for devices app.

Following Django REST Framework best practices with thin views.
Business logic should be in services/ or managers/.
"""
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdminUserRole, IsOperatorOrAdminCanWriteElseReadOnly, IsAdminOrReadOnly
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Max, Min, DecimalField
from django.utils import timezone
from datetime import timedelta
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

from .models import Category, Device, Measurement, Alert, MeasurementThreshold
from .serializers import CategorySerializer, DeviceSerializer, MeasurementSerializer, AlertSerializer, ThresholdSerializer
from .filters import DeviceFilter, AlertFilter
from rest_framework.filters import SearchFilter, OrderingFilter
from .services.alert_service import check_for_alert

logger = logging.getLogger(__name__)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Category model.
    
    Provides full CRUD operations (Create, Read, Update, Delete).
    Uses JWT authentication (configured globally in settings).
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes: list = [IsAdminUserRole]
    
    def get_queryset(self):
        """Return queryset ordered by name (as defined in model Meta)."""
        # Model Meta already defines ordering by 'name', but we make it explicit here
        return Category.objects.all()


class DeviceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Device model.
    
    Provides full CRUD operations (Create, Read, Update, Delete).
    Uses JWT authentication (configured globally in settings).
    
    Filtering:
    - Filter by status: /api/devices/?status=active
    - Filter by category: /api/devices/?category=1
    - Filter by name: /api/devices/?name=sensor
    - Filter by date range: /api/devices/?created_after=2024-01-01T00:00:00Z&created_before=2024-12-31T23:59:59Z
    
    Searching:
    - Search across name and description: /api/devices/?search=temperature
    
    Ordering:
    - Order by fields: /api/devices/?ordering=name, -created_at
    """
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes: list = [IsAuthenticated]
    filterset_class = DeviceFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'status', 'created_at', 'updated_at']
    ordering = ['-created_at']  # Default ordering
    
    def get_queryset(self):
        """Optimize queryset with select_related to avoid N+1 queries."""
        queryset = Device.objects.select_related('category').all()
        
        # Ordering is handled by OrderingFilter, but we keep this as fallback
        # The default ordering is set in the ordering attribute above
        
        return queryset

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not (user and user.is_authenticated and getattr(user, 'role', None) == 'admin'):
            return Response({'detail': 'Forbidden: only admin can delete devices.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class MeasurementIngestionView(APIView):
    """
    APIView for ingesting measurement data from devices.
    
    Endpoint: POST /api/devices/{device_id}/measurements/
    Creates a new measurement for a specific device.
    """
    permission_classes: list = [IsOperatorOrAdminCanWriteElseReadOnly]
    
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
            
            # Check for threshold violation and create alert if needed
            try:
                violated, message = check_for_alert(measurement)
                if violated and message:
                    Alert.objects.create(
                        device=device,
                        title=f"Threshold Violation: {measurement.metric}",
                        message=message,
                        severity=Alert.Severity.HIGH,
                        status=Alert.Status.PENDING,
                    )
            except Exception as e:
                # Log and continue; ingestion should not fail due to alert creation issues
                logger.error(
                    f"Error during threshold check/alert creation for device {device.id}: {str(e)}",
                    exc_info=True,
                )
            
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
    
    Filtering:
    - Filter by device: /api/alerts/?device=1
    - Filter by status: /api/alerts/?status=pending
    - Filter by severity: /api/alerts/?severity=high
    - Filter by device status: /api/alerts/?device_status=active
    - Filter unresolved only: /api/alerts/?unresolved_only=true
    
    Ordering:
    - Order by fields: /api/alerts/?ordering=-created_at,severity
    """
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    permission_classes: list = [IsAuthenticated]
    filterset_class = AlertFilter
    ordering_fields = ['created_at', 'severity', 'status']
    ordering = ['-created_at']  # Default ordering
    
    def get_queryset(self):
        """Optimize queryset with select_related."""
        queryset = Alert.objects.select_related('device').all()
        
        # Ordering is handled by OrderingFilter
        
        return queryset


class DeviceAggregatedDataView(APIView):
    """
    APIView for retrieving aggregated measurement data for a device.
    
    Endpoint: GET /api/devices/{device_id}/aggregated-data/
    Returns measurement points and aggregated statistics (mean, max, min) for a specific device.
    
    Query Parameters:
    - period: Filter by time period (last_24h, last_7d, last_30d, all). Default: all
    - metric: Filter by metric name (e.g., 'temperature', 'humidity'). Optional
    - limit: Maximum number of measurements to return. Default: 100
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
        
        # Get query parameters
        period = request.query_params.get('period', 'all')
        metric = request.query_params.get('metric', None)
        limit = int(request.query_params.get('limit', 100))
        
        # Base queryset
        measurements_qs = Measurement.objects.filter(device=device)
        
        # Filter by metric if provided
        if metric:
            measurements_qs = measurements_qs.filter(metric__iexact=metric)
        
        # Filter by time period
        now = timezone.now()
        if period == 'last_24h':
            start_time = now - timedelta(hours=24)
            measurements_qs = measurements_qs.filter(timestamp__gte=start_time)
        elif period == 'last_7d':
            start_time = now - timedelta(days=7)
            measurements_qs = measurements_qs.filter(timestamp__gte=start_time)
        elif period == 'last_30d':
            start_time = now - timedelta(days=30)
            measurements_qs = measurements_qs.filter(timestamp__gte=start_time)
        # 'all' doesn't filter by time
        
        # Order by timestamp (newest first) and limit
        measurements_qs = measurements_qs.order_by('-timestamp')[:limit]
        
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


class DeviceMetricsView(APIView):
    """
    APIView for retrieving available metrics for a device.
    
    Endpoint: GET /api/devices/{device_id}/metrics/
    Returns list of unique metric names available for the device.
    """
    permission_classes: list = [IsAuthenticated]
    
    def get(self, request, device_id: int) -> Response:
        """
        Retrieve available metrics for the specified device.
        
        Args:
            request: HTTP request object
            device_id: ID of the device
        
        Returns:
            Response: 200 OK with list of metrics, or 404 if device not found
        """
        # Get device or return 404
        device = get_object_or_404(Device, id=device_id)
        
        # Get distinct metrics for this device
        metrics = Measurement.objects.filter(device=device).values_list('metric', flat=True).distinct().order_by('metric')
        
        return Response({'metrics': list(metrics)}, status=status.HTTP_200_OK)


class ThresholdViewSet(viewsets.ModelViewSet):
    """
    ViewSet for MeasurementThreshold model nested under a Device by public_id.
    
    Endpoints:
    - /api/devices/<public_id>/thresholds/ [GET, POST]
    - /api/devices/<public_id>/thresholds/<pk>/ [GET, PUT, PATCH, DELETE]
    """
    serializer_class = ThresholdSerializer
    permission_classes: list = [IsAdminUserRole]
    ordering_fields = ['metric_name', 'created_at', 'updated_at']
    ordering = ['metric_name']

    def _get_device(self) -> Device:
        public_id = self.kwargs.get('public_id')
        return get_object_or_404(Device, public_id=public_id)

    def get_queryset(self):
        device = self._get_device()
        return MeasurementThreshold.objects.filter(device=device).order_by(*self.ordering)

    def perform_create(self, serializer: ThresholdSerializer) -> None:
        device = self._get_device()
        serializer.save(device=device)
