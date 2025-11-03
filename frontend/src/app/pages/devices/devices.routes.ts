import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./devices-list.component').then(m => m.DevicesListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./device-form.component').then(m => m.DeviceFormComponent),
    canActivate: [() => import('../../core/guards/role.guard').then(m => m.roleGuard(['admin']))]
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./device-form.component').then(m => m.DeviceFormComponent),
    canActivate: [() => import('../../core/guards/role.guard').then(m => m.roleGuard(['admin']))]
  },
  {
    path: ':id',
    loadComponent: () => import('./device-detail.component').then(m => m.DeviceDetailComponent)
  },
  {
    path: ':public_id/limits',
    loadComponent: () => import('./device-threshold.component').then(m => m.DeviceThresholdComponent),
    canActivate: [() => import('../../core/guards/role.guard').then(m => m.roleGuard(['admin']))]
  }
];
