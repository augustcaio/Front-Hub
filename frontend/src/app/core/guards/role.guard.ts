import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function roleGuard(allowedRoles: Array<'admin' | 'operator' | 'visitor'>): CanActivateFn {
  return (): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = (localStorage.getItem('user_role') as 'admin' | 'operator' | 'visitor' | null) || null;
    // Admin tem acesso total
    if (role === 'admin') {
      return true;
    }
    if (role && allowedRoles.includes(role)) {
      return true;
    }
    return router.parseUrl('/dashboard');
  };
}


