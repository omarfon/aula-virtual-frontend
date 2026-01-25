import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Contenido, CreateContenidoDto, UpdateContenidoDto } from '../models/curso.model';

/**
 * Servicio para gestionar contenidos dentro de temas
 * Maneja operaciones CRUD para contenidos con rutas anidadas:
 * /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos
 */
@Injectable({
  providedIn: 'root'
})
export class ContenidosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cursos`;

  /**
   * Obtiene todos los contenidos de un tema
   * GET /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos
   */
  getContenidosByTema(cursoId: string, unidadId: string, temaId: string): Observable<Contenido[]> {
    const url = `${this.apiUrl}/${cursoId}/unidades/${unidadId}/temas/${temaId}/contenidos`;
    return this.http.get<Contenido[]>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene un contenido específico por ID
   * GET /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos/:contenidoId
   */
  getContenidoById(cursoId: string, unidadId: string, temaId: string, contenidoId: string): Observable<Contenido> {
    const url = `${this.apiUrl}/${cursoId}/unidades/${unidadId}/temas/${temaId}/contenidos/${contenidoId}`;
    return this.http.get<Contenido>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Crea un nuevo contenido en un tema
   * POST /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos
   */
  createContenido(cursoId: string, unidadId: string, temaId: string, dto: CreateContenidoDto): Observable<Contenido> {
    const url = `${this.apiUrl}/${cursoId}/unidades/${unidadId}/temas/${temaId}/contenidos`;
    return this.http.post<Contenido>(url, dto).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Actualiza completamente un contenido existente
   * PUT /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos/:contenidoId
   */
  updateContenido(
    cursoId: string, 
    unidadId: string, 
    temaId: string, 
    contenidoId: string, 
    dto: CreateContenidoDto
  ): Observable<Contenido> {
    const url = `${this.apiUrl}/${cursoId}/unidades/${unidadId}/temas/${temaId}/contenidos/${contenidoId}`;
    return this.http.put<Contenido>(url, dto).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Actualiza parcialmente un contenido existente
   * PATCH /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos/:contenidoId
   */
  patchContenido(
    cursoId: string, 
    unidadId: string, 
    temaId: string, 
    contenidoId: string, 
    dto: Partial<CreateContenidoDto>
  ): Observable<Contenido> {
    const url = `${this.apiUrl}/${cursoId}/unidades/${unidadId}/temas/${temaId}/contenidos/${contenidoId}`;
    return this.http.patch<Contenido>(url, dto).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Elimina un contenido
   * DELETE /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos/:contenidoId
   */
  deleteContenido(cursoId: string, unidadId: string, temaId: string, contenidoId: string): Observable<void> {
    const url = `${this.apiUrl}/${cursoId}/unidades/${unidadId}/temas/${temaId}/contenidos/${contenidoId}`;
    return this.http.delete<void>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Reordena los contenidos dentro de un tema
   * PATCH /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos/reorder
   */
  reorderContenidos(
    cursoId: string, 
    unidadId: string, 
    temaId: string, 
    contenidoIds: string[]
  ): Observable<Contenido[]> {
    const url = `${this.apiUrl}/${cursoId}/unidades/${unidadId}/temas/${temaId}/contenidos/reorder`;
    return this.http.patch<Contenido[]>(url, { contenidoIds }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Maneja errores HTTP
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ocurrió un error al procesar la solicitud';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
    } else if (error.status === 404) {
      errorMessage = 'Contenido no encontrado';
    } else if (error.status === 400) {
      errorMessage = 'Datos de contenido inválidos';
    } else if (error.status === 401) {
      errorMessage = 'No autorizado. Inicia sesión nuevamente.';
    } else if (error.status === 403) {
      errorMessage = 'No tienes permisos para realizar esta acción';
    } else if (error.status === 500) {
      errorMessage = 'Error del servidor. Intenta nuevamente más tarde.';
    }
    
    console.error('❌ Error en ContenidosService:', error);
    return throwError(() => ({ message: errorMessage }));
  }
}
