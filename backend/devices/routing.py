"""
WebSocket routing configuration for devices app.

Defines URL patterns for WebSocket connections.
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(
        r'ws/device/(?P<public_id>[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/$', 
        consumers.DeviceConsumer.as_asgi(), 
        name='device_websocket'
    ),
]

