import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { ChartModule } from 'primeng/chart';
import { Subscription } from 'rxjs';
import { DeviceService, Device, Measurement, AggregatedStatistics } from '../../core/services/device.service';
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
    DividerModule,
    ChartModule
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

  // Gráfico de precisão
  chartData: any = null;
  chartOptions: any;
  chartLoading = false;
  aggregatedStats: AggregatedStatistics | null = null;
  chartUnit = '';

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
          // Carregar dados agregados para o gráfico
          this.loadAggregatedData();
        }
      },
      error: (error: Error) => {
        this.error = error.message || 'Erro ao carregar dispositivo';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadAggregatedData(): void {
    if (!this.deviceId) {
      return;
    }

    this.chartLoading = true;
    this.cdr.markForCheck();

    this.deviceService.getAggregatedData(this.deviceId).subscribe({
      next: (data) => {
        this.aggregatedStats = data.statistics;
        this.prepareChartData(data.measurements);
        this.chartLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        console.error('Erro ao carregar dados agregados:', error);
        this.chartLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  prepareChartData(measurements: Measurement[]): void {
    if (!measurements || measurements.length === 0) {
      this.chartData = null;
      return;
    }

    // Ordenar medições por timestamp (mais antigas primeiro para o gráfico)
    const sortedMeasurements = [...measurements].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Pegar a unidade da primeira medição (assumindo que todas têm a mesma unidade)
    if (sortedMeasurements.length > 0) {
      this.chartUnit = sortedMeasurements[0].unit || '';
    }

    // Preparar labels (timestamps formatados)
    const labels = sortedMeasurements.map(m => {
      const date = new Date(m.timestamp);
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    });

    // Preparar valores (valores numéricos)
    const values = sortedMeasurements.map(m => parseFloat(m.value));

    // Preparar dados do gráfico
    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Precisão',
          data: values,
          borderColor: '#3B82F6', // Blue
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    // Configurar opções do gráfico
    this.setupChartOptions();
  }

  setupChartOptions(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    this.chartOptions = {
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `Valor: ${context.parsed.y} ${this.chartUnit}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            color: surfaceBorder
          }
        },
        y: {
          ticks: {
            color: textColorSecondary,
            callback: (value: any) => {
              return `${value} ${this.chartUnit}`;
            }
          },
          grid: {
            color: surfaceBorder
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
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

      // Atualizar gráfico com nova medição (tarefa 4.3)
      this.updateChartWithNewMeasurement(update.measurement);
      
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

  updateChartWithNewMeasurement(measurement: any): void {
    if (!this.chartData || !this.chartData.datasets || this.chartData.datasets.length === 0) {
      return;
    }

    // Adicionar novo ponto ao gráfico
    const date = new Date(measurement.timestamp);
    const label = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Adicionar novo label e valor
    this.chartData.labels.push(label);
    this.chartData.datasets[0].data.push(parseFloat(measurement.value));

    // Manter apenas os últimos 100 pontos (mesmo que o endpoint)
    if (this.chartData.labels.length > 100) {
      this.chartData.labels.shift();
      this.chartData.datasets[0].data.shift();
    }

    // Recriar objeto para trigger de mudança (OnPush)
    this.chartData = { ...this.chartData };
  }
}

