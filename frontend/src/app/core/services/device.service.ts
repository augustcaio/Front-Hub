import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: number;
  public_id: string;
  name: string;
  category?: number | null;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceCreateRequest {
  name: string;
  category?: number | null;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  description?: string;
}

export type DeviceUpdateRequest = Partial<DeviceCreateRequest>;

export interface DeviceListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Device[];
}

export interface Measurement {
  id: number;
  device: number;
  metric: string;
  value: string;
  unit: string;
  timestamp: string;
}

export interface AggregatedStatistics {
  mean: number | null;
  max: number | null;
  min: number | null;
}

export interface AggregatedDataResponse {
  measurements: Measurement[];
  statistics: AggregatedStatistics;
  count: number;
}

export interface DeviceMetricsResponse {
  metrics: string[];
}

export type ChartPeriod = 'last_24h' | 'last_7d' | 'last_30d' | 'all';

export interface Alert {
  id: number;
  device: number;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'resolved';
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface AlertListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Alert[];
}

export interface Threshold {
  id: number;
  device: number;
  metric_name: string;
  min_limit: string;
  max_limit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ThresholdListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Threshold[];
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8000/api';
  
  // API endpoints
  private readonly devicesEndpoint = `${this.apiUrl}/devices/`;
  private readonly alertsEndpoint = `${this.apiUrl}/alerts`;
  private readonly categoriesEndpoint = `${this.apiUrl}/categories/`;
  private readonly deviceThresholdsEndpoint = (publicId: string) => `${this.apiUrl}/devices/${publicId}/thresholds/`;

  /**
   * Lista todos os dispositivos
   */
  getDevices(): Observable<DeviceListResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<DeviceListResponse>(this.devicesEndpoint, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Busca um dispositivo específico por ID
   */
  getDevice(id: number): Observable<Device> {
    const headers = this.getAuthHeaders();
    return this.http.get<Device>(`${this.devicesEndpoint}${id}/`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Cria um novo dispositivo
   */
  createDevice(device: DeviceCreateRequest): Observable<Device> {
    const headers = this.getAuthHeaders();
    return this.http.post<Device>(this.devicesEndpoint, device, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Atualiza um dispositivo existente
   */
  updateDevice(id: number, device: DeviceUpdateRequest): Observable<Device> {
    const headers = this.getAuthHeaders();
    return this.http.put<Device>(`${this.devicesEndpoint}${id}/`, device, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Atualiza parcialmente um dispositivo existente
   */
  patchDevice(id: number, device: DeviceUpdateRequest): Observable<Device> {
    const headers = this.getAuthHeaders();
    return this.http.patch<Device>(`${this.devicesEndpoint}${id}/`, device, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Exclui um dispositivo
   */
  deleteDevice(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.devicesEndpoint}${id}/`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Lista todas as categorias
   */
  getCategories(): Observable<Category[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Category[]>(this.categoriesEndpoint, { headers }).pipe(
      map((response) => {
        // DRF pode retornar array direto ou objeto paginado
        if (Array.isArray(response)) {
          return response;
        }
        // Se for paginado, retornar results
        return (response as { results?: Device[] }).results || [];
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Conta dispositivos por status
   */
  getDevicesByStatus(): Observable<Record<string, number>> {
    return this.getDevices().pipe(
      map((response) => {
        const statusCount: Record<string, number> = {
          active: 0,
          inactive: 0,
          maintenance: 0,
          error: 0,
          total: response.results.length
        };

        response.results.forEach((device) => {
          const status = device.status;
          if (statusCount[status] !== undefined) {
            statusCount[status] = (statusCount[status] || 0) + 1;
          }
        });

        return statusCount;
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Busca dados agregados de um dispositivo (últimos 100 pontos + estatísticas)
   * @param deviceId ID do dispositivo
   * @param period Período de tempo (last_24h, last_7d, last_30d, all)
   * @param metric Nome da métrica para filtrar (opcional)
   * @param limit Número máximo de medições (padrão: 100)
   */
  getAggregatedData(
    deviceId: number,
    period: ChartPeriod = 'all',
    metric?: string | null,
    limit = 100
  ): Observable<AggregatedDataResponse> {
    const headers = this.getAuthHeaders();
    let url = `${this.devicesEndpoint}${deviceId}/aggregated-data/?period=${period}&limit=${limit}`;
    if (metric) {
      url += `&metric=${encodeURIComponent(metric)}`;
    }
    return this.http
      .get<AggregatedDataResponse>(url, { headers })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Busca métricas disponíveis para um dispositivo
   */
  getDeviceMetrics(deviceId: number): Observable<DeviceMetricsResponse> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<DeviceMetricsResponse>(`${this.devicesEndpoint}${deviceId}/metrics/`, { headers })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Lista todos os alertas
   */
  getAlerts(unresolvedOnly = false): Observable<AlertListResponse> {
    const headers = this.getAuthHeaders();
    const params = unresolvedOnly ? '?unresolved_only=true' : '';
    return this.http
      .get<AlertListResponse>(`${this.alertsEndpoint}${params}`, { headers })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Busca alertas não resolvidos
   */
  getUnresolvedAlerts(): Observable<AlertListResponse> {
    return this.getAlerts(true);
  }

  /**
   * Lista thresholds de um dispositivo (por public_id)
   */
  getDeviceThresholds(publicId: string): Observable<ThresholdListResponse | Threshold[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ThresholdListResponse | Threshold[]>(this.deviceThresholdsEndpoint(publicId), { headers })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Exclui um threshold específico
   */
  deleteDeviceThreshold(publicId: string, thresholdId: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete<void>(`${this.deviceThresholdsEndpoint(publicId)}${thresholdId}/`, { headers })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Cria um threshold para o device (por public_id)
   */
  createDeviceThreshold(publicId: string, payload: Pick<Threshold, 'metric_name' | 'min_limit' | 'max_limit' | 'is_active'>): Observable<Threshold> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<Threshold>(this.deviceThresholdsEndpoint(publicId), payload, { headers })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Atualiza um threshold existente
   */
  updateDeviceThreshold(publicId: string, thresholdId: number, payload: Partial<Pick<Threshold, 'metric_name' | 'min_limit' | 'max_limit' | 'is_active'>>): Observable<Threshold> {
    const headers = this.getAuthHeaders();
    return this.http
      .patch<Threshold>(`${this.deviceThresholdsEndpoint(publicId)}${thresholdId}/`, payload, { headers })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Obtém os headers de autenticação
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Trata erros HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro ao buscar dispositivos';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        errorMessage = 'Não autorizado. Verifique suas credenciais.';
      } else if (error.status === 0) {
        errorMessage = 'Não foi possível conectar ao servidor.';
      } else if (error.error?.detail) {
        errorMessage = error.error.detail;
      } else {
        errorMessage = `Erro ${error.status}: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}

