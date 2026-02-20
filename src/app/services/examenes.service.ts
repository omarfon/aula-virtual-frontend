import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Examen, CreateExamenDto, UpdateExamenDto } from '../models/curso.model';

/**
 * Servicio para gestionar exámenes dentro de cursos
 * Maneja operaciones CRUD para exámenes con rutas anidadas:
 * /api/cursos/:cursoId/examenes
 */
@Injectable({
  providedIn: 'root'
})
export class ExamenesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cursos`;

  /**
   * Obtiene todos los exámenes de un curso
   * GET /api/cursos/:cursoId/examenes
   */
  getExamenesByCurso(cursoId: string): Observable<Examen[]> {
    const url = `${this.apiUrl}/${cursoId}/examenes`;
    return this.http.get<Examen[]>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene un examen específico por ID
   * GET /api/cursos/:cursoId/examenes/:examenId
   */
  getExamenById(cursoId: string, examenId: string): Observable<Examen> {
    const url = `${this.apiUrl}/${cursoId}/examenes/${examenId}`;
    return this.http.get<Examen>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Crea un nuevo examen en un curso
   * POST /api/cursos/:cursoId/examenes
   */
  createExamen(cursoId: string, dto: CreateExamenDto): Observable<Examen> {
    const url = `${this.apiUrl}/${cursoId}/examenes`;
    return this.http.post<Examen>(url, dto).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Actualiza completamente un examen existente
   * PUT /api/cursos/:cursoId/examenes/:examenId
   */
  updateExamen(cursoId: string, examenId: string, dto: CreateExamenDto): Observable<Examen> {
    const url = `${this.apiUrl}/${cursoId}/examenes/${examenId}`;
    return this.http.put<Examen>(url, dto).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Actualiza parcialmente un examen existente
   * PATCH /api/cursos/:cursoId/examenes/:examenId
   */
  patchExamen(cursoId: string, examenId: string, dto: Partial<CreateExamenDto>): Observable<Examen> {
    const url = `${this.apiUrl}/${cursoId}/examenes/${examenId}`;
    return this.http.patch<Examen>(url, dto).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Elimina un examen
   * DELETE /api/cursos/:cursoId/examenes/:examenId
   */
  deleteExamen(cursoId: string, examenId: string): Observable<void> {
    const url = `${this.apiUrl}/${cursoId}/examenes/${examenId}`;
    return this.http.delete<void>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene las estadísticas de un examen
   * GET /api/cursos/:cursoId/examenes/:examenId/estadisticas
   */
  getEstadisticasExamen(cursoId: string, examenId: string): Observable<any> {
    const url = `${this.apiUrl}/${cursoId}/examenes/${examenId}/estadisticas`;
    return this.http.get<any>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Califica un examen automáticamente
   * POST /api/cursos/:cursoId/examenes/:examenId/calificar
   */
  calificarExamen(cursoId: string, examenId: string, respuestas: any): Observable<any> {
    const url = `${this.apiUrl}/${cursoId}/examenes/${examenId}/calificar`;
    return this.http.post<any>(url, { respuestas }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene todos los exámenes asignados a un alumno
   * GET /api/examenes/alumnos/:alumnoId/mis-examenes
   */
  getMisExamenes(alumnoId: string): Observable<any[]> {
    const url = `${environment.apiUrl}/examenes/alumnos/${alumnoId}/mis-examenes`;
    console.log('🌐 Llamando a backend:', url);
    return this.http.get<any[]>(url).pipe(
      tap(response => {
        console.log('📡 Respuesta cruda del backend getMisExamenes:', response);
        if (response && response.length > 0) {
          console.log('📋 Primer registro:', response[0]);
          console.log('🔑 Campos del primer registro:', Object.keys(response[0]));
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene un examen alumno específico
   * GET /api/examenes/examenes-alumno/:examenAlumnoId
   */
  getExamenAlumno(examenAlumnoId: string): Observable<any> {
    const url = `${environment.apiUrl}/examenes/examenes-alumno/${examenAlumnoId}`;
    return this.http.get<any>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene las preguntas de un examen con respuestas correctas
   * GET /api/examenes/examenes/:examenId/preguntas
   * NOTA: El endpoint público NO incluye respuestaCorrecta para evitar que alumnos vean las soluciones
   * Este método es para uso administrativo o después de finalizar el examen
   */
  getPreguntasExamen(examenId: string): Observable<any[]> {
    const url = `${environment.apiUrl}/examenes/examenes/${examenId}/preguntas`;
    return this.http.get<any[]>(url).pipe(
      tap(response => {
        console.log('📋 Preguntas del examen obtenidas:', response?.length || 0);
        if (response && response.length > 0) {
          console.log('🔑 Campos de la primera pregunta:', Object.keys(response[0]));
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene un examen completo por ID (ruta directa)
   * GET /api/examenes/examenes/:examenId
   * Útil para obtener información del examen sin necesitar el cursoId
   */
  getExamen(examenId: string): Observable<any> {
    const url = `${environment.apiUrl}/examenes/examenes/${examenId}`;
    return this.http.get<any>(url).pipe(
      tap(response => {
        console.log('📝 Examen obtenido:', response?.id);
        if (response) {
          console.log('🔑 Campos del examen:', Object.keys(response));
        }
      }),
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
      errorMessage = 'Examen no encontrado';
    } else if (error.status === 400) {
      errorMessage = 'Datos de examen inválidos';
    } else if (error.status === 401) {
      errorMessage = 'No autorizado. Inicia sesión nuevamente.';
    } else if (error.status === 403) {
      errorMessage = 'No tienes permisos para realizar esta acción';
    } else if (error.status === 500) {
      errorMessage = 'Error del servidor. Intenta nuevamente más tarde.';
    }
    
    console.error('❌ Error en ExamenesService:', error);
    return throwError(() => ({ message: errorMessage }));
  }
}
