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

export interface DeviceUpdateRequest extends Partial<DeviceCreateRequest> {}

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
        return (response as any).results || [];
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Conta dispositivos por status
   */
  getDevicesByStatus(): Observable<{ [key: string]: number }> {
    return this.getDevices().pipe(
      map((response) => {
        const statusCount: { [key: string]: number } = {
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
   */
  getAggregatedData(deviceId: number): Observable<AggregatedDataResponse> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<AggregatedDataResponse>(`${this.devicesEndpoint}${deviceId}/aggregated-data/`, { headers })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Lista todos os alertas
   */
  getAlerts(unresolvedOnly: boolean = false): Observable<AlertListResponse> {
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

