import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Tarea, CreateTareaDto, UpdateTareaDto } from '../models/curso.model';

/**
 * Servicio para gestionar tareas dentro de cursos
 * Maneja operaciones CRUD para tareas con rutas anidadas:
 * /api/cursos/:cursoId/tareas
 */
@Injectable({
  providedIn: 'root'
})
export class TareasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cursos`;

  /**
   * Obtiene todas las tareas asignadas a un alumno en un curso
   * GET /api/cursos/:cursoId/tareas-alumno/:alumnoId
   */
  getTareasAlumnoByCurso(cursoId: string, alumnoId: string): Observable<Tarea[]> {
    const url = `${this.apiUrl}/${cursoId}/tareas-alumno/${alumnoId}`;
    console.log(`📝 Solicitando tareas desde: ${url}`);
    return this.http.get<unknown>(url).pipe(
      map(respuesta => this.extraerTareasAlumno(respuesta)),
      catchError(error => {
        console.error(`❌ Error al obtener tareas del curso ${cursoId}:`, error);
        // Devolver array vacío en lugar de error para que no falle el forkJoin
        return of([]);
      })
    );
  }

  /**
   * Obtiene el catálogo de tareas registradas para un curso
   * GET /api/cursos/:cursoId/tareas
   */
  getTareasByCurso(cursoId: string): Observable<Tarea[]> {
    const url = `${this.apiUrl}/${cursoId}/tareas`;
    console.log(`📘 Solicitando tareas del curso desde: ${url}`);
    return this.http.get<unknown>(url).pipe(
      map(respuesta => this.extraerTareasAlumno(respuesta)),
      catchError(error => {
        console.error(`❌ Error al obtener el catálogo de tareas del curso ${cursoId}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene una tarea específica por ID
   * GET /api/cursos/:cursoId/tareas/:tareaId
   */
  getTareaById(cursoId: string, tareaId: string): Observable<Tarea> {
    const url = `${this.apiUrl}/${cursoId}/tareas/${tareaId}`;
    return this.http.get<Tarea>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Crea una nueva tarea en un curso
   * POST /api/cursos/:cursoId/tareas
   */
  createTarea(cursoId: string, dto: CreateTareaDto): Observable<Tarea> {
    const url = `${this.apiUrl}/${cursoId}/tareas`;
    return this.http.post<Tarea>(url, dto).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Actualiza completamente una tarea existente
   * PUT /api/cursos/:cursoId/tareas/:tareaId
   */
  updateTarea(cursoId: string, tareaId: string, dto: CreateTareaDto): Observable<Tarea> {
    const url = `${this.apiUrl}/${cursoId}/tareas/${tareaId}`;
    return this.http.put<Tarea>(url, dto).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Actualiza parcialmente una tarea existente
   * PATCH /api/cursos/:cursoId/tareas/:tareaId
   */
  patchTarea(cursoId: string, tareaId: string, dto: Partial<CreateTareaDto>): Observable<Tarea> {
    const url = `${this.apiUrl}/${cursoId}/tareas/${tareaId}`;
    return this.http.patch<Tarea>(url, dto).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Elimina una tarea
   * DELETE /api/cursos/:cursoId/tareas/:tareaId
   */
  deleteTarea(cursoId: string, tareaId: string): Observable<void> {
    const url = `${this.apiUrl}/${cursoId}/tareas/${tareaId}`;
    return this.http.delete<void>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene tareas por prioridad
   * GET /api/cursos/:cursoId/tareas?prioridad=alta
   */
  getTareasByPrioridad(cursoId: string, prioridad: 'alta' | 'media' | 'baja'): Observable<Tarea[]> {
    const url = `${this.apiUrl}/${cursoId}/tareas?prioridad=${prioridad}`;
    return this.http.get<Tarea[]>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene tareas pendientes (fecha de entrega futura)
   * GET /api/cursos/:cursoId/tareas/pendientes
   */
  getTareasPendientes(cursoId: string): Observable<Tarea[]> {
    const url = `${this.apiUrl}/${cursoId}/tareas/pendientes`;
    return this.http.get<Tarea[]>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene tareas vencidas (fecha de entrega pasada)
   * GET /api/cursos/:cursoId/tareas/vencidas
   */
  getTareasVencidas(cursoId: string): Observable<Tarea[]> {
    const url = `${this.apiUrl}/${cursoId}/tareas/vencidas`;
    return this.http.get<Tarea[]>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene detalle de una entrega específica
   * GET /api/cursos/tareas-alumno/:tareaAlumnoId
   */
  getDetalleEntrega(tareaAlumnoId: string): Observable<any> {
    const url = `${environment.apiUrl}/cursos/tareas-alumno/${tareaAlumnoId}`;
    console.log('🔍 [getDetalleEntrega] Consultando:', url);
    
    return this.http.get<any>(url).pipe(
      tap(response => {
        console.log('✅ [getDetalleEntrega] Respuesta recibida:', response);
      }),
      catchError(error => {
        console.error('❌ [getDetalleEntrega] Error:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
        return this.handleError(error);
      })
    );
  }

  /**
   * Alumno entrega su trabajo
   * PATCH /api/cursos/tareas-alumno/:tareaAlumnoId
   * Body: { archivoAdjunto: string, comentarioAlumno?: string, estado?: string }
   */
  entregarTarea(tareaAlumnoId: string, archivoAdjunto: string, comentarioAlumno?: string): Observable<any> {
    const url = `${environment.apiUrl}/cursos/tareas-alumno/${tareaAlumnoId}`;
    const body = {
      archivoAdjunto,
      comentarioAlumno: comentarioAlumno || '',
      estado: 'en-progreso'
    };
    return this.http.patch<any>(url, body).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Profesor califica la tarea de un alumno
   * PATCH /api/cursos/tareas-alumno/:tareaAlumnoId/calificar
   * Body: { calificacion: number, retroalimentacion?: string }
   */
  calificarTarea(tareaAlumnoId: string, calificacion: number, retroalimentacion?: string): Observable<any> {
    const url = `${environment.apiUrl}/cursos/tareas-alumno/${tareaAlumnoId}/calificar`;
    const body = {
      calificacion,
      retroalimentacion: retroalimentacion || ''
    };
    return this.http.patch<any>(url, body).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Asignar tarea a un alumno (profesor)
   * POST /api/cursos/tareas/:tareaId/asignar/:alumnoId
   * Body: { tareaId: string, alumnoId: string, estado?: string }
   */
  asignarTarea(tareaId: string, alumnoId: string, estado?: string): Observable<any> {
    const url = `${environment.apiUrl}/cursos/tareas/${tareaId}/asignar/${alumnoId}`;
    const body = {
      tareaId,
      alumnoId,
      estado: estado || 'pendiente'
    };
    return this.http.post<any>(url, body).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Convierte un archivo a Base64 para enviarlo en el body
   * Retorna la URL en formato Base64
   */
  uploadArchivo(archivo: File): Observable<{ url: string }> {
    return new Observable(observer => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64 = reader.result as string;
        observer.next({ url: base64 });
        observer.complete();
      };
      
      reader.onerror = (error) => {
        console.error('Error al leer archivo:', error);
        observer.error(error);
      };
      
      reader.readAsDataURL(archivo);
    });
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
      errorMessage = 'Tarea no encontrada';
    } else if (error.status === 400) {
      errorMessage = 'Datos de tarea inválidos';
    } else if (error.status === 401) {
      errorMessage = 'No autorizado. Inicia sesión nuevamente.';
    } else if (error.status === 403) {
      errorMessage = 'No tienes permisos para realizar esta acción';
    } else if (error.status === 500) {
      errorMessage = 'Error del servidor. Intenta nuevamente más tarde.';
    }
    
    console.error('❌ Error en TareasService:', error);
    return throwError(() => ({ message: errorMessage }));
  }

  private extraerTareasAlumno(respuesta: unknown): Tarea[] {
    if (Array.isArray(respuesta)) {
      return respuesta as Tarea[];
    }

    if (typeof respuesta === 'object' && respuesta !== null) {
      const obj = respuesta as Record<string, unknown>;
      const claves = ['tareas', 'tareasAlumno', 'tareasAsignadas', 'data', 'items', 'results', 'content', 'records'];
      for (const clave of claves) {
        const valor = obj[clave];
        if (Array.isArray(valor)) {
          return valor as Tarea[];
        }
        if (valor && typeof valor === 'object') {
          const anidado = this.extraerTareasAlumno(valor);
          if (anidado.length) {
            return anidado;
          }
        }
      }
    }

    console.warn('Formato de respuesta no reconocido para tareas de alumno:', respuesta);
    return [];
  }

  /**
   * Método de diagnóstico: intenta todas las rutas posibles para entregar una tarea
   * Útil para debuggear problemas de backend
   */
  diagnosticarRutasEntrega(tareaAlumnoId: string): Observable<any> {
    const rutas = [
      { metodo: 'PATCH', url: `${environment.apiUrl}/tareas-alumno/${tareaAlumnoId}` },
      { metodo: 'PATCH', url: `${environment.apiUrl}/cursos/tareas-alumno/${tareaAlumnoId}` },
      { metodo: 'PATCH', url: `${environment.apiUrl}/tareas/${tareaAlumnoId}/entregar` },
      { metodo: 'POST', url: `${environment.apiUrl}/tareas/${tareaAlumnoId}/entregar` },
      { metodo: 'PUT', url: `${environment.apiUrl}/tareas-alumno/${tareaAlumnoId}` },
      { metodo: 'PUT', url: `${environment.apiUrl}/cursos/tareas-alumno/${tareaAlumnoId}` }
    ];

    console.log('🔍 [diagnosticarRutasEntrega] Probando todas las rutas posibles...');
    
    const body = { estado: 'test', archivoAdjunto: 'test', comentarioAlumno: 'test de diagnóstico' };
    const resultados: any[] = [];

    rutas.forEach((ruta, index) => {
      const request$ = ruta.metodo === 'PATCH' 
        ? this.http.patch(ruta.url, body)
        : ruta.metodo === 'POST'
        ? this.http.post(ruta.url, body)
        : this.http.put(ruta.url, body);

      request$.subscribe({
        next: (response) => {
          console.log(`✅ [${index + 1}] FUNCIONA: ${ruta.metodo} ${ruta.url}`, response);
          resultados.push({ ...ruta, status: 'success', response });
        },
        error: (error) => {
          console.log(`❌ [${index + 1}] Error ${error.status}: ${ruta.metodo} ${ruta.url}`, error.message);
          resultados.push({ ...ruta, status: 'error', error: error.status, message: error.message });
        }
      });
    });

    return of(resultados);
  }
}
