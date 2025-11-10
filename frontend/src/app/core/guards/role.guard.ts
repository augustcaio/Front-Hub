import { CanActivateFn, UrlTree } from '@angular/router';

export function roleGuard(_allowedRoles: ('admin' | 'operator' | 'visitor')[]): CanActivateFn {
  return (): boolean | UrlTree => {
    // Fase pausada: sempre permitir acesso
    return true;
  };
}


