import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';
import { Language, LanguageService } from '../../../core/services/language.service';

class TranslateServiceStub {
  currentLang = 'pt-BR';
  onLangChange = new Subject<{ lang: string }>();
  private readonly translations: Record<string, string> = {
    'menu.dashboard': 'Dashboard',
    'menu.devices': 'Dispositivos',
    'menu.categories': 'Categorias'
  };

  setDefaultLang(lang: string) {
    this.currentLang = lang;
  }

  use(lang: string) {
    this.currentLang = lang;
    this.onLangChange.next({ lang });
    return of(lang);
  }

  get(key: string | string[]) {
    if (Array.isArray(key)) {
      const result: Record<string, string> = {};
      key.forEach((k) => {
        result[k] = this.translations[k] ?? k;
      });
      return of(result);
    }
    return of(this.translations[key] ?? key);
  }

  instant(key: string) {
    return this.translations[key] ?? key;
  }
}

class LanguageServiceStub {
  private currentLanguage: Language = 'pt-BR';

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  getSupportedLanguages(): Language[] {
    return ['pt-BR', 'en-US'];
  }

  getLanguageDisplayName(language: Language): string {
    const names: Record<Language, string> = {
      'pt-BR': 'Português (Brasil)',
      'en-US': 'English (US)'
    };
    return names[language];
  }

  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TranslateService, useClass: TranslateServiceStub },
        { provide: LanguageService, useClass: LanguageServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
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
    });
  });

  describe('toggleAccountMenu', () => {
    it('deve alternar o estado de isAccountMenuOpen de false para true', () => {
      component.isAccountMenuOpen = false;

      component.toggleAccountMenu();

      expect(component.isAccountMenuOpen).toBe(true);
    });

    it('deve alternar o estado de isAccountMenuOpen de true para false', () => {
      component.isAccountMenuOpen = true;

      component.toggleAccountMenu();

      expect(component.isAccountMenuOpen).toBe(false);
    });
  });

  describe('closeAccountMenu', () => {
    it('deve fechar o menu de conta', () => {
      component.isAccountMenuOpen = true;

      component.closeAccountMenu();

      expect(component.isAccountMenuOpen).toBe(false);
    });
  });

  describe('navigateToAccountDetails', () => {
    it('deve fechar o menu ao navegar', () => {
      component.isAccountMenuOpen = true;

      component.navigateToAccountDetails();

      expect(component.isAccountMenuOpen).toBe(false);
    });
  });

  describe('onLogout', () => {
    it('deve fechar o menu e chamar logout do AuthService', () => {
      component.isAccountMenuOpen = true;

      component.onLogout();

      expect(component.isAccountMenuOpen).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
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
      expect(component.menuItems.length).toBe(3);
      expect(component.menuItems[0].label).toBe('Dashboard');
      expect(component.menuItems[0].routerLink).toBe('/dashboard');
      expect(component.menuItems[1].label).toBe('Dispositivos');
      expect(component.menuItems[1].routerLink).toBe('/devices');
      expect(component.menuItems[2].label).toBe('Categorias');
      expect(component.menuItems[2].routerLink).toBe('/categories');
    });
  });
});

