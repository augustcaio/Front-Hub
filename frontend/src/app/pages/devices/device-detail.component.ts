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
import { ChartData, ChartOptions, ChartTooltipContext } from '../../core/types/chart.types';
import { getDeviceStatusSeverity, getDeviceStatusLabel } from '../../core/utils/device.utils';
import { formatDateTimeFull, formatTime } from '../../core/utils/date.utils';
import { CHART_CONFIG, WS_CONNECTION_STATUS, WsConnectionStatus } from '../../core/utils/constants';

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
  wsStatus: WsConnectionStatus = WS_CONNECTION_STATUS.DISCONNECTED;
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
  chartData: ChartData | null = null;
  chartOptions: ChartOptions | null = null;
  chartLoading = false;
  aggregatedStats: AggregatedStatistics | null = null;
  chartUnit = '';
  chartMeasurements: Measurement[] = []; // Armazenar medições do gráfico para recalcular estatísticas

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
        // Armazenar medições para recalcular estatísticas em tempo real
        this.chartMeasurements = [...data.measurements];
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
      this.chartMeasurements = [];
      return;
    }

    // Ordenar medições por timestamp (mais antigas primeiro para o gráfico)
    const sortedMeasurements = [...measurements].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Armazenar medições ordenadas
    this.chartMeasurements = sortedMeasurements;

    // Pegar a unidade da primeira medição (assumindo que todas têm a mesma unidade)
    if (sortedMeasurements.length > 0) {
      this.chartUnit = sortedMeasurements[0].unit || '';
    }

    // Preparar labels (timestamps formatados)
    const labels = sortedMeasurements.map(m => formatTime(m.timestamp));

    // Preparar valores (valores numéricos)
    const values = sortedMeasurements.map(m => parseFloat(m.value));

    // Preparar dados do gráfico
    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Precisão',
          data: values,
          borderColor: CHART_CONFIG.COLORS.PRIMARY,
          backgroundColor: CHART_CONFIG.COLORS.PRIMARY_ALPHA,
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
            label: (context: ChartTooltipContext) => {
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
            callback: (value: number | string) => {
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
      
      // Manter apenas as últimas medições conforme configurado
      if (this.recentMeasurements.length > CHART_CONFIG.RECENT_MEASUREMENTS_LIMIT) {
        this.recentMeasurements = this.recentMeasurements.slice(0, CHART_CONFIG.RECENT_MEASUREMENTS_LIMIT);
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
    return getDeviceStatusSeverity(status);
  }

  getStatusLabel(status: string): string {
    return getDeviceStatusLabel(status);
  }

  formatDate(dateString: string): string {
    return formatDateTimeFull(dateString);
  }

  goBack(): void {
    this.router.navigate(['/devices']);
  }

  refresh(): void {
    this.loadDevice();
  }

  updateChartWithNewMeasurement(measurement: MeasurementUpdate['measurement']): void {
    // Se o gráfico ainda não foi inicializado, inicializar com esta medição
    if (!this.chartData || !this.chartData.datasets || this.chartData.datasets.length === 0) {
      // Inicializar gráfico com a primeira medição recebida via WebSocket
      this.initializeChartWithMeasurement(measurement);
      this.cdr.markForCheck();
      return;
    }

    // Converter medição recebida para o formato Measurement
    const newMeasurement: Measurement = {
      id: measurement.id,
      device: measurement.device,
      metric: measurement.metric,
      value: measurement.value,
      unit: measurement.unit,
      timestamp: measurement.timestamp
    };

    // Adicionar nova medição à lista (já ordenada)
    this.chartMeasurements.push(newMeasurement);
    
    // Ordenar por timestamp (mais antigas primeiro)
    this.chartMeasurements.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Manter apenas os últimos pontos conforme configurado
    if (this.chartMeasurements.length > CHART_CONFIG.MAX_DATA_POINTS) {
      this.chartMeasurements.shift();
    }

    // Atualizar unidade se necessário
    if (newMeasurement.unit && !this.chartUnit) {
      this.chartUnit = newMeasurement.unit;
    }

    // Preparar novos dados do gráfico a partir da lista atualizada
    const labels = this.chartMeasurements.map(m => formatTime(m.timestamp));

    const values = this.chartMeasurements.map(m => parseFloat(m.value));

    // Atualizar dados do gráfico
    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Precisão',
          data: values,
          borderColor: CHART_CONFIG.COLORS.PRIMARY,
          backgroundColor: CHART_CONFIG.COLORS.PRIMARY_ALPHA,
          tension: 0.4,
          fill: true
        }
      ]
    };

    // Recalcular estatísticas agregadas
    this.recalculateAggregatedStats();

    // Trigger de mudança (OnPush)
    this.cdr.markForCheck();
  }

  private initializeChartWithMeasurement(measurement: MeasurementUpdate['measurement']): void {
    const newMeasurement: Measurement = {
      id: measurement.id,
      device: measurement.device,
      metric: measurement.metric,
      value: measurement.value,
      unit: measurement.unit,
      timestamp: measurement.timestamp
    };

    this.chartMeasurements = [newMeasurement];
    this.chartUnit = measurement.unit || '';

    const label = formatTime(measurement.timestamp);

    this.chartData = {
      labels: [label],
      datasets: [
        {
          label: 'Precisão',
          data: [parseFloat(measurement.value)],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    this.setupChartOptions();
    this.recalculateAggregatedStats();
  }

  private recalculateAggregatedStats(): void {
    if (!this.chartMeasurements || this.chartMeasurements.length === 0) {
      this.aggregatedStats = {
        mean: null,
        max: null,
        min: null
      };
      return;
    }

    const values = this.chartMeasurements.map(m => parseFloat(m.value));
    
    if (values.length === 0) {
      this.aggregatedStats = {
        mean: null,
        max: null,
        min: null
      };
      return;
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    this.aggregatedStats = {
      mean: mean,
      max: max,
      min: min
    };
  }
}

