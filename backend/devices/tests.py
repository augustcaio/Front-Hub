"""
Tests for devices app.

Following Django & Python best practices.
Test coverage for Device, Measurement, Alert models and their serializers.
"""
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from decimal import Decimal
from .models import Category, Device, Measurement, Alert
from .serializers import (
    CategorySerializer,
    DeviceSerializer,
    MeasurementSerializer,
    AlertSerializer,
    AggregatedDataSerializer
)

User = get_user_model()


class DeviceModelTestCase(TestCase):
    """Test cases for Device model."""

    def setUp(self):
        """Set up test data."""
        self.device_data = {
            'name': 'Sensor de Temperatura',
            'status': Device.Status.ACTIVE,
            'description': 'Sensor para monitoramento de temperatura',
        }

    def test_create_device(self):
        """Test creating a basic device."""
        device = Device.objects.create(**self.device_data)
        
        self.assertIsNotNone(device.id)
        self.assertIsNotNone(device.public_id)
        self.assertEqual(device.name, 'Sensor de Temperatura')
        self.assertEqual(device.status, Device.Status.ACTIVE)
        self.assertEqual(device.description, 'Sensor para monitoramento de temperatura')
        self.assertIsNotNone(device.created_at)
        self.assertIsNotNone(device.updated_at)

    def test_device_default_status(self):
        """Test that device defaults to INACTIVE status."""
        device = Device.objects.create(name='Test Device')
        self.assertEqual(device.status, Device.Status.INACTIVE)

    def test_device_public_id_unique(self):
        """Test that public_id is automatically generated and unique."""
        device1 = Device.objects.create(name='Device 1')
        device2 = Device.objects.create(name='Device 2')
        
        self.assertNotEqual(device1.public_id, device2.public_id)
        self.assertIsNotNone(device1.public_id)
        self.assertIsNotNone(device2.public_id)

    def test_device_str_representation(self):
        """Test Device __str__ method."""
        device = Device.objects.create(**self.device_data)
        expected_str = f"{device.name} ({device.public_id})"
        self.assertEqual(str(device), expected_str)

    def test_device_repr_representation(self):
        """Test Device __repr__ method."""
        device = Device.objects.create(**self.device_data)
        repr_str = repr(device)
        self.assertIn(device.name, repr_str)
        self.assertIn(device.status, repr_str)
        self.assertIn(str(device.public_id), repr_str)

    def test_device_status_choices(self):
        """Test device status choices."""
        statuses = [choice[0] for choice in Device.Status.choices]
        self.assertIn('active', statuses)
        self.assertIn('inactive', statuses)
        self.assertIn('maintenance', statuses)
        self.assertIn('error', statuses)

    def test_device_ordering(self):
        """Test that devices are ordered by -created_at."""
        device1 = Device.objects.create(name='Device 1')
        device2 = Device.objects.create(name='Device 2')
        
        devices = list(Device.objects.all())
        # Mais recente primeiro
        self.assertEqual(devices[0], device2)
        self.assertEqual(devices[1], device1)

    def test_device_updated_at_changes(self):
        """Test that updated_at changes when device is updated."""
        device = Device.objects.create(name='Test Device')
        original_updated_at = device.updated_at
        
        # Aguardar um pouco para garantir diferença de timestamp
        import time
        time.sleep(0.1)
        
        device.name = 'Updated Device'
        device.save()
        
        self.assertGreater(device.updated_at, original_updated_at)


