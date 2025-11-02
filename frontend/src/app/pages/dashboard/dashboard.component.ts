import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h1>Dashboard</h1>
      <p>Bem-vindo ao Front-Hub Dashboard</p>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 1rem;
    }

    h1 {
      margin: 0 0 1rem 0;
      color: var(--text-color);
    }

    p {
      color: var(--text-color-secondary);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {}

