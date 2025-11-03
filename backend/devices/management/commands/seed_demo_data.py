from __future__ import annotations

"""
Management command to seed demo data (devices and optional related data).

Usage:
  python manage.py seed_demo_data --devices 10 --with-measurements --with-alerts

This avoids coupling to external libs (e.g., Faker) to keep setup simple.
"""

import random
from datetime import datetime, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand

from devices.models import Device, Category, Measurement, Alert


DEFAULT_DEVICE_COUNT = 10


class Command(BaseCommand):
    help = "Seed demo data: categories, devices and optionally measurements/alerts"

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--devices",
            type=int,
            default=DEFAULT_DEVICE_COUNT,
            help=f"Quantidade de dispositivos para criar (padrão: {DEFAULT_DEVICE_COUNT})",
        )
        parser.add_argument(
            "--with-measurements",
            action="store_true",
            help="Também criar medições para dispositivos ativos",
        )
        parser.add_argument(
            "--with-alerts",
            action="store_true",
            help="Também criar alguns alertas de demonstração",
        )

    def handle(self, *args, **options) -> None:
        device_count: int = max(0, int(options["devices"]))
        with_measurements: bool = bool(options["--with-measurements"]) if "--with-measurements" in options else bool(options["with_measurements"])  # type: ignore[index]
        with_alerts: bool = bool(options["--with-alerts"]) if "--with-alerts" in options else bool(options["with_alerts"])  # type: ignore[index]

        self.stdout.write("")
        self.stdout.write("=" * 70)
        self.stdout.write("CRIANDO DADOS DE DEMONSTRAÇÃO")
        self.stdout.write("=" * 70)

        categories = self._ensure_categories()
        devices = self._ensure_devices(device_count, categories)

        active_devices = [d for d in devices if d.status == Device.Status.ACTIVE]

        if with_measurements and active_devices:
            self._create_measurements(active_devices, measurements_per_device=12)

        if with_alerts and devices:
            self._create_alerts(devices)

        self.stdout.write("")
        self.stdout.write("=" * 70)
        self.stdout.write("RESUMO")
        self.stdout.write("=" * 70)
        self.stdout.write(f"✅ Dispositivos disponíveis: {len(devices)}")
        self.stdout.write(f"   - Ativos: {len([d for d in devices if d.status == Device.Status.ACTIVE])}")
        self.stdout.write(f"   - Inativos: {len([d for d in devices if d.status == Device.Status.INACTIVE])}")
        self.stdout.write(f"   - Em Manutenção: {len([d for d in devices if d.status == Device.Status.MAINTENANCE])}")
        self.stdout.write(f"   - Com Erro: {len([d for d in devices if d.status == Device.Status.ERROR])}")

        if with_alerts:
            pending_alerts = Alert.objects.filter(status=Alert.Status.PENDING).count()
            resolved_alerts = Alert.objects.filter(status=Alert.Status.RESOLVED).count()
            self.stdout.write("")
            self.stdout.write("✅ Alertas no sistema:")
            self.stdout.write(f"   - Pendentes: {pending_alerts}")
            self.stdout.write(f"   - Resolvidos: {resolved_alerts}")

        if with_measurements:
            total_measurements = Measurement.objects.count()
            self.stdout.write("")
            self.stdout.write(f"✅ Total de medições no sistema: {total_measurements}")

        self.stdout.write("")
        self.stdout.write("=" * 70)
        self.stdout.write("✅ DADOS DE DEMONSTRAÇÃO CRIADOS COM SUCESSO!")
        self.stdout.write("=" * 70)

    def _ensure_categories(self) -> list[Category]:
        base_categories = [
            ("Temperatura", "Sensores de temperatura ambiente e câmaras frigoríficas"),
            ("Umidade", "Sensores de umidade relativa do ar e solo"),
            ("Pressão", "Sensores de pressão atmosférica"),
            ("Qualidade do Ar", "CO2 e outros poluentes"),
            ("Luminosidade", "Sensores de luz e luminosidade"),
        ]
        categories: list[Category] = []
        for name, description in base_categories:
            category, _ = Category.objects.get_or_create(
                name=name,
                defaults={"description": description},
            )
            categories.append(category)
        self.stdout.write(f"✅ Categorias disponíveis: {len(categories)}")
        return categories

    def _ensure_devices(self, count: int, categories: list[Category]) -> list[Device]:
        name_templates = [
            "Sensor de Temperatura - Zona {n}",
            "Sensor de Umidade - Estufa {n}",
            "Barômetro - Setor {n}",
            "Sensor de CO2 - Laboratório {n}",
            "Fotossensor - Jardim {n}",
        ]
        descriptions = [
            "Dispositivo de monitoramento contínuo com calibração recente.",
            "Equipamento em operação com leituras dentro do padrão.",
            "Unidade sob manutenção preventiva agendada.",
            "Módulo reportando inconsistências ocasionais, em observação.",
        ]
        status_cycle = [
            Device.Status.ACTIVE,
            Device.Status.MAINTENANCE,
            Device.Status.INACTIVE,
            Device.Status.ACTIVE,
            Device.Status.ERROR,
        ]

        devices: list[Device] = []
        for i in range(count):
            name = random.choice(name_templates).format(n=(i % 5) + 1)
            category = random.choice(categories) if categories else None
            status = status_cycle[i % len(status_cycle)]

            existing = Device.objects.filter(name=name, category=category).first()
            if existing:
                devices.append(existing)
                continue

            device = Device.objects.create(
                name=name,
                status=status,
                description=random.choice(descriptions),
                category=category,
            )
            devices.append(device)

        self.stdout.write(f"✅ Dispositivos criados/encontrados: {len(devices)}")
        return devices

    def _create_measurements(self, devices: list[Device], measurements_per_device: int = 10) -> None:
        sensor_metrics = {
            "temperatura": {"unit": "°C", "range": (15, 35)},
            "umidade": {"unit": "%", "range": (30, 80)},
            "pressao": {"unit": "hPa", "range": (980, 1020)},
            "co2": {"unit": "ppm", "range": (400, 1000)},
            "luminosidade": {"unit": "lux", "range": (0, 10000)},
        }

        total = 0
        for device in devices:
            metric_key = "temperatura"
            dn = device.name.lower()
            if "umidade" in dn:
                metric_key = "umidade"
            elif "barômetro" in dn or "barometro" in dn or "pressão" in dn or "pressao" in dn:
                metric_key = "pressao"
            elif "co2" in dn:
                metric_key = "co2"
            elif "foto" in dn or "luz" in dn or "luminosidade" in dn:
                metric_key = "luminosidade"

            cfg = sensor_metrics[metric_key]
            for idx in range(measurements_per_device):
                value = Decimal(str(round(random.uniform(cfg["range"][0], cfg["range"][1]), 2)))
                timestamp = datetime.now() - timedelta(hours=(measurements_per_device - idx) * 0.5)
                Measurement.objects.create(
                    device=device,
                    metric=metric_key,
                    value=value,
                    unit=cfg["unit"],
                    timestamp=timestamp,
                )
                total += 1

        self.stdout.write(f"✅ Medições criadas: {total}")

    def _create_alerts(self, devices: list[Device]) -> None:
        active = [d for d in devices if d.status == Device.Status.ACTIVE]
        if not active:
            self.stdout.write("ℹ️  Nenhum alerta criado (sem dispositivos ativos)")
            return

        candidates = [
            ("Temperatura Alta Detectada", "A temperatura excedeu o limite recomendado.", Alert.Severity.HIGH, Alert.Status.PENDING),
            ("Umidade Crítica", "Umidade relativa próxima ao limite máximo.", Alert.Severity.CRITICAL, Alert.Status.PENDING),
            ("Sensor Reiniciado", "Atualização de firmware concluída com sucesso.", Alert.Severity.LOW, Alert.Status.RESOLVED),
        ]

        created = 0
        for idx, device in enumerate(active[:4]):
            title, message, severity, status = candidates[idx % len(candidates)]
            exists = Alert.objects.filter(device=device, title=title, status=status).exists()
            if exists:
                continue
            created_at = datetime.now() - timedelta(hours=random.randint(2, 24))
            resolved_at = None
            if status == Alert.Status.RESOLVED:
                resolved_at = datetime.now() - timedelta(hours=1)
            Alert.objects.create(
                device=device,
                title=title,
                message=message,
                severity=severity,
                status=status,
                created_at=created_at,
                resolved_at=resolved_at,
            )
            created += 1

        self.stdout.write(f"✅ Alertas criados: {created}")