class MeasurementModelTestCase(TestCase):
    """Test cases for Measurement model."""

    def setUp(self):
        """Set up test data."""
        self.device = Device.objects.create(
            name='Sensor de Temperatura',
            status=Device.Status.ACTIVE
        )
        self.measurement_data = {
            'device': self.device,
            'metric': 'temperature',
            'value': Decimal('25.5'),
            'unit': '°C',
            'timestamp': timezone.now(),
        }

    def test_create_measurement(self):
        """Test creating a basic measurement."""
        measurement = Measurement.objects.create(**self.measurement_data)
        
        self.assertIsNotNone(measurement.id)
        self.assertEqual(measurement.device, self.device)
        self.assertEqual(measurement.metric, 'temperature')
        self.assertEqual(measurement.value, Decimal('25.5'))
        self.assertEqual(measurement.unit, '°C')
        self.assertIsNotNone(measurement.timestamp)

    def test_measurement_str_representation(self):
        """Test Measurement __str__ method."""
        measurement = Measurement.objects.create(**self.measurement_data)
        str_repr = str(measurement)
        self.assertIn('temperature', str_repr)
        self.assertIn('25.5', str_repr)
        self.assertIn('°C', str_repr)
        self.assertIn(self.device.name, str_repr)

    def test_measurement_repr_representation(self):
        """Test Measurement __repr__ method."""
        measurement = Measurement.objects.create(**self.measurement_data)
        repr_str = repr(measurement)
        self.assertIn('temperature', repr_str)
        self.assertIn('25.5', repr_str)
        self.assertIn(str(measurement.device_id), repr_str)

    def test_measurement_cascade_delete(self):
        """Test that measurements are deleted when device is deleted."""
        measurement = Measurement.objects.create(**self.measurement_data)
        measurement_id = measurement.id
        
        self.device.delete()
        
        self.assertFalse(Measurement.objects.filter(id=measurement_id).exists())

    def test_measurement_ordering(self):
        """Test that measurements are ordered by -timestamp."""
        measurement1 = Measurement.objects.create(
            device=self.device,
            metric='temp1',
            value=Decimal('20.0'),
            unit='°C',
            timestamp=timezone.now() - timezone.timedelta(hours=1)
        )
        measurement2 = Measurement.objects.create(
            device=self.device,
            metric='temp2',
            value=Decimal('25.0'),
            unit='°C',
            timestamp=timezone.now()
        )
        
        measurements = list(Measurement.objects.all())
        # Mais recente primeiro
        self.assertEqual(measurements[0], measurement2)
        self.assertEqual(measurements[1], measurement1)

    def test_measurement_precision(self):
        """Test that DecimalField maintains precision."""
        measurement = Measurement.objects.create(
            device=self.device,
            metric='pressure',
            value=Decimal('1013.123456789'),
            unit='hPa',
            timestamp=timezone.now()
        )
        
        # Verificar que o valor mantém precisão
        measurement.refresh_from_db()
        self.assertEqual(measurement.value, Decimal('1013.123456789'))


