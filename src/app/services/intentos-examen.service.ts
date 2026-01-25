import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface IniciarIntentoDto {
  respuestas?: any[];
}

export interface EntregarIntentoDto {
  respuestas: any[];
  tiempoEmpleado?: number;
}

export interface CalificarIntentoDto {
  calificacion: number;
  retroalimentacion?: string;
}

export interface IntentoExamen {
  id: string;
  examenAlumno: any;
  numeroIntento: number;
  fechaInicio: string;
  fechaEntrega?: string;
  estado: 'en-progreso' | 'entregado' | 'calificado' | 'abandonado';
  respuestas: any[];
  calificacion?: number;
  retroalimentacion?: string;
  tiempoEmpleado?: number;
  createdAt: string;
  updatedAt: string;
  archivoAdjunto?: string;
  comentarioAlumno?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IntentosExamenService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Iniciar un nuevo intento de examen
   * POST /examenes/examenes-alumno/:examenAlumnoId/intentos
   */
  iniciarIntento(examenAlumnoId: string, data?: IniciarIntentoDto): Observable<IntentoExamen> {
    const url = `${this.apiUrl}/examenes/examenes-alumno/${examenAlumnoId}/intentos`;
    return this.http.post<IntentoExamen>(url, data || {}).pipe(
      catchError(error => this.handleError(error, 'iniciar intento'))
    );
  }

  /**
   * Entregar un intento de examen
   * POST /examenes/intentos/:intentoId/entregar
   */
  entregarIntento(intentoId: string, data: EntregarIntentoDto): Observable<IntentoExamen> {
    const url = `${this.apiUrl}/examenes/intentos/${intentoId}/entregar`;
    return this.http.post<IntentoExamen>(url, data).pipe(
      catchError(error => this.handleError(error, 'entregar intento'))
    );
  }

  /**
   * Calificar un intento (solo profesor)
   * PATCH /examenes/intentos/:intentoId/calificar
   */
  calificarIntento(intentoId: string, data: CalificarIntentoDto): Observable<IntentoExamen> {
    const url = `${this.apiUrl}/examenes/intentos/${intentoId}/calificar`;
    return this.http.patch<IntentoExamen>(url, data).pipe(
      catchError(error => this.handleError(error, 'calificar intento'))
    );
  }

  /**
   * Listar todos los intentos de un examen alumno
   * GET /examenes/examenes-alumno/:examenAlumnoId/intentos
   */
  listarIntentos(examenAlumnoId: string): Observable<IntentoExamen[]> {
    const url = `${this.apiUrl}/examenes/examenes-alumno/${examenAlumnoId}/intentos`;
    return this.http.get<IntentoExamen[]>(url).pipe(
      catchError(error => this.handleError(error, 'listar intentos'))
    );
  }

  /**
   * Listar intentos para corrección (vista docente)
   * GET /examenes/intentos
   */
  listarIntentosCorreccion(filtros?: { estado?: string; cursoId?: string; examenId?: string; alumnoId?: string; }): Observable<IntentoExamen[]> {
    const url = `${this.apiUrl}/examenes/intentos`;
    let params = new HttpParams();

    if (filtros) {
      Object.entries(filtros).forEach(([clave, valor]) => {
        if (valor) {
          params = params.set(clave, valor);
        }
      });
    }

    return this.http.get<IntentoExamen[]>(url, { params }).pipe(
      catchError(error => this.handleError(error, 'listar intentos para corrección'))
    );
  }

  /**
   * Obtener detalle de un intento específico
   * GET /examenes/intentos/:intentoId
   */
  obtenerIntento(intentoId: string): Observable<IntentoExamen> {
    const url = `${this.apiUrl}/examenes/intentos/${intentoId}`;
    return this.http.get<IntentoExamen>(url).pipe(
      catchError(error => this.handleError(error, 'obtener intento'))
    );
  }

  /**
   * Abandonar un intento en progreso
   * PATCH /examenes/intentos/:intentoId/abandonar
   */
  abandonarIntento(intentoId: string): Observable<IntentoExamen> {
    const url = `${this.apiUrl}/examenes/intentos/${intentoId}/abandonar`;
    return this.http.patch<IntentoExamen>(url, {}).pipe(
      catchError(error => this.handleError(error, 'abandonar intento'))
    );
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: any, action: string): Observable<never> {
    let errorMessage = `Error al ${action}`;
    
    // Mensaje específico para 404
    if (error.status === 404) {
      errorMessage = '⚠️ Asignación de examen no encontrada. El examen no está asignado al alumno en la base de datos. Contacta al profesor.';
    } else if (error.error?.message) {
      errorMessage = Array.isArray(error.error.message)
        ? error.error.message.join(', ')
        : error.error.message;
    } else if (Array.isArray(error.error)) {
      errorMessage = error.error.join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error(`❌ ${action}:`, error);
    console.error('📊 Estado HTTP:', error.status);
    console.error('📋 URL solicitada:', error.url);
    return throwError(() => new Error(errorMessage));
  }
}
