import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ChangeDetectorRef, useValue: cdrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    cdr = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Formulário', () => {
    it('deve inicializar o formulário', () => {
      expect(component.registerForm).toBeDefined();
      expect(component.registerForm.get('username')).toBeDefined();
      expect(component.registerForm.get('email')).toBeDefined();
      expect(component.registerForm.get('firstName')).toBeDefined();
      expect(component.registerForm.get('lastName')).toBeDefined();
      expect(component.registerForm.get('password')).toBeDefined();
      expect(component.registerForm.get('confirmPassword')).toBeDefined();
    });

    it('deve ter validadores obrigatórios', () => {
      const username = component.registerForm.get('username');
      const email = component.registerForm.get('email');
      const firstName = component.registerForm.get('firstName');
      const lastName = component.registerForm.get('lastName');
      const password = component.registerForm.get('password');
      const confirmPassword = component.registerForm.get('confirmPassword');

      expect(username?.hasError('required')).toBe(true);
      expect(email?.hasError('required')).toBe(true);
      expect(firstName?.hasError('required')).toBe(true);
      expect(lastName?.hasError('required')).toBe(true);
      expect(password?.hasError('required')).toBe(true);
      expect(confirmPassword?.hasError('required')).toBe(true);
    });

    it('deve validar email', () => {
      const email = component.registerForm.get('email');
      email?.setValue('invalid-email');
      expect(email?.hasError('email')).toBe(true);

      email?.setValue('valid@email.com');
      expect(email?.hasError('email')).toBe(false);
    });

    it('deve validar tamanho mínimo do username', () => {
      const username = component.registerForm.get('username');
      username?.setValue('ab');
      expect(username?.hasError('minlength')).toBe(true);

      username?.setValue('abc');
      expect(username?.hasError('minlength')).toBe(false);
    });

    it('deve validar tamanho mínimo da senha', () => {
      const password = component.registerForm.get('password');
      password?.setValue('1234567');
      expect(password?.hasError('minlength')).toBe(true);

      password?.setValue('12345678');
      expect(password?.hasError('minlength')).toBe(false);
    });

    it('deve validar formato do username', () => {
      const username = component.registerForm.get('username');
      username?.setValue('invalid username');
      expect(username?.hasError('invalidUsername')).toBe(true);

      username?.setValue('valid_username');
      expect(username?.hasError('invalidUsername')).toBe(false);
    });

    it('deve validar se as senhas coincidem', () => {
      const password = component.registerForm.get('password');
      const confirmPassword = component.registerForm.get('confirmPassword');

      password?.setValue('password123');
      confirmPassword?.setValue('password456');

      expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
      expect(confirmPassword?.hasError('passwordMismatch')).toBe(true);

      confirmPassword?.setValue('password123');
      expect(component.registerForm.hasError('passwordMismatch')).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('não deve submeter se o formulário for inválido', () => {
      component.onSubmit();

      expect(authService.register).not.toHaveBeenCalled();
    });

    it('deve marcar campos como touched se o formulário for inválido', () => {
      const username = component.registerForm.get('username');
      const email = component.registerForm.get('email');

      component.onSubmit();

      expect(username?.touched).toBe(true);
      expect(email?.touched).toBe(true);
    });

    it('deve chamar register quando o formulário for válido', () => {
      const mockResponse = {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User'
        },
        access: 'access_token',
        refresh: 'refresh_token'
      };

      authService.register.and.returnValue(of(mockResponse));

      component.registerForm.patchValue({
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        confirmPassword: 'password123'
      });

      component.onSubmit();

      expect(authService.register).toHaveBeenCalledWith(
        'testuser',
        'test@example.com',
        'Test',
        'User',
        'password123'
      );
      expect(component.loading).toBe(false);
    });

    it('deve definir loading como true durante o registro', () => {
      const mockResponse = {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User'
        },
        access: 'access_token',
        refresh: 'refresh_token'
      };

      authService.register.and.returnValue(of(mockResponse));

      component.registerForm.patchValue({
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        confirmPassword: 'password123'
      });

      component.onSubmit();

      // Loading deve ser false após o sucesso
      expect(component.loading).toBe(false);
    });

    it('deve exibir mensagem de sucesso e redirecionar após registro bem-sucedido', (done) => {
      const mockResponse = {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User'
        },
        access: 'access_token',
        refresh: 'refresh_token'
      };

      authService.register.and.returnValue(of(mockResponse));
      jasmine.clock().install();

      component.registerForm.patchValue({
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        confirmPassword: 'password123'
      });

      component.onSubmit();

      expect(component.successMessage).toBe('Conta criada com sucesso! Você será redirecionado...');
      expect(component.errorMessage).toBeNull();
      expect(cdr.markForCheck).toHaveBeenCalled();

      jasmine.clock().tick(1500);

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);

      jasmine.clock().uninstall();
      done();
    });

    it('deve tratar erro ao registrar', () => {
      const error = new Error('Erro ao registrar usuário');
      authService.register.and.returnValue(throwError(() => error));

      component.registerForm.patchValue({
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        confirmPassword: 'password123'
      });

      component.onSubmit();

      expect(component.loading).toBe(false);
      expect(component.errorMessage).toBe('Erro ao registrar usuário');
      expect(component.successMessage).toBeNull();
      expect(cdr.markForCheck).toHaveBeenCalled();
    });
  });

  describe('Getters de controles do formulário', () => {
    it('deve retornar controle username', () => {
      expect(component.username).toBe(component.registerForm.get('username'));
    });

    it('deve retornar controle email', () => {
      expect(component.email).toBe(component.registerForm.get('email'));
    });

    it('deve retornar controle firstName', () => {
      expect(component.firstName).toBe(component.registerForm.get('firstName'));
    });

    it('deve retornar controle lastName', () => {
      expect(component.lastName).toBe(component.registerForm.get('lastName'));
    });

    it('deve retornar controle password', () => {
      expect(component.password).toBe(component.registerForm.get('password'));
    });

    it('deve retornar controle confirmPassword', () => {
      expect(component.confirmPassword).toBe(component.registerForm.get('confirmPassword'));
    });
  });
});