class AlertModelTestCase(TestCase):
    """Test cases for Alert model."""

    def setUp(self):
        """Set up test data."""
        self.device = Device.objects.create(
            name='Sensor de Temperatura',
            status=Device.Status.ACTIVE
        )
        self.alert_data = {
            'device': self.device,
            'title': 'Temperatura Alta',
            'message': 'A temperatura excedeu o limite de 30°C',
            'severity': Alert.Severity.HIGH,
            'status': Alert.Status.PENDING,
        }

    def test_create_alert(self):
        """Test creating a basic alert."""
        alert = Alert.objects.create(**self.alert_data)
        
        self.assertIsNotNone(alert.id)
        self.assertEqual(alert.device, self.device)
        self.assertEqual(alert.title, 'Temperatura Alta')
        self.assertEqual(alert.message, 'A temperatura excedeu o limite de 30°C')
        self.assertEqual(alert.severity, Alert.Severity.HIGH)
        self.assertEqual(alert.status, Alert.Status.PENDING)
        self.assertIsNone(alert.resolved_at)
        self.assertIsNotNone(alert.created_at)
        self.assertIsNotNone(alert.updated_at)

    def test_alert_default_severity(self):
        """Test that alert defaults to MEDIUM severity."""
        alert = Alert.objects.create(
            device=self.device,
            title='Test Alert',
            message='Test message'
        )
        self.assertEqual(alert.severity, Alert.Severity.MEDIUM)

    def test_alert_default_status(self):
        """Test that alert defaults to PENDING status."""
        alert = Alert.objects.create(
            device=self.device,
            title='Test Alert',
            message='Test message'
        )
        self.assertEqual(alert.status, Alert.Status.PENDING)

    def test_alert_str_representation(self):
        """Test Alert __str__ method."""
        alert = Alert.objects.create(**self.alert_data)
        str_repr = str(alert)
        self.assertIn('Temperatura Alta', str_repr)
        self.assertIn(self.device.name, str_repr)
        self.assertIn('pending', str_repr.lower())

    def test_alert_repr_representation(self):
        """Test Alert __repr__ method."""
        alert = Alert.objects.create(**self.alert_data)
        repr_str = repr(alert)
        self.assertIn('Temperatura Alta', repr_str)
        self.assertIn(str(self.device.id), repr_str)
        self.assertIn('high', repr_str.lower())
        self.assertIn('pending', repr_str.lower())

    def test_alert_severity_choices(self):
        """Test alert severity choices."""
        severities = [choice[0] for choice in Alert.Severity.choices]
        self.assertIn('low', severities)
        self.assertIn('medium', severities)
        self.assertIn('high', severities)
        self.assertIn('critical', severities)

    def test_alert_status_choices(self):
        """Test alert status choices."""
        statuses = [choice[0] for choice in Alert.Status.choices]
        self.assertIn('pending', statuses)
        self.assertIn('resolved', statuses)

    def test_alert_cascade_delete(self):
        """Test that alerts are deleted when device is deleted."""
        alert = Alert.objects.create(**self.alert_data)
        alert_id = alert.id
        
        self.device.delete()
        
        self.assertFalse(Alert.objects.filter(id=alert_id).exists())

    def test_alert_ordering(self):
        """Test that alerts are ordered by -created_at."""
        alert1 = Alert.objects.create(
            device=self.device,
            title='Alert 1',
            message='Message 1',
            created_at=timezone.now() - timezone.timedelta(hours=1)
        )
        alert2 = Alert.objects.create(
            device=self.device,
            title='Alert 2',
            message='Message 2',
            created_at=timezone.now()
        )
        
        alerts = list(Alert.objects.all())
        # Mais recente primeiro
        self.assertEqual(alerts[0], alert2)
        self.assertEqual(alerts[1], alert1)


class DeviceSerializerTestCase(TestCase):
    """Test cases for DeviceSerializer."""

    def setUp(self):
        """Set up test data."""
        self.device_data = {
            'name': 'Sensor de Temperatura',
            'status': Device.Status.ACTIVE,
            'description': 'Sensor para monitoramento',
        }

    def test_serialize_device(self):
        """Test serializing a device."""
        device = Device.objects.create(**self.device_data)
        serializer = DeviceSerializer(device)
        
        data = serializer.data
        self.assertEqual(data['name'], 'Sensor de Temperatura')
        self.assertEqual(data['status'], Device.Status.ACTIVE)
        self.assertEqual(data['description'], 'Sensor para monitoramento')
        self.assertIn('id', data)
        self.assertIn('public_id', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    def test_deserialize_valid_device(self):
        """Test deserializing valid device data."""
        serializer = DeviceSerializer(data=self.device_data)
        self.assertTrue(serializer.is_valid())
        
        device = serializer.save()
        self.assertEqual(device.name, 'Sensor de Temperatura')
        self.assertEqual(device.status, Device.Status.ACTIVE)

    def test_validate_name_empty(self):
        """Test validation with empty name."""
        serializer = DeviceSerializer(data={'name': '', 'status': Device.Status.ACTIVE})
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_validate_name_whitespace_only(self):
        """Test validation with whitespace-only name."""
        serializer = DeviceSerializer(data={'name': '   ', 'status': Device.Status.ACTIVE})
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_validate_name_too_short(self):
        """Test validation with name shorter than 3 characters."""
        serializer = DeviceSerializer(data={'name': 'AB', 'status': Device.Status.ACTIVE})
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_validate_name_strips_whitespace(self):
        """Test that name is stripped of whitespace."""
        serializer = DeviceSerializer(data={'name': '  Test Device  ', 'status': Device.Status.ACTIVE})
        self.assertTrue(serializer.is_valid())
        device = serializer.save()
        self.assertEqual(device.name, 'Test Device')

    def test_validate_invalid_status(self):
        """Test validation with invalid status."""
        serializer = DeviceSerializer(data={'name': 'Test Device', 'status': 'invalid_status'})
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)

    def test_read_only_fields(self):
        """Test that read_only fields are not updated."""
        device = Device.objects.create(**self.device_data)
        original_public_id = device.public_id
        original_id = device.id
        
        serializer = DeviceSerializer(
            device,
            data={'name': 'Updated Name', 'public_id': 'new-uuid', 'id': 9999}
        )
        self.assertTrue(serializer.is_valid())
        serializer.save()
        
        device.refresh_from_db()
        self.assertEqual(device.public_id, original_public_id)
        self.assertEqual(device.id, original_id)
        self.assertEqual(device.name, 'Updated Name')


