import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function roleGuard(allowedRoles: Array<'admin' | 'operator' | 'visitor'>): CanActivateFn {
  return (): boolean | UrlTree => {
    // Fase pausada: sempre permitir acesso
    return true;
  };
}


