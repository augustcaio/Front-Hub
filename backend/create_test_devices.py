#!/usr/bin/env python
"""
Script para criar dispositivos fictícios para testes.

Este script cria vários dispositivos com diferentes status e, opcionalmente,
algumas medições e alertas para cada um.
"""
import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from devices.models import Device, Measurement, Alert


def create_test_devices():
    """Cria dispositivos fictícios para testes."""
    
    devices_data = [
        {
            'name': 'Sensor de Temperatura - Sala Principal',
            'status': Device.Status.ACTIVE,
            'description': 'Sensor de temperatura ambiente instalado na sala principal do escritório. Monitora continuamente a temperatura para manter ambiente confortável.'
        },
        {
            'name': 'Sensor de Umidade - Estufa 01',
            'status': Device.Status.ACTIVE,
            'description': 'Sensor de umidade relativa do ar para controle ambiental na estufa de plantas.'
        },
        {
            'name': 'Sensor de Pressão Atmosférica',
            'status': Device.Status.ACTIVE,
            'description': 'Barômetro digital para medição de pressão atmosférica e previsão meteorológica.'
        },
        {
            'name': 'Sensor de Temperatura - Área Externa',
            'status': Device.Status.MAINTENANCE,
            'description': 'Sensor externo em manutenção preventiva. Retornará ao normal em breve.'
        },
        {
            'name': 'Sensor de CO2 - Laboratório',
            'status': Device.Status.ACTIVE,
            'description': 'Sensor de dióxido de carbono para monitoramento da qualidade do ar no laboratório.'
        },
        {
            'name': 'Sensor de Luminosidade - Jardim',
            'status': Device.Status.INACTIVE,
            'description': 'Fotossensor para medição de intensidade luminosa. Atualmente inativo para calibração.'
        },
        {
            'name': 'Sensor de Temperatura - Câmara Frigorífica',
            'status': Device.Status.ACTIVE,
            'description': 'Sensor crítico para monitoramento de temperatura em câmara frigorífica. Requer atenção constante.'
        },
        {
            'name': 'Sensor de Umidade - Porão',
            'status': Device.Status.ERROR,
            'description': 'Sensor apresentando leituras inconsistentes. Requer intervenção técnica.'
        }
    ]
    
    created_devices = []
    
    print('')
    print('=' * 70)
    print('CRIANDO DISPOSITIVOS DE TESTE')
    print('=' * 70)
    print('')
    
    for device_data in devices_data:
        # Verificar se já existe dispositivo com mesmo nome
        existing = Device.objects.filter(name=device_data['name']).first()
        
        if existing:
            print(f"ℹ️  Dispositivo '{device_data['name']}' já existe (ID: {existing.id})")
            created_devices.append(existing)
        else:
            device = Device.objects.create(
                name=device_data['name'],
                status=device_data['status'],
                description=device_data['description']
            )
            created_devices.append(device)
            print(f"✅ Dispositivo criado: {device.name} (ID: {device.id}, Status: {device.status})")
    
    return created_devices


def create_test_measurements(devices: list[Device], measurements_per_device: int = 10):
    """Cria medições fictícias para os dispositivos."""
    
    print('')
    print('=' * 70)
    print('CRIANDO MEDIÇÕES DE TESTE')
    print('=' * 70)
    print('')
    
    # Diferentes tipos de sensores com suas métricas típicas
    sensor_metrics = {
        'temperatura': {'unit': '°C', 'range': (15, 35)},
        'umidade': {'unit': '%', 'range': (30, 80)},
        'pressão': {'unit': 'hPa', 'range': (980, 1020)},
        'co2': {'unit': 'ppm', 'range': (400, 1000)},
        'luminosidade': {'unit': 'lux', 'range': (0, 10000)}
    }
    
    total_created = 0
    
    for device in devices:
        # Determinar tipo de sensor baseado no nome
        device_name_lower = device.name.lower()
        metric_type = 'temperatura'  # padrão
        
        if 'umidade' in device_name_lower or 'humidity' in device_name_lower:
            metric_type = 'umidade'
        elif 'pressão' in device_name_lower or 'pressure' in device_name_lower:
            metric_type = 'pressão'
        elif 'co2' in device_name_lower:
            metric_type = 'co2'
        elif 'luminosidade' in device_name_lower or 'luz' in device_name_lower:
            metric_type = 'luminosidade'
        
        metric_config = sensor_metrics[metric_type]
        metric_name = metric_type
        unit = metric_config['unit']
        min_val, max_val = metric_config['range']
        
        device_measurements = 0
        
        # Criar medições com timestamps diferentes (últimas horas)
        for i in range(measurements_per_device):
            try:
                # Valor aleatório dentro do range
                value = Decimal(str(round(random.uniform(min_val, max_val), 2)))
                
                # Timestamp: mais recente primeiro, espaçado em intervalos
                timestamp = datetime.now() - timedelta(
                    hours=(measurements_per_device - i) * 0.5,
                    minutes=random.randint(0, 30)
                )
                
                measurement = Measurement.objects.create(
                    device=device,
                    metric=metric_name,
                    value=value,
                    unit=unit,
                    timestamp=timestamp
                )
                
                device_measurements += 1
                
            except Exception as e:
                print(f"  ⚠️  Erro ao criar medição {i+1} para {device.name}: {e}")
        
        if device_measurements > 0:
            print(f"✅ {device_measurements} medições criadas para: {device.name}")
            total_created += device_measurements
    
    print('')
    print(f"✅ Total de medições criadas: {total_created}")
    return total_created