class MeasurementSerializerTestCase(TestCase):
    """Test cases for MeasurementSerializer."""

    def setUp(self):
        """Set up test data."""
        self.device = Device.objects.create(name='Test Device')
        self.measurement_data = {
            'device': self.device.id,
            'metric': 'temperature',
            'value': '25.5',
            'unit': '°C',
            'timestamp': timezone.now().isoformat(),
        }

    def test_serialize_measurement(self):
        """Test serializing a measurement."""
        measurement = Measurement.objects.create(
            device=self.device,
            metric='temperature',
            value=Decimal('25.5'),
            unit='°C',
            timestamp=timezone.now()
        )
        serializer = MeasurementSerializer(measurement)
        
        data = serializer.data
        self.assertEqual(data['metric'], 'temperature')
        self.assertEqual(float(data['value']), 25.5)
        self.assertEqual(data['unit'], '°C')
        self.assertIn('id', data)
        self.assertIn('device', data)
        self.assertIn('timestamp', data)

    def test_deserialize_valid_measurement(self):
        """Test deserializing valid measurement data."""
        serializer = MeasurementSerializer(data=self.measurement_data)
        self.assertTrue(serializer.is_valid())
        
        measurement = serializer.save()
        self.assertEqual(measurement.metric, 'temperature')
        self.assertEqual(measurement.value, Decimal('25.5'))
        self.assertEqual(measurement.unit, '°C')

    def test_validate_metric_empty(self):
        """Test validation with empty metric."""
        data = self.measurement_data.copy()
        data['metric'] = ''
        serializer = MeasurementSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('metric', serializer.errors)

    def test_validate_metric_whitespace_only(self):
        """Test validation with whitespace-only metric."""
        data = self.measurement_data.copy()
        data['metric'] = '   '
        serializer = MeasurementSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('metric', serializer.errors)

    def test_validate_metric_too_short(self):
        """Test validation with metric shorter than 2 characters."""
        data = self.measurement_data.copy()
        data['metric'] = 'A'
        serializer = MeasurementSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('metric', serializer.errors)

    def test_validate_metric_strips_whitespace(self):
        """Test that metric is stripped of whitespace."""
        data = self.measurement_data.copy()
        data['metric'] = '  temperature  '
        serializer = MeasurementSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        measurement = serializer.save()
        self.assertEqual(measurement.metric, 'temperature')

    def test_validate_unit_empty(self):
        """Test validation with empty unit."""
        data = self.measurement_data.copy()
        data['unit'] = ''
        serializer = MeasurementSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('unit', serializer.errors)

    def test_validate_unit_strips_whitespace(self):
        """Test that unit is stripped of whitespace."""
        data = self.measurement_data.copy()
        data['unit'] = '  °C  '
        serializer = MeasurementSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        measurement = serializer.save()
        self.assertEqual(measurement.unit, '°C')

    def test_validate_value_null(self):
        """Test validation with null value."""
        data = self.measurement_data.copy()
        data['value'] = None
        serializer = MeasurementSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('value', serializer.errors)


