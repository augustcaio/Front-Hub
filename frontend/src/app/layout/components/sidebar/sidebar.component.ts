import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MenuModule, SidebarModule, ButtonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  sidebarVisible = false;

  // Método público para ser chamado externamente
  openSidebar(): void {
    this.sidebarVisible = true;
    this.cdr.markForCheck();
  }

  readonly menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/dashboard',
      command: () => {
        this.sidebarVisible = false;
      }
    },
    {
      label: 'Dispositivos',
      icon: 'pi pi-desktop',
      routerLink: '/devices',
      command: () => {
        this.sidebarVisible = false;
      }
    }
  ];

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
    this.cdr.markForCheck();
  }

  closeSidebar(): void {
    this.sidebarVisible = false;
    this.cdr.markForCheck();
  }
}

