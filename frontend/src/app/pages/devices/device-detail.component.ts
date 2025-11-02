import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { Subscription } from 'rxjs';
import { DeviceService, Device } from '../../core/services/device.service';
import { WebSocketService, MeasurementUpdate } from '../../core/services/websocket.service';

@Component({
  selector: 'app-device-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    DividerModule
  ],
  templateUrl: './device-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeviceDetailComponent implements OnInit, OnDestroy {
  private readonly deviceService = inject(DeviceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly wsService = inject(WebSocketService);

  device: Device | null = null;
  loading = true;
  error: string | null = null;
  deviceId: number | null = null;
  
  wsConnected = false;
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  recentMeasurements: Array<{
    id: number;
    device: number;
    metric: string;
    value: string;
    unit: string;
    timestamp: string;
  }> = [];
  private wsSubscription?: Subscription;
  private wsStatusSubscription?: Subscription;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.deviceId = +id;
        this.loadDevice();
      } else {
        this.error = 'ID do dispositivo não fornecido';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadDevice(): void {
    if (!this.deviceId) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.deviceService.getDevice(this.deviceId).subscribe({
      next: (device: Device) => {
        this.device = device;
        this.loading = false;
        this.cdr.markForCheck();
        
        // Conectar ao WebSocket após carregar o dispositivo
        if (device) {
          this.connectWebSocket(device.public_id);
        }
      },
      error: (error: Error) => {
        this.error = error.message || 'Erro ao carregar dispositivo';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  connectWebSocket(publicId: string): void {
    // Observar status da conexão
    this.wsStatusSubscription = this.wsService.getConnectionStatus().subscribe(status => {
      this.wsStatus = status;
      this.wsConnected = status === 'connected';
      this.cdr.markForCheck();
    });

    // Observar atualizações de medições
    this.wsSubscription = this.wsService.getMeasurementUpdates().subscribe((update: MeasurementUpdate) => {
      console.log('📊 Nova medição recebida:', update.measurement);
      this.recentMeasurements.unshift(update.measurement);
      
      // Manter apenas as últimas 10 medições
      if (this.recentMeasurements.length > 10) {
        this.recentMeasurements = this.recentMeasurements.slice(0, 10);
      }
      
      this.cdr.markForCheck();
    });

    // Conectar ao WebSocket
    this.wsService.connectToDevice(publicId);
  }

  ngOnDestroy(): void {
    // Desconectar WebSocket ao sair do componente
    this.wsService.disconnect();
    
    // Cancelar subscriptions
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    if (this.wsStatusSubscription) {
      this.wsStatusSubscription.unsubscribe();
    }
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  goBack(): void {
    this.router.navigate(['/devices']);
  }

  refresh(): void {
    this.loadDevice();
  }
}

