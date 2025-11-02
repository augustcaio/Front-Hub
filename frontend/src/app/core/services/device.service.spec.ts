import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { DeviceService, Device, DeviceListResponse, AggregatedDataResponse, AlertListResponse } from './device.service';
import { AuthService } from './auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('DeviceService', () => {
  let service: DeviceService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DeviceService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(DeviceService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getDevices', () => {
    it('deve buscar lista de dispositivos com sucesso', () => {
      authService.getToken.and.returnValue('token123');
      const mockResponse: DeviceListResponse = {
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            public_id: 'uuid-1',
            name: 'Sensor 1',
            status: 'active',
            description: 'Descrição 1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            public_id: 'uuid-2',
            name: 'Sensor 2',
            status: 'inactive',
            description: 'Descrição 2',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ]
      };

      service.getDevices().subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.results.length).toBe(2);
      });

      const req = httpMock.expectOne('http://localhost:8000/api/devices/');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer token123');
      req.flush(mockResponse);
    });

    it('deve usar headers sem Authorization quando token não existe', () => {
      authService.getToken.and.returnValue(null);

      service.getDevices().subscribe();

      const req = httpMock.expectOne('http://localhost:8000/api/devices/');
      expect(req.request.headers.get('Authorization')).toBe('');
      req.flush({ count: 0, results: [], next: null, previous: null });
    });

    it('deve tratar erro 401 retornando mensagem apropriada', () => {
      authService.getToken.and.returnValue('token123');

      service.getDevices().subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error.message).toContain('Não autorizado');
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/devices/');
      req.flush(
        { detail: 'Authentication credentials were not provided.' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });

    it('deve tratar erro de conexão', () => {
      authService.getToken.and.returnValue('token123');

      service.getDevices().subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error.message).toContain('Não foi possível conectar ao servidor');
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/devices/');
      req.error(new ProgressEvent('network error'), { status: 0 });
    });
  });

  describe('getDevice', () => {
    it('deve buscar dispositivo específico por ID', () => {
      authService.getToken.and.returnValue('token123');
      const mockDevice: Device = {
        id: 1,
        public_id: 'uuid-1',
        name: 'Sensor 1',
        status: 'active',
        description: 'Descrição 1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      service.getDevice(1).subscribe((device) => {
        expect(device).toEqual(mockDevice);
        expect(device.id).toBe(1);
      });

      const req = httpMock.expectOne('http://localhost:8000/api/devices/1/');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer token123');
      req.flush(mockDevice);
    });

    it('deve tratar erro ao buscar dispositivo inexistente', () => {
      authService.getToken.and.returnValue('token123');

      service.getDevice(999).subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/devices/999/');
      req.flush({ detail: 'Not found.' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getDevicesByStatus', () => {
    it('deve contar dispositivos por status corretamente', () => {
      authService.getToken.and.returnValue('token123');
      const mockResponse: DeviceListResponse = {
        count: 5,
        next: null,
        previous: null,
        results: [
          { id: 1, public_id: 'uuid-1', name: 'D1', status: 'active', created_at: '', updated_at: '' },
          { id: 2, public_id: 'uuid-2', name: 'D2', status: 'active', created_at: '', updated_at: '' },
          { id: 3, public_id: 'uuid-3', name: 'D3', status: 'inactive', created_at: '', updated_at: '' },
          { id: 4, public_id: 'uuid-4', name: 'D4', status: 'maintenance', created_at: '', updated_at: '' },
          { id: 5, public_id: 'uuid-5', name: 'D5', status: 'error', created_at: '', updated_at: '' }
        ]
      };

      service.getDevicesByStatus().subscribe((statusCount) => {
        expect(statusCount['active']).toBe(2);
        expect(statusCount['inactive']).toBe(1);
        expect(statusCount['maintenance']).toBe(1);
        expect(statusCount['error']).toBe(1);
        expect(statusCount['total']).toBe(5);
      });

      const req = httpMock.expectOne('http://localhost:8000/api/devices/');
      req.flush(mockResponse);
    });

    it('deve retornar zeros quando não há dispositivos', () => {
      authService.getToken.and.returnValue('token123');
      const mockResponse: DeviceListResponse = {
        count: 0,
        next: null,
        previous: null,
        results: []
      };

      service.getDevicesByStatus().subscribe((statusCount) => {
        expect(statusCount['active']).toBe(0);
        expect(statusCount['inactive']).toBe(0);
        expect(statusCount['maintenance']).toBe(0);
        expect(statusCount['error']).toBe(0);
        expect(statusCount['total']).toBe(0);
      });

      const req = httpMock.expectOne('http://localhost:8000/api/devices/');
      req.flush(mockResponse);
    });

    it('deve tratar erro ao contar dispositivos', () => {
      authService.getToken.and.returnValue('token123');

      service.getDevicesByStatus().subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/devices/');
      req.flush({ detail: 'Error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getAggregatedData', () => {
    it('deve buscar dados agregados do dispositivo', () => {
      authService.getToken.and.returnValue('token123');
      const mockResponse: AggregatedDataResponse = {
        measurements: [
          {
            id: 1,
            device: 1,
            metric: 'temperature',
            value: '25.5',
            unit: '°C',
            timestamp: '2024-01-01T00:00:00Z'
          }
        ],
        statistics: {
          mean: 25.5,
          max: 30.0,
          min: 20.0
        },
        count: 1
      };

      service.getAggregatedData(1).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.measurements.length).toBe(1);
        expect(response.statistics.mean).toBe(25.5);
      });

      const req = httpMock.expectOne('http://localhost:8000/api/devices/1/aggregated-data/');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer token123');
      req.flush(mockResponse);
    });

    it('deve tratar erro ao buscar dados agregados', () => {
      authService.getToken.and.returnValue('token123');

      service.getAggregatedData(999).subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/devices/999/aggregated-data/');
      req.flush({ detail: 'Not found.' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getAlerts', () => {
    it('deve buscar todos os alertas', () => {
      authService.getToken.and.returnValue('token123');
      const mockResponse: AlertListResponse = {
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            device: 1,
            title: 'Alerta 1',
            message: 'Mensagem 1',
            severity: 'high',
            status: 'pending',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            resolved_at: null
          },
          {
            id: 2,
            device: 1,
            title: 'Alerta 2',
            message: 'Mensagem 2',
            severity: 'low',
            status: 'resolved',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            resolved_at: '2024-01-01T01:00:00Z'
          }
        ]
      };

      service.getAlerts().subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.results.length).toBe(2);
      });

      const req = httpMock.expectOne('http://localhost:8000/api/alerts');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('deve buscar apenas alertas não resolvidos quando unresolvedOnly é true', () => {
      authService.getToken.and.returnValue('token123');
      const mockResponse: AlertListResponse = {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            device: 1,
            title: 'Alerta 1',
            message: 'Mensagem 1',
            severity: 'high',
            status: 'pending',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            resolved_at: null
          }
        ]
      };

      service.getAlerts(true).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.results.every(a => a.status === 'pending')).toBe(true);
      });

      const req = httpMock.expectOne('http://localhost:8000/api/alerts?unresolved_only=true');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('deve tratar erro ao buscar alertas', () => {
      authService.getToken.and.returnValue('token123');

      service.getAlerts().subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/alerts');
      req.flush({ detail: 'Error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getUnresolvedAlerts', () => {
    it('deve chamar getAlerts com unresolvedOnly=true', () => {
      authService.getToken.and.returnValue('token123');
      const mockResponse: AlertListResponse = {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            device: 1,
            title: 'Alerta',
            message: 'Mensagem',
            severity: 'high',
            status: 'pending',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            resolved_at: null
          }
        ]
      };

      service.getUnresolvedAlerts().subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:8000/api/alerts?unresolved_only=true');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('handleError', () => {
    it('deve tratar ErrorEvent (erro do cliente)', () => {
      authService.getToken.and.returnValue('token123');
      const errorEvent = new ErrorEvent('network', {
        message: 'Network error'
      });

      service.getDevices().subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error.message).toContain('Erro: Network error');
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/devices/');
      req.error(errorEvent);
    });

    it('deve tratar erro com detail do servidor', () => {
      authService.getToken.and.returnValue('token123');

      service.getDevices().subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error.message).toBe('Error message from server');
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/devices/');
      req.flush({ detail: 'Error message from server' }, { status: 400, statusText: 'Bad Request' });
    });

    it('deve tratar erro genérico sem detail', () => {
      authService.getToken.and.returnValue('token123');

      service.getDevices().subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error.message).toContain('Erro 500');
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/devices/');
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
