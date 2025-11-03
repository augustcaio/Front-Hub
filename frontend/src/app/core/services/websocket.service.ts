import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { WS_CONNECTION_STATUS, WsConnectionStatus } from '../utils/constants';

export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export interface MeasurementUpdate {
  type: 'measurement_update';
  measurement: {
    id: number;
    device: number;
    metric: string;
    value: string;
    unit: string;
    timestamp: string;
  };
}

export interface ConnectionEstablished {
  type: 'connection_established';
  message: string;
  device_id: string;
  device_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private readonly authService = inject(AuthService);
  private readonly wsUrl = 'ws://localhost:8000';
  
  private ws: WebSocket | null = null;
  private connectionStatus$ = new BehaviorSubject<WsConnectionStatus>(WS_CONNECTION_STATUS.DISCONNECTED);
  private messages$ = new Subject<WebSocketMessage>();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 3000;

  /**
   * Conecta ao WebSocket de um dispositivo específico
   */
  connectToDevice(devicePublicId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket já está conectado');
      return;
    }

    this.connectionStatus$.next(WS_CONNECTION_STATUS.CONNECTING);
    
    try {
      const url = `${this.wsUrl}/ws/device/${devicePublicId}/`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket conectado para dispositivo:', devicePublicId);
        this.connectionStatus$.next(WS_CONNECTION_STATUS.CONNECTED);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Mensagem recebida:', message);
          this.messages$.next(message);
        } catch (error) {
          console.error('❌ Erro ao parsear mensagem WebSocket:', error);
        }
      };

      this.ws.onerror = (error: Event) => {
        console.error('❌ Erro no WebSocket:', error);
        this.connectionStatus$.next(WS_CONNECTION_STATUS.ERROR);
      };

      this.ws.onclose = (event: CloseEvent) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        this.connectionStatus$.next(WS_CONNECTION_STATUS.DISCONNECTED);
        this.ws = null;

        // Tentar reconectar se não foi um fechamento intencional
        const WS_CLOSE_NORMAL = 1000;
        if (event.code !== WS_CLOSE_NORMAL && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            this.connectToDevice(devicePublicId);
          }, this.reconnectDelay);
        }
      };
    } catch (error) {
      console.error('❌ Erro ao criar conexão WebSocket:', error);
      this.connectionStatus$.next(WS_CONNECTION_STATUS.ERROR);
    }
  }

  /**
   * Desconecta do WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      const WS_CLOSE_NORMAL = 1000;
      this.ws.close(WS_CLOSE_NORMAL, 'Intentional disconnect');
      this.ws = null;
      this.connectionStatus$.next(WS_CONNECTION_STATUS.DISCONNECTED);
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Envia mensagem através do WebSocket
   */
  sendMessage(message: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket não está conectado. Mensagem não enviada.');
    }
  }

  /**
   * Observable para status da conexão
   */
  getConnectionStatus(): Observable<WsConnectionStatus> {
    return this.connectionStatus$.asObservable();
  }

  /**
   * Observable para mensagens recebidas
   */
  getMessages(): Observable<WebSocketMessage> {
    return this.messages$.asObservable();
  }

  /**
   * Filtra apenas mensagens de atualização de medição
   */
  getMeasurementUpdates(): Observable<MeasurementUpdate> {
    return new Observable(observer => {
      const subscription = this.messages$.subscribe(message => {
        if (message.type === 'measurement_update' && 'measurement' in message) {
          const measurementData = message['measurement'];
          if (this.isValidMeasurementData(measurementData)) {
            const update: MeasurementUpdate = {
              type: 'measurement_update',
              measurement: measurementData
            };
            observer.next(update);
          }
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  /**
   * Type guard para validar dados de medição
   */
  private isValidMeasurementData(data: unknown): data is MeasurementUpdate['measurement'] {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    const measurement = data as Record<string, unknown>;
    return (
      typeof measurement['id'] === 'number' &&
      typeof measurement['device'] === 'number' &&
      typeof measurement['metric'] === 'string' &&
      typeof measurement['value'] === 'string' &&
      typeof measurement['unit'] === 'string' &&
      typeof measurement['timestamp'] === 'string'
    );
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

