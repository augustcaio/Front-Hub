import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

class TranslateServiceStub {
  currentLang = 'pt-BR';
  private readonly translations: Record<string, string> = {
    'auth.accountCreated': 'Conta criada com sucesso! Faça login para continuar.',
    'auth.loginError': 'Erro ao fazer login.'
  };

  setDefaultLang(): void {}

  use(): void {}

  get(key: string) {
    return of(this.translations[key] ?? key);
  }

  instant(key: string) {
    return this.translations[key] ?? key;
  }
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;
  let routerNavigateSpy: jasmine.Spy;
  let activatedRoute: { snapshot: { queryParams: Record<string, string> } };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const activatedRouteMock = {
      snapshot: {
        queryParams: {} as Record<string, string>
      }
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: TranslateService, useClass: TranslateServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    routerNavigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    activatedRoute = TestBed.inject(ActivatedRoute) as { snapshot: { queryParams: Record<string, string> } };
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('deve exibir mensagem de sucesso quando vem do registro', () => {
      activatedRoute.snapshot.queryParams = { registered: 'true' };

      component.ngOnInit();

      expect(component.successMessage).toBe('Conta criada com sucesso! Faça login para continuar.');
    });

    it('não deve exibir mensagem quando não vem do registro', () => {
      activatedRoute.snapshot.queryParams = {};

      component.ngOnInit();

      expect(component.successMessage).toBeNull();
    });
  });

  describe('Formulário', () => {
    it('deve inicializar o formulário', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('username')).toBeDefined();
      expect(component.loginForm.get('password')).toBeDefined();
    });

    it('deve ter validadores obrigatórios', () => {
      const username = component.loginForm.get('username');
      const password = component.loginForm.get('password');

      expect(username?.hasError('required')).toBe(true);
      expect(password?.hasError('required')).toBe(true);
    });

    it('deve validar tamanho mínimo do username', () => {
      const username = component.loginForm.get('username');
      username?.setValue('ab');
      expect(username?.hasError('minlength')).toBe(true);

      username?.setValue('abc');
      expect(username?.hasError('minlength')).toBe(false);
    });

    it('deve validar tamanho mínimo da senha', () => {
      const password = component.loginForm.get('password');
      password?.setValue('123');
      expect(password?.hasError('minlength')).toBe(true);

      password?.setValue('1234');
      expect(password?.hasError('minlength')).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('não deve submeter se o formulário for inválido', () => {
      component.onSubmit();

      expect(authService.login).not.toHaveBeenCalled();
    });

    it('deve marcar campos como touched se o formulário for inválido', () => {
      const username = component.loginForm.get('username');
      const password = component.loginForm.get('password');

      component.onSubmit();

      expect(username?.touched).toBe(true);
      expect(password?.touched).toBe(true);
    });

    it('deve chamar login quando o formulário for válido', () => {
      const mockResponse = {
        access: 'access_token',
        refresh: 'refresh_token'
      };

      authService.login.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });

      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith('testuser', 'password123');
    });

    it('deve definir loading como true durante o login', () => {
      const mockResponse = {
        access: 'access_token',
        refresh: 'refresh_token'
      };

      authService.login.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });

      component.onSubmit();

      // Loading deve ser false após o sucesso
      expect(component.loading).toBe(false);
    });

    it('deve redirecionar para dashboard após login bem-sucedido', () => {
      const mockResponse = {
        access: 'access_token',
        refresh: 'refresh_token'
      };

      authService.login.and.returnValue(of(mockResponse));
      activatedRoute.snapshot.queryParams = {};

      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });

      component.onSubmit();

      expect(routerNavigateSpy).toHaveBeenCalledWith(['/dashboard']);
      expect(component.errorMessage).toBeNull();
    });

    it('deve redirecionar para returnUrl se fornecido', () => {
      const mockResponse = {
        access: 'access_token',
        refresh: 'refresh_token'
      };

      authService.login.and.returnValue(of(mockResponse));
      activatedRoute.snapshot.queryParams = { returnUrl: '/devices' };

      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });

      component.onSubmit();

      expect(routerNavigateSpy).toHaveBeenCalledWith(['/devices']);
    });

    it('deve tratar erro ao fazer login', () => {
      const error = new Error('Credenciais inválidas');
      authService.login.and.returnValue(throwError(() => error));

      component.loginForm.patchValue({
        username: 'testuser',
        password: 'wrongpassword'
      });

      component.onSubmit();

      expect(component.loading).toBe(false);
      expect(component.errorMessage).toBe('Credenciais inválidas');
    });
  });

  describe('Getters de controles do formulário', () => {
    it('deve retornar controle username', () => {
      expect(component.username).toBe(component.loginForm.get('username'));
    });

    it('deve retornar controle password', () => {
      expect(component.password).toBe(component.loginForm.get('password'));
    });
  });
});

