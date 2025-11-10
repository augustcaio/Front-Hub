import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ChangeDetectorRef, useValue: cdrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    cdr = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('@Output() menuToggle', () => {
    it('deve emitir evento quando onMenuClick é chamado', () => {
      spyOn(component.menuToggle, 'emit');

      component.onMenuClick();

      expect(component.menuToggle.emit).toHaveBeenCalled();
      expect(cdr.markForCheck).toHaveBeenCalled();
    });
  });

  describe('toggleAccountMenu', () => {
    it('deve alternar o estado de isAccountMenuOpen de false para true', () => {
      component.isAccountMenuOpen = false;

      component.toggleAccountMenu();

      expect(component.isAccountMenuOpen).toBe(true);
      expect(cdr.markForCheck).toHaveBeenCalled();
    });

    it('deve alternar o estado de isAccountMenuOpen de true para false', () => {
      component.isAccountMenuOpen = true;

      component.toggleAccountMenu();

      expect(component.isAccountMenuOpen).toBe(false);
      expect(cdr.markForCheck).toHaveBeenCalled();
    });
  });

  describe('closeAccountMenu', () => {
    it('deve fechar o menu de conta', () => {
      component.isAccountMenuOpen = true;

      component.closeAccountMenu();

      expect(component.isAccountMenuOpen).toBe(false);
      expect(cdr.markForCheck).toHaveBeenCalled();
    });
  });

  describe('navigateToAccountDetails', () => {
    it('deve fechar o menu ao navegar', () => {
      component.isAccountMenuOpen = true;

      component.navigateToAccountDetails();

      expect(component.isAccountMenuOpen).toBe(false);
      expect(cdr.markForCheck).toHaveBeenCalled();
    });
  });

  describe('onLogout', () => {
    it('deve fechar o menu e chamar logout do AuthService', () => {
      component.isAccountMenuOpen = true;

      component.onLogout();

      expect(component.isAccountMenuOpen).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
      expect(cdr.markForCheck).toHaveBeenCalled();
    });
  });

  describe('@HostListener onDocumentClick', () => {
    it('deve fechar o menu quando clicar fora do container', () => {
      component.isAccountMenuOpen = true;
      const target = document.createElement('div');
      const event = {
        target,
        bubbles: true,
        cancelable: true
      } as unknown as MouseEvent;

      spyOn(target, 'closest').and.returnValue(null);

      component.onDocumentClick(event);

      expect(component.isAccountMenuOpen).toBe(false);
      expect(cdr.markForCheck).toHaveBeenCalled();
    });

    it('não deve fechar o menu quando clicar dentro do container', () => {
      component.isAccountMenuOpen = true;
      const target = document.createElement('div');
      const container = document.createElement('div');
      container.className = 'account-menu-container';
      const event = {
        target,
        bubbles: true,
        cancelable: true
      } as unknown as MouseEvent;

      spyOn(target, 'closest').and.returnValue(container);

      component.onDocumentClick(event);

      expect(component.isAccountMenuOpen).toBe(true);
    });
  });

  describe('menuItems', () => {
    it('deve ter items de menu configurados corretamente', () => {
      expect(component.menuItems.length).toBe(2);
      expect(component.menuItems[0].label).toBe('Dashboard');
      expect(component.menuItems[0].routerLink).toBe('/dashboard');
      expect(component.menuItems[1].label).toBe('Dispositivos');
      expect(component.menuItems[1].routerLink).toBe('/devices');
    });
  });
});

