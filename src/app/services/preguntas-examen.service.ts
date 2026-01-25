import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PreguntaExamen, CreatePreguntaExamenDto, UpdatePreguntaExamenDto } from '../models/curso.model';

/**
 * Servicio para gestionar preguntas dentro de exámenes
 * Maneja operaciones CRUD para preguntas de examen con rutas anidadas:
 * /api/cursos/:cursoId/examenes/:examenId/preguntas
 */
@Injectable({
  providedIn: 'root'
})
export class PreguntasExamenService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cursos`;

  /**
   * Obtiene todas las preguntas de un examen
   * GET /api/cursos/:cursoId/examenes/:examenId/preguntas
   */
  getPreguntasByExamen(cursoId: string, examenId: string): Observable<PreguntaExamen[]> {
    const url = `${this.apiUrl}/${cursoId}/examenes/${examenId}/preguntas`;
    return this.http.get<PreguntaExamen[]>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene una pregunta específica por ID
   * GET /api/cursos/:cursoId/examenes/:examenId/preguntas/:preguntaId
   */
  getPreguntaById(cursoId: string, examenId: string, preguntaId: string): Observable<PreguntaExamen> {
    const url = `${this.apiUrl}/${cursoId}/examenes/${examenId}/preguntas/${preguntaId}`;
    return this.http.get<PreguntaExamen>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Crea una nueva pregunta en un examen
   * POST /api/cursos/:cursoId/examenes/:examenId/preguntas
   */
  createPregunta(cursoId: string, examenId: string, dto: CreatePreguntaExamenDto): Observable<PreguntaExamen> {
    const url = `${this.apiUrl}/${cursoId}/examenes/${examenId}/preguntas`;
    return this.http.post<PreguntaExamen>(url, dto).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Actualiza completamente una pregunta existente
   * PUT /api/cursos/:cursoId/examenes/:examenId/preguntas/:preguntaId
   */
  updatePregunta(
    cursoId: string, 
    examenId: string, 
    preguntaId: string, 
    dto: CreatePreguntaExamenDto
  ): Observable<PreguntaExamen> {
    const url = `${this.apiUrl}/${cursoId}/examenes/${examenId}/preguntas/${preguntaId}`;
    return this.http.put<PreguntaExamen>(url, dto).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Actualiza parcialmente una pregunta existente
   * PATCH /api/cursos/:cursoId/examenes/:examenId/preguntas/:preguntaId
   */
  patchPregunta(
    cursoId: string, 
    examenId: string, 
    preguntaId: string, 
    dto: Partial<CreatePreguntaExamenDto>
  ): Observable<PreguntaExamen> {
    const url = `${this.apiUrl}/${cursoId}/examenes/${examenId}/preguntas/${preguntaId}`;
    return this.http.patch<PreguntaExamen>(url, dto).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Elimina una pregunta
   * DELETE /api/cursos/:cursoId/examenes/:examenId/preguntas/:preguntaId
   */
  deletePregunta(cursoId: string, examenId: string, preguntaId: string): Observable<void> {
    const url = `${this.apiUrl}/${cursoId}/examenes/${examenId}/preguntas/${preguntaId}`;
    return this.http.delete<void>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Reordena las preguntas dentro de un examen
   * PATCH /api/cursos/:cursoId/examenes/:examenId/preguntas/reorder
   */
  reorderPreguntas(
    cursoId: string, 
    examenId: string, 
    preguntaIds: string[]
  ): Observable<PreguntaExamen[]> {
    const url = `${this.apiUrl}/${cursoId}/examenes/${examenId}/preguntas/reorder`;
    return this.http.patch<PreguntaExamen[]>(url, { preguntaIds }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Valida las respuestas de una pregunta específica
   * POST /api/cursos/:cursoId/examenes/:examenId/preguntas/:preguntaId/validar
   */
  validarRespuesta(
    cursoId: string, 
    examenId: string, 
    preguntaId: string, 
    respuestaSeleccionada: number
  ): Observable<{ correcta: boolean; respuestaCorrecta: number }> {
    const url = `${this.apiUrl}/${cursoId}/examenes/${examenId}/preguntas/${preguntaId}/validar`;
    return this.http.post<{ correcta: boolean; respuestaCorrecta: number }>(
      url, 
      { respuestaSeleccionada }
    ).pipe(
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
      errorMessage = 'Pregunta no encontrada';
    } else if (error.status === 400) {
      errorMessage = 'Datos de pregunta inválidos. Verifica que todos los campos requeridos estén completos.';
    } else if (error.status === 401) {
      errorMessage = 'No autorizado. Inicia sesión nuevamente.';
    } else if (error.status === 403) {
      errorMessage = 'No tienes permisos para realizar esta acción';
    } else if (error.status === 500) {
      errorMessage = 'Error del servidor. Intenta nuevamente más tarde.';
    }
    
    console.error('❌ Error en PreguntasExamenService:', error);
    return throwError(() => ({ message: errorMessage }));
  }
}
