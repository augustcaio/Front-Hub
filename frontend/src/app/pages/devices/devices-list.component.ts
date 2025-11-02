import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-devices-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="devices-container">
      <h1>Dispositivos</h1>
      <p>Lista de dispositivos será implementada na fase 3.6</p>
    </div>
  `,
  styles: [`
    .devices-container {
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
export class DevicesListComponent {}

