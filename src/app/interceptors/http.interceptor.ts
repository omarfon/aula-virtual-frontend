import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const token = localStorage.getItem('accessToken');
  if (token && authService.isAuthenticated()) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const clonedRequest = req.clone({
    setHeaders: headers
  });

  // Continuar con la petición
  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error desconocido';

      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente
        errorMessage = `Error del cliente: ${error.error.message}`;
      } else {
        // Error del lado del servidor
        errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
        
        // Manejar errores específicos
        switch (error.status) {
          case 400:
            errorMessage = 'Solicitud incorrecta. Verifica los datos enviados.';
            break;
          case 401:
            errorMessage = 'No autorizado. Por favor, inicia sesión.';
            break;
          case 403:
            errorMessage = 'Acceso prohibido. No tienes permisos para esta acción.';
            break;
          case 404:
            errorMessage = 'Recurso no encontrado.';
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Intenta más tarde.';
            break;
          case 0:
            errorMessage = 'No se puede conectar al servidor. Verifica tu conexión.';
            break;
        }

        // Si el backend envía un mensaje específico
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
      }

      console.error('Error HTTP:', errorMessage);
      return throwError(() => new Error(errorMessage));
    })
  );
};
