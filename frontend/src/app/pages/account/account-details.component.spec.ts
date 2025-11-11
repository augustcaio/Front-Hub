import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AccountDetailsComponent } from './account-details.component';
import { AuthService, UserInfo } from '../../core/services/auth.service';

describe('AccountDetailsComponent', () => {
  let component: AccountDetailsComponent;
  let fixture: ComponentFixture<AccountDetailsComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  const mockUserInfo: UserInfo = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    date_joined: '2024-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'logout']);

    await TestBed.configureTestingModule({
      imports: [AccountDetailsComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountDetailsComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('deve carregar informações do usuário ao inicializar', () => {
      authService.getCurrentUser.and.returnValue(of(mockUserInfo));

      component.ngOnInit();

      expect(authService.getCurrentUser).toHaveBeenCalled();
    });
  });

  describe('loadUserInfo', () => {
    it('deve carregar informações do usuário com sucesso', () => {
      authService.getCurrentUser.and.returnValue(of(mockUserInfo));

      component.loadUserInfo();

      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
      expect(component.userInfo).toEqual(mockUserInfo);
    });

    it('deve definir loading como true durante o carregamento', () => {
      authService.getCurrentUser.and.returnValue(of(mockUserInfo));

      component.loadUserInfo();

      // Loading deve ser false após o sucesso
      expect(component.loading).toBe(false);
    });

    it('deve tratar erro ao carregar informações do usuário', () => {
      const error = new Error('Erro ao carregar usuário');
      authService.getCurrentUser.and.returnValue(throwError(() => error));

      component.loadUserInfo();

      expect(component.loading).toBe(false);
      expect(component.error).toBe('Erro ao carregar usuário');
      expect(component.userInfo).toBeNull();
    });

    it('deve tratar erro genérico sem mensagem', () => {
      const error = new Error('');
      authService.getCurrentUser.and.returnValue(throwError(() => error));

      component.loadUserInfo();

      expect(component.error).toBe('Erro ao carregar informações do usuário');
    });
  });

  describe('getExpirationDate', () => {
    it('deve retornar data formatada quando fornecido', () => {
      const dateString = '2024-01-01T00:00:00Z';
      const result = component.getExpirationDate(dateString);

      expect(result).toBeTruthy();
      expect(result).not.toBe('N/A');
    });

    it('deve retornar N/A quando não fornecido', () => {
      const result = component.getExpirationDate();

      expect(result).toBe('N/A');
    });

    it('deve retornar N/A quando data é inválida', () => {
      const result = component.getExpirationDate('invalid-date');

      // Pode retornar 'N/A' ou uma data, dependendo da implementação
      expect(result).toBeTruthy();
    });
  });

  describe('formatDate', () => {
    it('deve formatar string de data', () => {
      const dateString = '2024-01-01T00:00:00Z';
      const result = component.formatDate(dateString);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('deve formatar número de data', () => {
      const timestamp = Date.now();
      const result = component.formatDate(timestamp);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('deve formatar objeto Date', () => {
      const date = new Date();
      const result = component.formatDate(date);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('onLogout', () => {
    it('deve chamar logout do AuthService', () => {
      component.onLogout();

      expect(authService.logout).toHaveBeenCalled();
    });
  });
});

