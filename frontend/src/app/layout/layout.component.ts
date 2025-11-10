import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent implements AfterViewInit {
  @ViewChild('sidebar', { static: false }) sidebar?: SidebarComponent;

  private readonly cdr = inject(ChangeDetectorRef);

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  onMenuToggle(): void {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
      this.cdr.markForCheck();
    }
  }
}

