import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./devices-list.component').then(m => m.DevicesListComponent)
  }
];

