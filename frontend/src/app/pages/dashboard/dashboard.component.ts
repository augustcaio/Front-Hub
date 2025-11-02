import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { DeviceService, Device, Alert } from '../../core/services/device.service';

interface StatusCount {
  active: number;
  inactive: number;
  maintenance: number;
  error: number;
  total: number;
}

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
  statusCount: StatusCount = {
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
        this.countStatus(response.results);
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

  private countStatus(devices: Device[]): void {
    const counts: StatusCount = {
      active: 0,
      inactive: 0,
      maintenance: 0,
      error: 0,
      total: devices.length
    };

    devices.forEach((device) => {
      const status = device.status;
      if (status === 'active' || status === 'inactive' || status === 'maintenance' || status === 'error') {
        counts[status] = (counts[status] || 0) + 1;
      }
    });

    this.statusCount = counts;
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'warning' | 'info' {
    const severityMap: { [key: string]: 'success' | 'danger' | 'warning' | 'info' } = {
      active: 'success',
      inactive: 'info',
      maintenance: 'warning',
      error: 'danger'
    };
    return severityMap[status] || 'info';
  }

  getStatusLabel(status: string): string {
    const labelMap: { [key: string]: string } = {
      active: 'Ativo',
      inactive: 'Inativo',
      maintenance: 'Manutenção',
      error: 'Erro'
    };
    return labelMap[status] || status;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getSeveritySeverity(severity: string): 'success' | 'info' | 'warn' | 'error' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warn' | 'error' } = {
      low: 'info',
      medium: 'warn',
      high: 'error',
      critical: 'error'
    };
    return severityMap[severity] || 'info';
  }

  getSeverityLabel(severity: string): string {
    const labelMap: { [key: string]: string } = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      critical: 'Crítica'
    };
    return labelMap[severity] || severity;
  }

  getAlertIcon(severity: string): string {
    const iconMap: { [key: string]: string } = {
      low: 'pi-info-circle',
      medium: 'pi-exclamation-triangle',
      high: 'pi-exclamation-circle',
      critical: 'pi-times-circle'
    };
    return iconMap[severity] || 'pi-info-circle';
  }

  get hasUnresolvedAlerts(): boolean {
    return this.alerts.length > 0;
  }
}
