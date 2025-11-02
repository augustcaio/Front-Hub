import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./devices-list.component').then(m => m.DevicesListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./device-detail.component').then(m => m.DeviceDetailComponent)
  }
];