def create_test_alerts(devices: list[Device]):
    """Cria alertas fictícios para alguns dispositivos."""
    
    print('')
    print('=' * 70)
    print('CRIANDO ALERTAS DE TESTE')
    print('=' * 70)
    print('')
    
    # Criar alertas apenas para alguns dispositivos ativos
    active_devices = [d for d in devices if d.status == Device.Status.ACTIVE]
    
    alerts_data = [
        {
            'device_idx': 0,  # Primeiro dispositivo ativo
            'title': 'Temperatura Alta Detectada',
            'message': 'A temperatura do sensor excedeu 32°C, acima do limite recomendado de 30°C.',
            'severity': Alert.Severity.HIGH,
            'status': Alert.Status.PENDING
        },
        {
            'device_idx': 1,  # Segundo dispositivo ativo
            'title': 'Umidade Crítica',
            'message': 'Umidade relativa do ar atingiu 85%, próximo ao limite máximo de 90%.',
            'severity': Alert.Severity.CRITICAL,
            'status': Alert.Status.PENDING
        },
        {
            'device_idx': 2,  # Terceiro dispositivo ativo
            'title': 'Pressão Atmosférica Baixa',
            'message': 'Pressão atmosférica está abaixo de 1000 hPa, indicando possível mudança de tempo.',
            'severity': Alert.Severity.MEDIUM,
            'status': Alert.Status.PENDING
        },
        {
            'device_idx': 3,  # Quarto dispositivo ativo (se houver)
            'title': 'Concentração de CO2 Elevada',
            'message': 'Nível de CO2 detectado em 950 ppm. Ventilação recomendada.',
            'severity': Alert.Severity.MEDIUM,
            'status': Alert.Status.PENDING
        },
        {
            'device_idx': 0,  # Primeiro dispositivo ativo (alerta resolvido)
            'title': 'Sensor Reiniciado',
            'message': 'Sensor foi reiniciado após atualização de firmware. Funcionando normalmente.',
            'severity': Alert.Severity.LOW,
            'status': Alert.Status.RESOLVED
        }
    ]
    
    created_count = 0
    
    for alert_data in alerts_data:
        device_idx = alert_data['device_idx']
        
        # Verificar se há dispositivo ativo suficiente
        if device_idx < len(active_devices):
            device = active_devices[device_idx]
            
            # Verificar se já existe alerta similar
            existing = Alert.objects.filter(
                device=device,
                title=alert_data['title'],
                status=alert_data['status']
            ).first()
            
            if existing:
                print(f"ℹ️  Alerta já existe para {device.name}: {alert_data['title']}")
            else:
                # Criar timestamp de criação (algumas horas atrás para alertas pending)
                created_at = None
                resolved_at = None
                
                if alert_data['status'] == Alert.Status.PENDING:
                    created_at = datetime.now() - timedelta(hours=random.randint(1, 24))
                else:
                    created_at = datetime.now() - timedelta(hours=48)
                    resolved_at = datetime.now() - timedelta(hours=24)
                
                alert = Alert.objects.create(
                    device=device,
                    title=alert_data['title'],
                    message=alert_data['message'],
                    severity=alert_data['severity'],
                    status=alert_data['status'],
                    created_at=created_at,
                    resolved_at=resolved_at
                )
                
                created_count += 1
                status_label = "Resolvido" if alert_data['status'] == Alert.Status.RESOLVED else "Pendente"
                print(f"✅ Alerta criado: {alert.title} para {device.name} ({status_label})")
    
    if created_count > 0:
        print('')
        print(f"✅ Total de alertas criados: {created_count}")
    else:
        print('ℹ️  Nenhum alerta novo foi criado (já existem ou não há dispositivos suficientes)')
    
    return created_count


def main():
    """Função principal."""
    try:
        # Criar dispositivos
        devices = create_test_devices()
        
        if not devices:
            print("⚠️  Nenhum dispositivo foi criado ou encontrado.")
            return
        
        # Criar medições para dispositivos ativos
        active_devices = [d for d in devices if d.status == Device.Status.ACTIVE]
        if active_devices:
            create_test_measurements(active_devices, measurements_per_device=15)
        
        # Criar alertas
        create_test_alerts(devices)
        
        # Resumo final
        print('')
        print('=' * 70)
        print('RESUMO')
        print('=' * 70)
        print('')
        print(f"✅ Dispositivos disponíveis: {len(devices)}")
        print(f"   - Ativos: {len([d for d in devices if d.status == Device.Status.ACTIVE])}")
        print(f"   - Inativos: {len([d for d in devices if d.status == Device.Status.INACTIVE])}")
        print(f"   - Em Manutenção: {len([d for d in devices if d.status == Device.Status.MAINTENANCE])}")
        print(f"   - Com Erro: {len([d for d in devices if d.status == Device.Status.ERROR])}")
        
        pending_alerts = Alert.objects.filter(status=Alert.Status.PENDING).count()
        resolved_alerts = Alert.objects.filter(status=Alert.Status.RESOLVED).count()
        print('')
        print(f"✅ Alertas no sistema:")
        print(f"   - Pendentes: {pending_alerts}")
        print(f"   - Resolvidos: {resolved_alerts}")
        
        total_measurements = Measurement.objects.count()
        print('')
        print(f"✅ Total de medições no sistema: {total_measurements}")
        
        print('')
        print('=' * 70)
        print('✅ DISPOSITIVOS DE TESTE CRIADOS COM SUCESSO!')
        print('=' * 70)
        print('')
        print('Agora você pode executar: .\test_fase_4_completo.ps1')
        print('')
        
    except Exception as e:
        print(f'❌ Erro ao criar dispositivos: {e}', file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

