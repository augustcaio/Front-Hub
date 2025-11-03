import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Output, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MenubarModule, ButtonModule],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  
  @Output() menuToggle = new EventEmitter<void>();

  isAccountMenuOpen = false;

  readonly menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/dashboard'
    },
    {
      label: 'Dispositivos',
      icon: 'pi pi-desktop',
      routerLink: '/devices'
    }
  ];

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
  }
}

