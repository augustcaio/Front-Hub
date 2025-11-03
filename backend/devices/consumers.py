"""
WebSocket consumers for devices app.

Following Django Channels best practices with AsyncWebsocketConsumer
and proper error handling.
"""
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ValidationError
import json
import logging

from .models import Device

logger = logging.getLogger(__name__)


class DeviceConsumer(AsyncWebsocketConsumer):
    """
    AsyncWebsocketConsumer for device-specific WebSocket connections.
    
    Accepts connections at ws/device/<public_id>
    Groups connected clients by device public_id for broadcasting.
    """
    
    async def connect(self):
        """
        Handle WebSocket connection.
        
        Validates device public_id from URL path and joins device group.
        """
        # Extract public_id from URL path
        self.public_id = self.scope['url_route']['kwargs']['public_id']
        self.device_group_name = f'device_{self.public_id}'
        
        # Validate device exists
        device = await self.get_device(self.public_id)
        if not device:
            logger.warning(f"Connection attempt to non-existent device: {self.public_id}")
            await self.close(code=4004)  # Not Found
            return
        
        # Join device group
        await self.channel_layer.group_add(
            self.device_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket connected for device: {self.public_id}")
        
        # Send welcome message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to device {self.public_id}',
            'device_id': str(self.public_id),
            'device_name': device.name
        }))
    
    async def disconnect(self, close_code):
        """
        Handle WebSocket disconnection.
        
        Leaves device group when connection is closed.
        """
        # Leave device group
        await self.channel_layer.group_discard(
            self.device_group_name,
            self.channel_name
        )
        logger.info(f"WebSocket disconnected for device: {self.public_id} (code: {close_code})")
    
    async def receive(self, text_data):
        """
        Handle messages received from WebSocket client.
        
        Currently only logs received messages.
        Can be extended for bidirectional communication if needed.
        """
        try:
            data = json.loads(text_data)
            logger.debug(f"Received message from device {self.public_id}: {data}")
            
            # Echo message back (optional - can be removed if not needed)
            await self.send(text_data=json.dumps({
                'type': 'message_received',
                'data': data
            }))
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received from device {self.public_id}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
    
    # Handler for messages sent to the group
    async def measurement_update(self, event):
        """
        Handle 'measurement_update' message sent to the device group.
        
        This method is called when a message is broadcast to the group
        via channel_layer.group_send().
        
        Args:
            event: Dict containing message data with 'measurement' key
        """
        measurement = event['measurement']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'measurement_update',
            'measurement': measurement
        }))
    
    @database_sync_to_async
    def get_device(self, public_id: str):
        """
        Get device by public_id (UUID).
        
        Args:
            public_id: UUID string of the device
            
        Returns:
            Device object or None if not found
        """
        try:
            device = Device.objects.get(public_id=public_id)
            return device
        except (Device.DoesNotExist, ValidationError):
            return None

