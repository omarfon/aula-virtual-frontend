import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.currentUserValue;

  if (!usuario) {
    router.navigate(['/home']);
    return false;
  }

  const rolesAdmin = ['admin', 'administrador', 'superadmin', 'coordinador'];
  const rolUsuario = usuario.rol?.toLowerCase() || '';

  if (rolesAdmin.includes(rolUsuario)) {
    return true;
  }

  router.navigate(['/home']);
  return false;
};
