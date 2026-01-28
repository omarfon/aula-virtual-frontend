import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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

export interface EntregaDocenteFiltro {
  cursoId?: string;
  examenId?: string;
  estado?: 'pendiente' | 'en-revision' | 'corregido' | 'todos';
  busqueda?: string;
}

export interface EntregaDocenteResumen {
  examenAlumnoId: string;
  intentoId?: string;
  alumnoId?: string;
  alumnoNombre?: string;
  alumnoEmail?: string;
  cursoId?: string;
  cursoNombre?: string;
  examenId?: string;
  examenTitulo?: string;
  estado?: 'pendiente' | 'en-revision' | 'corregido';
  fechaEntrega?: string;
  numeroIntento?: number;
  tiempoEmpleado?: number;
  calificacion?: number;
  puntajeTotal?: number;
  porcentaje?: number;
  retroalimentacionGeneral?: string;
  corregidoPor?: string;
  fechaCorreccion?: string;
  respuestas?: any[];
  [key: string]: unknown;
}

export interface EntregasDocenteResponse {
  entregas?: EntregaDocenteResumen[];
  data?: EntregaDocenteResumen[];
  items?: EntregaDocenteResumen[];
  results?: EntregaDocenteResumen[];
  lista?: EntregaDocenteResumen[];
  records?: EntregaDocenteResumen[];
  estadisticas?: Record<string, unknown>;
  resumen?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  filtros?: Record<string, unknown>;
  opciones?: Record<string, unknown>;
  cursos?: Array<Record<string, unknown>>;
  examenes?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class IntentosExamenService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly entregasDocentePaths = [
    '/examenes/docentes/examenes-alumnos',
    '/examenes/docentes/entregas',
    '/docentes/examenes/entregas',
    '/docentes/entregas',
    '/examenes/docente/entregas'
  ];

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
   * Listar entregas para corrección (vista docente)
  * Prueba rutas docentes conocidas (/examenes/docentes/examenes-alumnos, /examenes/docentes/entregas, ...)
   */
  listarIntentosCorreccion(filtros?: EntregaDocenteFiltro): Observable<EntregasDocenteResponse> {
    let params = new HttpParams();

    if (filtros) {
      Object.entries(filtros).forEach(([clave, valor]) => {
        if (valor !== undefined && valor !== null && `${valor}`.trim() !== '') {
          params = params.set(clave, `${valor}`.trim());
        }
      });
    }

    return this.solicitarEntregasDocente(params);
  }

  /**
   * Actualiza la corrección de una entrega docente
  * Prueba rutas docentes conocidas (/examenes/docentes/examenes-alumnos/:id?, /examenes/docentes/entregas/:id, ...)
   */
  actualizarEntregaDocente(examenAlumnoId: string, data: Record<string, unknown>): Observable<any> {
    return this.enviarCorreccionDocente(examenAlumnoId, data);
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

  private solicitarEntregasDocente(params: HttpParams, indice = 0, ultimoError?: any): Observable<EntregasDocenteResponse> {
    if (indice >= this.entregasDocentePaths.length) {
      return this.handleError(
        ultimoError ?? {
          status: 404,
          message: 'No se encontraron endpoints disponibles para listar entregas de exámenes.',
          url: `${this.apiUrl}${this.entregasDocentePaths[this.entregasDocentePaths.length - 1]}`
        },
        'listar entregas para corrección'
      );
    }

    const url = `${this.apiUrl}${this.entregasDocentePaths[indice]}`;

    return this.http.get<EntregasDocenteResponse>(url, { params }).pipe(
      map((response) => response ?? {}),
      catchError(error => {
        if (error.status === 404 && indice < this.entregasDocentePaths.length - 1) {
          console.warn(`[IntentosExamenService] Endpoint ${url} no encontrado (404). Probando ruta alternativa...`);
          return this.solicitarEntregasDocente(params, indice + 1, error);
        }
        return this.handleError(error, 'listar entregas para corrección');
      })
    );
  }

  private enviarCorreccionDocente(examenAlumnoId: string, data: Record<string, unknown>, indice = 0, ultimoError?: any): Observable<any> {
    if (indice >= this.entregasDocentePaths.length) {
      return this.handleError(
        ultimoError ?? {
          status: 404,
          message: 'No se encontraron endpoints disponibles para actualizar la corrección del examen.',
          url: `${this.apiUrl}${this.entregasDocentePaths[this.entregasDocentePaths.length - 1]}/${encodeURIComponent(examenAlumnoId)}`
        },
        'actualizar entrega docente'
      );
    }

    const basePath = this.entregasDocentePaths[indice];
    if (basePath.includes('examenes-alumnos')) {
      return this.enviarCorreccionDocente(examenAlumnoId, data, indice + 1, ultimoError);
    }

    const url = `${this.apiUrl}${basePath}/${encodeURIComponent(examenAlumnoId)}`;

    return this.http.patch<any>(url, data).pipe(
      catchError(error => {
        if (error.status === 404 && indice < this.entregasDocentePaths.length - 1) {
          console.warn(`[IntentosExamenService] Endpoint ${url} no encontrado (404). Probando ruta alternativa...`);
          return this.enviarCorreccionDocente(examenAlumnoId, data, indice + 1, error);
        }
        return this.handleError(error, 'actualizar entrega docente');
      })
    );
  }
}
