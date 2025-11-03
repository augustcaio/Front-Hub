"""
URL configuration for config project.

Following Django best practices with clean URL patterns.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from accounts.serializers import CustomTokenObtainPairSerializer
from accounts.views import register_user, get_current_user
from devices.views import CategoryViewSet, DeviceViewSet, MeasurementIngestionView, DeviceAggregatedDataView, DeviceMetricsView, AlertViewSet
from typing import List

# DRF Router configuration
router = routers.DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'devices', DeviceViewSet, basename='device')
router.register(r'alerts', AlertViewSet, basename='alert')

urlpatterns: List = [
    path('admin/', admin.site.urls),
    
    # JWT Authentication endpoints
    path('api/token/', TokenObtainPairView.as_view(serializer_class=CustomTokenObtainPairSerializer), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # User registration endpoint
    path('api/register/', register_user, name='register'),
    
    # Current user endpoint
    path('api/me/', get_current_user, name='current_user'),
    
    # API endpoints
    path('api/', include(router.urls)),
    
    # Measurement ingestion endpoint
    path('api/devices/<int:device_id>/measurements/', MeasurementIngestionView.as_view(), name='measurement_ingestion'),
    
    # Aggregated data endpoint
    path('api/devices/<int:device_id>/aggregated-data/', DeviceAggregatedDataView.as_view(), name='device_aggregated_data'),
    
    # Available metrics endpoint
    path('api/devices/<int:device_id>/metrics/', DeviceMetricsView.as_view(), name='device_metrics'),
]

# Servir arquivos estáticos e media em desenvolvimento
# Em produção, isso deve ser feito pelo servidor web (Nginx, etc.)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
