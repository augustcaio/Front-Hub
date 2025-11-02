import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Device {
  id: number;
  public_id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Device[];
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8000/api';

  /**
   * Lista todos os dispositivos
   */
  getDevices(): Observable<DeviceListResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<DeviceListResponse>(`${this.apiUrl}/devices/`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Busca um dispositivo específico por ID
   */
  getDevice(id: number): Observable<Device> {
    const headers = this.getAuthHeaders();
    return this.http.get<Device>(`${this.apiUrl}/devices/${id}/`, { headers }).pipe(
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

