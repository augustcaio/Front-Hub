import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Output, inject, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService, Language } from '../../../core/services/language.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, MenubarModule, ButtonModule],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);
  
  @Output() menuToggle = new EventEmitter<void>();

  isAccountMenuOpen = false;
  isLanguageMenuOpen = false;
  currentLanguage: Language = 'pt-BR';
  languageOptions: { label: string; value: Language; flag?: string }[] = [];

  menuItems: MenuItem[] = [];

  ngOnInit(): void {
    this.currentLanguage = this.languageService.getCurrentLanguage();
    this.languageOptions = this.languageService.getSupportedLanguages().map(lang => ({
      label: this.languageService.getLanguageDisplayName(lang),
      value: lang,
      flag: lang === 'pt-BR' ? '🇧🇷' : '🇺🇸'
    }));
    
    this.updateMenuItems();
    
    // Subscribe to language changes
    this.translate.onLangChange.subscribe(() => {
      this.updateMenuItems();
      this.cdr.markForCheck();
    });
  }

  get currentLanguageLabel(): string {
    return this.currentLanguage.toUpperCase();
  }

  get currentLanguageFlag(): string {
    const option = this.languageOptions.find(opt => opt.value === this.currentLanguage);
    return option ? option.flag || '🌐' : '🌐';
  }

  private updateMenuItems(): void {
    this.translate.get(['menu.dashboard', 'menu.devices', 'menu.categories']).subscribe(translations => {
      this.menuItems = [
        {
          label: translations['menu.dashboard'],
          icon: 'pi pi-home',
          routerLink: '/dashboard'
        },
        {
          label: translations['menu.devices'],
          icon: 'pi pi-desktop',
          routerLink: '/devices'
        },
        {
          label: translations['menu.categories'],
          icon: 'pi pi-tags',
          routerLink: '/categories'
        }
      ];
      this.cdr.markForCheck();
    });
  }

  onLanguageChange(language: Language): void {
    this.languageService.setLanguage(language);
    this.currentLanguage = language;
    this.closeLanguageMenu();
    this.cdr.markForCheck();
  }

  toggleLanguageMenu(): void {
    this.isLanguageMenuOpen = !this.isLanguageMenuOpen;
    this.cdr.markForCheck();
  }

  closeLanguageMenu(): void {
    this.isLanguageMenuOpen = false;
    this.cdr.markForCheck();
  }

  onMenuClick(): void {
    this.menuToggle.emit();
    this.cdr.markForCheck();
  }

  toggleAccountMenu(): void {
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
    this.cdr.markForCheck();
  }

  closeAccountMenu(): void {
    this.isAccountMenuOpen = false;
    this.cdr.markForCheck();
  }

  navigateToAccountDetails(): void {
    this.closeAccountMenu();
    // A navegação será feita via routerLink no template
  }

  onLogout(): void {
    this.closeAccountMenu();
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.account-menu-container')) {
      this.closeAccountMenu();
    }
    if (!target.closest('.language-menu-container')) {
      this.closeLanguageMenu();
    }
  }
}

