import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, LoginResponse, TokenVerifyResponse } from './auth.service';
import { HttpErrorResponse } from '@angular/common/http';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Limpar localStorage antes de cada teste
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('login', () => {
    it('deve realizar login com sucesso e armazenar tokens', () => {
      const mockResponse: LoginResponse = {
        access: 'access_token_123',
        refresh: 'refresh_token_456'
      };

      service.login('testuser', 'password123').subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:8000/api/token/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'testuser', password: 'password123' });
      req.flush(mockResponse);

      // Verificar se tokens foram armazenados
      expect(localStorage.getItem('access_token')).toBe('access_token_123');
      expect(localStorage.getItem('refresh_token')).toBe('refresh_token_456');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('deve atualizar isAuthenticated$ após login bem-sucedido', (done) => {
      const mockResponse: LoginResponse = {
        access: 'access_token_123',
        refresh: 'refresh_token_456'
      };

      service.isAuthenticated$.subscribe((isAuth) => {
        if (isAuth) {
          expect(isAuth).toBe(true);
          done();
        }
      });

      service.login('testuser', 'password123').subscribe();
      const req = httpMock.expectOne('http://localhost:8000/api/token/');
      req.flush(mockResponse);
    });

    it('deve tratar erro 401 retornando mensagem apropriada', () => {
      const errorResponse = {
        detail: 'No active account found with the given credentials'
      };

      service.login('wronguser', 'wrongpass').subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error.message).toContain('No active account found');
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/token/');
      req.flush(errorResponse, { status: 401, statusText: 'Unauthorized' });
    });

    it('deve tratar erro de conexão', () => {
      service.login('testuser', 'password123').subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error.message).toContain('Não foi possível conectar ao servidor');
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/token/');
      req.error(new ProgressEvent('network error'), { status: 0 });
    });

    it('deve tratar erro com non_field_errors', () => {
      const errorResponse = {
        non_field_errors: ['Unable to log in with provided credentials.']
      };

      service.login('testuser', 'password123').subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error.message).toContain('Unable to log in');
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/token/');
      req.flush(errorResponse, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('deve limpar tokens e redirecionar para login', () => {
      // Simular tokens armazenados
      localStorage.setItem('access_token', 'token123');
      localStorage.setItem('refresh_token', 'refresh123');

      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('deve atualizar isAuthenticated$ após logout', () => {
      localStorage.setItem('access_token', 'token123');
      
      // Verificar valor antes do logout (pode ser true ou false dependendo do token)
      const initialValue = service.isAuthenticated();
      
      // Fazer logout
      service.logout();
      
      // Verificar que isAuthenticated() retorna false após logout
      expect(service.isAuthenticated()).toBe(false);
      
      // Verificar que isAuthenticated$ emite false
      let finalValue: boolean | undefined;
      const subscription = service.isAuthenticated$.subscribe((isAuth) => {
        finalValue = isAuth;
      });
      subscription.unsubscribe();
      
      expect(finalValue).toBe(false);
    });
  });

  describe('getToken', () => {
    it('deve retornar token quando existe', () => {
      localStorage.setItem('access_token', 'token123');
      expect(service.getToken()).toBe('token123');
    });

    it('deve retornar null quando não existe token', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('deve retornar refresh token quando existe', () => {
      localStorage.setItem('refresh_token', 'refresh123');
      expect(service.getRefreshToken()).toBe('refresh123');
    });

    it('deve retornar null quando não existe refresh token', () => {
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('deve retornar true quando existe token válido', () => {
      // Limpar localStorage primeiro
      localStorage.clear();
      
      // Simular login bem-sucedido para atualizar o estado de autenticação
      const mockResponse: LoginResponse = {
        access: 'header.' + btoa(JSON.stringify({
          exp: Math.floor(Date.now() / 1000) + 3600, // expira em 1 hora
          user_id: 1
        })) + '.signature',
        refresh: 'refresh_token_456'
      };

      service.login('testuser', 'password123').subscribe();
      const req = httpMock.expectOne('http://localhost:8000/api/token/');
      req.flush(mockResponse);
      
      expect(service.isAuthenticated()).toBe(true);
    });

    it('deve retornar false quando token não existe', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('deve retornar false quando token está expirado', () => {
      // Criar um token JWT expirado
      const expiredPayload = {
        exp: Math.floor(Date.now() / 1000) - 3600, // expirou há 1 hora
        user_id: 1
      };
      const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;
      localStorage.setItem('access_token', expiredToken);

      expect(service.isAuthenticated()).toBe(false);
    });

    it('deve retornar false quando token é inválido', () => {
      localStorage.setItem('access_token', 'invalid_token');
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('verifyToken', () => {
    it('deve verificar token válido', () => {
      localStorage.setItem('access_token', 'token123');
      const mockResponse: TokenVerifyResponse = {
        code: 'token_valid',
        detail: 'Token is valid'
      };

      service.verifyToken().subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:8000/api/token/verify/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token: 'token123' });
      req.flush(mockResponse);
    });

    it('deve retornar erro quando token não existe', () => {
      service.verifyToken().subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error.message).toBe('No token available');
        }
      });

      httpMock.expectNone('http://localhost:8000/api/token/verify/');
    });

    it('deve fazer logout quando token é inválido (401)', () => {
      localStorage.setItem('access_token', 'invalid_token');

      service.verifyToken().subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error).toBeDefined();
          expect(router.navigate).toHaveBeenCalledWith(['/login']);
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/token/verify/');
      req.flush({ detail: 'Token is invalid' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('refreshAccessToken', () => {
    it('deve atualizar token de acesso', () => {
      localStorage.setItem('refresh_token', 'refresh_token_123');
      const mockResponse: LoginResponse = {
        access: 'new_access_token',
        refresh: 'refresh_token_123'
      };

      service.refreshAccessToken().subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:8000/api/token/refresh/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refresh: 'refresh_token_123' });
      req.flush(mockResponse);

      // Verificar se novo token foi armazenado
      expect(localStorage.getItem('access_token')).toBe('new_access_token');
      expect(localStorage.getItem('refresh_token')).toBe('refresh_token_123');
    });

    it('deve retornar erro quando refresh token não existe', () => {
      service.refreshAccessToken().subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error.message).toBe('No refresh token available');
        }
      });

      httpMock.expectNone('http://localhost:8000/api/token/refresh/');
    });

    it('deve fazer logout quando refresh token é inválido (401)', () => {
      localStorage.setItem('refresh_token', 'invalid_refresh');

      service.refreshAccessToken().subscribe({
        next: () => fail('deveria ter retornado erro'),
        error: (error: Error) => {
          expect(error).toBeDefined();
          expect(router.navigate).toHaveBeenCalledWith(['/login']);
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/token/refresh/');
      req.flush({ detail: 'Token is invalid' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('getAuthHeaders', () => {
    it('deve retornar headers com Authorization quando token existe', () => {
      localStorage.setItem('access_token', 'token123');
      const headers = service.getAuthHeaders();

      expect(headers.get('Authorization')).toBe('Bearer token123');
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('deve retornar headers vazios quando token não existe', () => {
      const headers = service.getAuthHeaders();

      expect(headers.get('Authorization')).toBeNull();
      expect(headers.keys().length).toBe(0);
    });
  });

  describe('isAuthenticated$ Observable', () => {
    it('deve emitir valor inicial correto', (done) => {
      service.isAuthenticated$.subscribe((isAuth) => {
        expect(isAuth).toBe(false);
        done();
      });
    });

    it('deve emitir true após login', (done) => {
      const mockResponse: LoginResponse = {
        access: 'token123',
        refresh: 'refresh123'
      };

      let callCount = 0;
      service.isAuthenticated$.subscribe((isAuth) => {
        callCount++;
        if (callCount === 2) {
          // Segunda emissão após login
          expect(isAuth).toBe(true);
          done();
        }
      });

      service.login('testuser', 'password123').subscribe();
      const req = httpMock.expectOne('http://localhost:8000/api/token/');
      req.flush(mockResponse);
    });
  });
});
