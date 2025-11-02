import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { DeviceService, Device, Alert } from '../../core/services/device.service';
import { countDevicesByStatus, DeviceStatusCount } from '../../core/utils/device.utils';
import { getDeviceStatusSeverity, getDeviceStatusLabel } from '../../core/utils/device.utils';
import { getAlertSeveritySeverity, getAlertSeverityLabel, getAlertSeverityIcon } from '../../core/utils/alert.utils';
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil } from '../../core/utils/date.utils';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ProgressSpinnerModule,
    TagModule,
    ButtonModule,
    MessageModule
  ],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly deviceService = inject(DeviceService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  error: string | null = null;
  devices: Device[] = [];
  alerts: Alert[] = [];
  statusCount: DeviceStatusCount = {
    active: 0,
    inactive: 0,
    maintenance: 0,
    error: 0,
    total: 0
  };

  get activeCount(): number {
    return this.statusCount.active || 0;
  }

  get inactiveCount(): number {
    return this.statusCount.inactive || 0;
  }

  get maintenanceCount(): number {
    return this.statusCount.maintenance || 0;
  }

  get errorCount(): number {
    return this.statusCount.error || 0;
  }

  get totalCount(): number {
    return this.statusCount.total || 0;
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    // Carrega dispositivos e conta status
    this.deviceService.getDevices().subscribe({
      next: (response) => {
        this.devices = response.results.slice(0, 5); // Primeiros 5 para preview
        this.statusCount = countDevicesByStatus(response.results);
        this.loadAlerts();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        this.error = error.message || 'Erro ao carregar dados do dashboard';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadAlerts(): void {
    // Buscar alertas não resolvidos
    this.deviceService.getUnresolvedAlerts().subscribe({
      next: (response) => {
        this.alerts = response.results;
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        // Não exibir erro, apenas logar (alertas são opcionais)
        console.error('Erro ao carregar alertas:', error);
      }
    });
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'warning' | 'info' {
    return getDeviceStatusSeverity(status);
  }

  getStatusLabel(status: string): string {
    return getDeviceStatusLabel(status);
  }

  formatDate(dateString: string): string {
    return formatDateUtil(dateString);
  }

  formatDateTime(dateString: string): string {
    return formatDateTimeUtil(dateString);
  }

  getSeveritySeverity(severity: string): 'success' | 'info' | 'warn' | 'error' {
    return getAlertSeveritySeverity(severity);
  }

  getSeverityLabel(severity: string): string {
    return getAlertSeverityLabel(severity);
  }

  getAlertIcon(severity: string): string {
    return getAlertSeverityIcon(severity);
  }

  get hasUnresolvedAlerts(): boolean {
    return this.alerts.length > 0;
  }
}