class AlertSerializerTestCase(TestCase):
    """Test cases for AlertSerializer."""

    def setUp(self):
        """Set up test data."""
        self.device = Device.objects.create(name='Test Device')
        self.alert_data = {
            'device': self.device.id,
            'title': 'Test Alert',
            'message': 'This is a test alert message',
            'severity': Alert.Severity.HIGH,
            'status': Alert.Status.PENDING,
        }

    def test_serialize_alert(self):
        """Test serializing an alert."""
        alert = Alert.objects.create(
            device=self.device,
            title='Test Alert',
            message='Test message',
            severity=Alert.Severity.HIGH
        )
        serializer = AlertSerializer(alert)
        
        data = serializer.data
        self.assertEqual(data['title'], 'Test Alert')
        self.assertEqual(data['message'], 'Test message')
        self.assertEqual(data['severity'], Alert.Severity.HIGH)
        self.assertIn('id', data)
        self.assertIn('device', data)
        self.assertIn('status', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    def test_deserialize_valid_alert(self):
        """Test deserializing valid alert data."""
        serializer = AlertSerializer(data=self.alert_data)
        self.assertTrue(serializer.is_valid())
        
        alert = serializer.save()
        self.assertEqual(alert.title, 'Test Alert')
        self.assertEqual(alert.message, 'This is a test alert message')
        self.assertEqual(alert.severity, Alert.Severity.HIGH)

    def test_validate_title_empty(self):
        """Test validation with empty title."""
        data = self.alert_data.copy()
        data['title'] = ''
        serializer = AlertSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('title', serializer.errors)

    def test_validate_title_too_short(self):
        """Test validation with title shorter than 3 characters."""
        data = self.alert_data.copy()
        data['title'] = 'AB'
        serializer = AlertSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('title', serializer.errors)

    def test_validate_title_strips_whitespace(self):
        """Test that title is stripped of whitespace."""
        data = self.alert_data.copy()
        data['title'] = '  Test Alert  '
        serializer = AlertSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        alert = serializer.save()
        self.assertEqual(alert.title, 'Test Alert')

    def test_validate_message_empty(self):
        """Test validation with empty message."""
        data = self.alert_data.copy()
        data['message'] = ''
        serializer = AlertSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('message', serializer.errors)

    def test_validate_message_strips_whitespace(self):
        """Test that message is stripped of whitespace."""
        data = self.alert_data.copy()
        data['message'] = '  Test message  '
        serializer = AlertSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        alert = serializer.save()
        self.assertEqual(alert.message, 'Test message')

    def test_validate_invalid_severity(self):
        """Test validation with invalid severity."""
        data = self.alert_data.copy()
        data['severity'] = 'invalid_severity'
        serializer = AlertSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('severity', serializer.errors)

    def test_validate_invalid_status(self):
        """Test validation with invalid status."""
        data = self.alert_data.copy()
        data['status'] = 'invalid_status'
        serializer = AlertSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)

    def test_update_alert_resolved_at_on_resolve(self):
        """Test that resolved_at is set when status changes to resolved."""
        alert = Alert.objects.create(
            device=self.device,
            title='Test Alert',
            message='Test message',
            status=Alert.Status.PENDING
        )
        
        serializer = AlertSerializer(alert, data={'status': Alert.Status.RESOLVED}, partial=True)
        self.assertTrue(serializer.is_valid())
        serializer.save()
        
        alert.refresh_from_db()
        self.assertEqual(alert.status, Alert.Status.RESOLVED)
        self.assertIsNotNone(alert.resolved_at)

    def test_update_alert_clears_resolved_at_on_pending(self):
        """Test that resolved_at is cleared when status changes from resolved to pending."""
        alert = Alert.objects.create(
            device=self.device,
            title='Test Alert',
            message='Test message',
            status=Alert.Status.RESOLVED,
            resolved_at=timezone.now()
        )
        
        serializer = AlertSerializer(alert, data={'status': Alert.Status.PENDING}, partial=True)
        self.assertTrue(serializer.is_valid())
        serializer.save()
        
        alert.refresh_from_db()
        self.assertEqual(alert.status, Alert.Status.PENDING)
        self.assertIsNone(alert.resolved_at)

    def test_read_only_fields(self):
        """Test that read_only fields are not updated."""
        alert = Alert.objects.create(
            device=self.device,
            title='Original Title',
            message='Original message'
        )
        original_id = alert.id
        original_created_at = alert.created_at
        
        serializer = AlertSerializer(
            alert,
            data={
                'title': 'Updated Title',
                'id': 9999,
                'created_at': timezone.now().isoformat()
            },
            partial=True
        )
        self.assertTrue(serializer.is_valid())
        serializer.save()
        
        alert.refresh_from_db()
        self.assertEqual(alert.id, original_id)
        self.assertEqual(alert.created_at, original_created_at)
        self.assertEqual(alert.title, 'Updated Title')


