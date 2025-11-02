"""
Views for devices app.

Following Django REST Framework best practices with thin views.
Business logic should be in services/ or managers/.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Device
from .serializers import DeviceSerializer


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
