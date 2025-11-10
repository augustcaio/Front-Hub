import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: Partial<ActivatedRoute>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);

    const activatedRouteMock = {
      snapshot: {
        queryParams: {}
      }
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ChangeDetectorRef, useValue: cdrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    activatedRoute = TestBed.inject(ActivatedRoute);
    cdr = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('deve exibir mensagem de sucesso quando vem do registro', () => {
      activatedRoute.snapshot.queryParams = { registered: 'true' };

      component.ngOnInit();

      expect(component.successMessage).toBe('Conta criada com sucesso! Faça login para continuar.');
      expect(cdr.markForCheck).toHaveBeenCalled();
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
      expect(cdr.markForCheck).toHaveBeenCalled();
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

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(component.errorMessage).toBeNull();
      expect(cdr.markForCheck).toHaveBeenCalled();
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

      expect(router.navigate).toHaveBeenCalledWith(['/devices']);
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
      expect(cdr.markForCheck).toHaveBeenCalled();
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