class CategoryViewSetAPITestCase(APITestCase):
    """Test cases for CategoryViewSet API endpoints (CRUD operations)."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client = APIClient()
        
        # Obter token JWT
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        self.category_data = {
            'name': 'Sensores',
            'description': 'Categoria para dispositivos sensores'
        }
    
    def test_list_categories_requires_authentication(self):
        """Test that listing categories requires JWT authentication."""
        self.client.credentials()  # Remove credentials
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_categories_with_authentication(self):
        """Test listing categories with valid JWT token."""
        Category.objects.create(name='Categoria 1')
        Category.objects.create(name='Categoria 2')
        
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_create_category_requires_authentication(self):
        """Test that creating category requires JWT authentication."""
        self.client.credentials()  # Remove credentials
        response = self.client.post('/api/categories/', self.category_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_category_with_authentication(self):
        """Test creating a category with valid JWT token."""
        response = self.client.post('/api/categories/', self.category_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Sensores')
        self.assertEqual(response.data['description'], 'Categoria para dispositivos sensores')
        self.assertIn('id', response.data)
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)
        
        # Verificar que foi criado no banco
        self.assertTrue(Category.objects.filter(name='Sensores').exists())
    
    def test_create_category_validation(self):
        """Test category creation validation."""
        # Test empty name
        response = self.client.post('/api/categories/', {'name': ''}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test name too short
        response = self.client.post('/api/categories/', {'name': 'AB'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test duplicate name
        Category.objects.create(name='Existente')
        response = self.client.post('/api/categories/', {'name': 'Existente'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_retrieve_category_requires_authentication(self):
        """Test that retrieving category requires JWT authentication."""
        category = Category.objects.create(name='Test Category')
        self.client.credentials()  # Remove credentials
        response = self.client.get(f'/api/categories/{category.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_retrieve_category_with_authentication(self):
        """Test retrieving a specific category with valid JWT token."""
        category = Category.objects.create(**self.category_data)
        response = self.client.get(f'/api/categories/{category.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Sensores')
        self.assertEqual(response.data['id'], category.id)
    
    def test_update_category_requires_authentication(self):
        """Test that updating category requires JWT authentication."""
        category = Category.objects.create(name='Original')
        self.client.credentials()  # Remove credentials
        response = self.client.put(f'/api/categories/{category.id}/', {'name': 'Updated'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_category_with_authentication(self):
        """Test updating a category with valid JWT token."""
        category = Category.objects.create(**self.category_data)
        update_data = {
            'name': 'Sensores Atualizados',
            'description': 'Nova descrição'
        }
        response = self.client.put(f'/api/categories/{category.id}/', update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Sensores Atualizados')
        
        category.refresh_from_db()
        self.assertEqual(category.name, 'Sensores Atualizados')
    
    def test_partial_update_category(self):
        """Test partial update (PATCH) of a category."""
        category = Category.objects.create(**self.category_data)
        response = self.client.patch(f'/api/categories/{category.id}/', {'name': 'Nome Atualizado'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Nome Atualizado')
        # Descrição deve permanecer a mesma
        self.assertEqual(response.data['description'], 'Categoria para dispositivos sensores')
    
    def test_delete_category_requires_authentication(self):
        """Test that deleting category requires JWT authentication."""
        category = Category.objects.create(name='To Delete')
        self.client.credentials()  # Remove credentials
        response = self.client.delete(f'/api/categories/{category.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_delete_category_with_authentication(self):
        """Test deleting a category with valid JWT token."""
        category = Category.objects.create(**self.category_data)
        response = self.client.delete(f'/api/categories/{category.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verificar que foi deletado
        self.assertFalse(Category.objects.filter(id=category.id).exists())
    
    def test_delete_category_with_devices_protected(self):
        """Test that deleting a category with associated devices is protected."""
        category = Category.objects.create(**self.category_data)
        device = Device.objects.create(
            name='Test Device',
            category=category,
            status=Device.Status.ACTIVE
        )
        
        # Tentar deletar categoria com dispositivos associados deve levantar ProtectedError
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            category.delete()


class DeviceViewSetAPITestCase(APITestCase):
    """Test cases for DeviceViewSet API endpoints (CRUD operations)."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client = APIClient()
        
        # Obter token JWT
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        # Criar categoria para testes
        self.category = Category.objects.create(
            name='Sensores',
            description='Categoria de sensores'
        )
        
        self.device_data = {
            'name': 'Sensor de Temperatura',
            'category': self.category.id,
            'status': Device.Status.ACTIVE,
            'description': 'Sensor para monitoramento de temperatura'
        }
    
    def test_list_devices_requires_authentication(self):
        """Test that listing devices requires JWT authentication."""
        self.client.credentials()  # Remove credentials
        response = self.client.get('/api/devices/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_devices_with_authentication(self):
        """Test listing devices with valid JWT token."""
        Device.objects.create(
            name='Device 1',
            category=self.category,
            status=Device.Status.ACTIVE
        )
        Device.objects.create(
            name='Device 2',
            category=self.category,
            status=Device.Status.INACTIVE
        )
        
        response = self.client.get('/api/devices/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_create_device_requires_authentication(self):
        """Test that creating device requires JWT authentication."""
        self.client.credentials()  # Remove credentials
        response = self.client.post('/api/devices/', self.device_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_device_with_authentication(self):
        """Test creating a device with valid JWT token."""
        response = self.client.post('/api/devices/', self.device_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Sensor de Temperatura')
        self.assertEqual(response.data['status'], Device.Status.ACTIVE)
        self.assertEqual(response.data['category'], self.category.id)
        self.assertIn('id', response.data)
        self.assertIn('public_id', response.data)
        self.assertIn('created_at', response.data)
        
        # Verificar que foi criado no banco
        self.assertTrue(Device.objects.filter(name='Sensor de Temperatura').exists())
    
    def test_create_device_without_category(self):
        """Test creating a device without category (category is optional)."""
        device_data = {
            'name': 'Device Sem Categoria',
            'status': Device.Status.ACTIVE,
            'description': 'Dispositivo sem categoria'
        }
        response = self.client.post('/api/devices/', device_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data.get('category'))
    
    def test_create_device_validation(self):
        """Test device creation validation."""
        # Test empty name
        response = self.client.post('/api/devices/', {'name': '', 'status': Device.Status.ACTIVE}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test name too short
        response = self.client.post('/api/devices/', {'name': 'AB', 'status': Device.Status.ACTIVE}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test invalid status
        response = self.client.post('/api/devices/', {
            'name': 'Valid Name',
            'status': 'invalid_status'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test invalid category
        response = self.client.post('/api/devices/', {
            'name': 'Valid Name',
            'status': Device.Status.ACTIVE,
            'category': 99999
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_retrieve_device_requires_authentication(self):
        """Test that retrieving device requires JWT authentication."""
        device = Device.objects.create(
            name='Test Device',
            category=self.category,
            status=Device.Status.ACTIVE
        )
        self.client.credentials()  # Remove credentials
        response = self.client.get(f'/api/devices/{device.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_retrieve_device_with_authentication(self):
        """Test retrieving a specific device with valid JWT token."""
        device = Device.objects.create(**{
            'name': 'Sensor de Temperatura',
            'category': self.category,
            'status': Device.Status.ACTIVE,
            'description': 'Test description'
        })
        response = self.client.get(f'/api/devices/{device.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Sensor de Temperatura')
        self.assertEqual(response.data['id'], device.id)
        self.assertEqual(response.data['category'], self.category.id)
    
    def test_update_device_requires_authentication(self):
        """Test that updating device requires JWT authentication."""
        device = Device.objects.create(
            name='Original',
            category=self.category,
            status=Device.Status.ACTIVE
        )
        self.client.credentials()  # Remove credentials
        response = self.client.put(f'/api/devices/{device.id}/', {
            'name': 'Updated',
            'category': self.category.id,
            'status': Device.Status.ACTIVE
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_device_with_authentication(self):
        """Test updating a device with valid JWT token."""
        device = Device.objects.create(**{
            'name': 'Original Name',
            'category': self.category,
            'status': Device.Status.ACTIVE
        })
        update_data = {
            'name': 'Updated Name',
            'category': self.category.id,
            'status': Device.Status.MAINTENANCE,
            'description': 'Updated description'
        }
        response = self.client.put(f'/api/devices/{device.id}/', update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Name')
        self.assertEqual(response.data['status'], Device.Status.MAINTENANCE)
        
        device.refresh_from_db()
        self.assertEqual(device.name, 'Updated Name')
        self.assertEqual(device.status, Device.Status.MAINTENANCE)
    
    def test_partial_update_device(self):
        """Test partial update (PATCH) of a device."""
        device = Device.objects.create(**{
            'name': 'Original Name',
            'category': self.category,
            'status': Device.Status.ACTIVE
        })
        response = self.client.patch(f'/api/devices/{device.id}/', {'name': 'Updated Name'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Name')
        # Status deve permanecer o mesmo
        self.assertEqual(response.data['status'], Device.Status.ACTIVE)
    
    def test_delete_device_requires_authentication(self):
        """Test that deleting device requires JWT authentication."""
        device = Device.objects.create(
            name='To Delete',
            category=self.category,
            status=Device.Status.ACTIVE
        )
        self.client.credentials()  # Remove credentials
        response = self.client.delete(f'/api/devices/{device.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_delete_device_with_authentication(self):
        """Test deleting a device with valid JWT token."""
        device = Device.objects.create(**{
            'name': 'Device To Delete',
            'category': self.category,
            'status': Device.Status.ACTIVE
        })
        device_id = device.id
        
        response = self.client.delete(f'/api/devices/{device.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verificar que foi deletado
        self.assertFalse(Device.objects.filter(id=device_id).exists())
    
    def test_delete_device_cascades_to_measurements(self):
        """Test that deleting a device cascades to its measurements."""
        device = Device.objects.create(**{
            'name': 'Device With Measurements',
            'category': self.category,
            'status': Device.Status.ACTIVE
        })
        measurement = Measurement.objects.create(
            device=device,
            metric='temperature',
            value=Decimal('25.5'),
            unit='°C',
            timestamp=timezone.now()
        )
        
        response = self.client.delete(f'/api/devices/{device.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verificar que measurement foi deletado (CASCADE)
        self.assertFalse(Measurement.objects.filter(id=measurement.id).exists())
    
    def test_delete_device_cascades_to_alerts(self):
        """Test that deleting a device cascades to its alerts."""
        device = Device.objects.create(**{
            'name': 'Device With Alerts',
            'category': self.category,
            'status': Device.Status.ACTIVE
        })
        alert = Alert.objects.create(
            device=device,
            title='Test Alert',
            message='Test message',
            severity=Alert.Severity.HIGH
        )
        
        response = self.client.delete(f'/api/devices/{device.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verificar que alert foi deletado (CASCADE)
        self.assertFalse(Alert.objects.filter(id=alert.id).exists())
    
    def test_device_list_ordered_by_created_at_desc(self):
        """Test that devices are ordered by -created_at."""
        device1 = Device.objects.create(
            name='Device 1',
            category=self.category,
            status=Device.Status.ACTIVE
        )
        device2 = Device.objects.create(
            name='Device 2',
            category=self.category,
            status=Device.Status.ACTIVE
        )
        
        response = self.client.get('/api/devices/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        # Mais recente primeiro
        self.assertEqual(results[0]['id'], device2.id)
        self.assertEqual(results[1]['id'], device1.id)

