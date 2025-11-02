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
from devices.views import DeviceViewSet, MeasurementIngestionView
from typing import List

# DRF Router configuration
router = routers.DefaultRouter()
router.register(r'devices', DeviceViewSet, basename='device')

urlpatterns: List = [
    path('admin/', admin.site.urls),
    
    # JWT Authentication endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # API endpoints
    path('api/', include(router.urls)),
    
    # Measurement ingestion endpoint
    path('api/devices/<int:device_id>/measurements/', MeasurementIngestionView.as_view(), name='measurement_ingestion'),
]

# Servir arquivos estáticos e media em desenvolvimento
# Em produção, isso deve ser feito pelo servidor web (Nginx, etc.)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
