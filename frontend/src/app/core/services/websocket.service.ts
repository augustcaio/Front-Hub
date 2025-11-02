import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';

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
  private connectionStatus$ = new BehaviorSubject<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  private messages$ = new Subject<WebSocketMessage>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  /**
   * Conecta ao WebSocket de um dispositivo específico
   */
  connectToDevice(devicePublicId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket já está conectado');
      return;
    }

    this.connectionStatus$.next('connecting');
    
    try {
      const url = `${this.wsUrl}/ws/device/${devicePublicId}/`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket conectado para dispositivo:', devicePublicId);
        this.connectionStatus$.next('connected');
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

      this.ws.onerror = (error) => {
        console.error('❌ Erro no WebSocket:', error);
        this.connectionStatus$.next('error');
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        this.connectionStatus$.next('disconnected');
        this.ws = null;

        // Tentar reconectar se não foi um fechamento intencional
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            this.connectToDevice(devicePublicId);
          }, this.reconnectDelay);
        }
      };
    } catch (error) {
      console.error('❌ Erro ao criar conexão WebSocket:', error);
      this.connectionStatus$.next('error');
    }
  }

  /**
   * Desconecta do WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Intentional disconnect');
      this.ws = null;
      this.connectionStatus$.next('disconnected');
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
  getConnectionStatus(): Observable<'connecting' | 'connected' | 'disconnected' | 'error'> {
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
          const update: MeasurementUpdate = {
            type: 'measurement_update',
            measurement: message['measurement'] as MeasurementUpdate['measurement']
          };
          observer.next(update);
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

