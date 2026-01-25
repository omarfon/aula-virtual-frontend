import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, EMPTY, throwError, Subscription } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AsignacionCurso } from '../models';

export interface ResultadoAsignacionCursos {
  alumno?: {
    id?: string;
    nombre?: string;
    email?: string;
    rol?: string;
    [key: string]: unknown;
  };
  asignados: AsignacionCurso[];
  yaAsignados: string[];
  noEncontrados: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AsignacionesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cursos/asignaciones`;
  private readonly asignacionesSubject = new BehaviorSubject<AsignacionCurso[]>([]);
  private sincronizado = false;
  private sincronizacionEnCurso: Subscription | null = null;

  getAsignaciones(): Observable<AsignacionCurso[]> {
    this.sincronizarConBackend();
    return this.asignacionesSubject.asObservable();
  }

  getAsignacionesPorAlumno(alumnoId: string): Observable<AsignacionCurso[]> {
    return this.getAsignaciones().pipe(
      map(asignaciones => asignaciones.filter(asignacion => asignacion.alumnoId === alumnoId))
    );
  }

  asignarCursos(alumnoId: string, cursoIds: string[]): Observable<ResultadoAsignacionCursos> {
    if (!cursoIds.length) {
      return of({ alumno: undefined, asignados: [], yaAsignados: [], noEncontrados: [] });
    }

    return this.http.post<unknown>(this.apiUrl, { alumnoId, cursoIds }).pipe(
      map(respuesta => this.normalizarResultado(respuesta)),
      tap(() => this.sincronizarConBackend(true)),
      catchError(error => {
        console.error('No se pudo asignar cursos mediante el backend.', error);
        return throwError(() => error);
      })
    );
  }

  desasignarCurso(alumnoId: string, cursoId: string): Observable<void> {
    const endpoint = `${environment.apiUrl}/cursos/${cursoId}/asignaciones/${alumnoId}`;
    return this.http.delete<void>(endpoint).pipe(
      tap(() => this.sincronizarConBackend(true)),
      catchError(error => {
        console.error('No se pudo desasignar el curso mediante el backend.', error);
        return throwError(() => error);
      })
    );
  }

  private sincronizarConBackend(force = false): void {
    if (this.sincronizado && !force) {
      return;
    }

    if (this.sincronizacionEnCurso) {
      return;
    }

    const suscripcion = this.http.get<unknown>(this.apiUrl).pipe(
      map(respuesta => this.extraerAsignaciones(respuesta)
        .map(asignacion => this.normalizarAsignacion(asignacion))
        .filter(asignacion => this.esAsignacionValida(asignacion))
      ),
      tap(asignaciones => {
        this.sincronizado = true;
        this.asignacionesSubject.next(asignaciones);
      }),
      catchError(error => {
        console.warn('No se pudieron obtener asignaciones desde el backend, se mantiene el estado actual.', error);
        this.sincronizado = true;
        return EMPTY;
      }),
      finalize(() => {
        this.sincronizacionEnCurso = null;
      })
    ).subscribe();

    this.sincronizacionEnCurso = suscripcion;
  }


  private normalizarAsignacion(asignacion: any): AsignacionCurso {
    const curso = asignacion?.curso || asignacion?.course || asignacion?.cursoAsignado || asignacion?.cursoDetalle || asignacion?.detalleCurso;
    const alumno = asignacion?.alumno || asignacion?.usuario || asignacion?.student || asignacion?.alumnoDetalle || asignacion?.detalleAlumno;

    const cursoId = asignacion?.cursoId || asignacion?.courseId || asignacion?.curso?.id || asignacion?.curso?.cursoId || curso?.id || curso?._id || curso?.cursoId || curso?.idCurso;
    const alumnoId = asignacion?.alumnoId || asignacion?.usuarioId || asignacion?.studentId || asignacion?.alumno?.id || asignacion?.alumno?.alumnoId || alumno?.id || alumno?._id || alumno?.alumnoId || alumno?.idAlumno;

    const cursoNormalizado = curso ? {
      id: cursoId ? String(cursoId) : undefined,
      titulo: typeof curso?.titulo === 'string' ? curso.titulo : typeof curso?.nombre === 'string' ? curso.nombre : undefined,
      categoria: typeof curso?.categoria === 'string' ? curso.categoria : typeof curso?.category === 'string' ? curso.category : undefined,
      instructor: typeof curso?.instructor === 'string' ? curso.instructor : typeof curso?.docente === 'string' ? curso.docente : undefined,
      imagen: typeof curso?.imagen === 'string' ? curso.imagen : typeof curso?.imagenUrl === 'string' ? curso.imagenUrl : typeof curso?.image === 'string' ? curso.image : undefined
    } : undefined;

    const alumnoNormalizado = alumno ? {
      id: alumnoId ? String(alumnoId) : undefined,
      nombre: typeof alumno?.nombre === 'string' ? alumno.nombre : typeof alumno?.nombreCompleto === 'string' ? alumno.nombreCompleto : typeof alumno?.nombres === 'string' ? alumno.nombres : undefined,
      email: typeof alumno?.email === 'string' ? alumno.email : typeof alumno?.correo === 'string' ? alumno.correo : typeof alumno?.correoElectronico === 'string' ? alumno.correoElectronico : undefined
    } : undefined;

    return {
      id: asignacion?.id || asignacion?._id || this.generarIdLocal(),
      alumnoId: alumnoId ? String(alumnoId) : '',
      cursoId: cursoId ? String(cursoId) : '',
      fechaAsignacion: asignacion?.fechaAsignacion || asignacion?.createdAt || new Date().toISOString(),
      progreso: typeof asignacion?.progreso === 'number' ? asignacion.progreso : 0,
      estado: asignacion?.estado === 'completado' ? 'completado' : asignacion?.estado === 'activo' ? 'activo' : 'pendiente',
      curso: cursoNormalizado,
      alumno: alumnoNormalizado
    };
  }

  private generarIdLocal(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `asg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private normalizarResultado(respuesta: unknown): ResultadoAsignacionCursos {
    const asignaciones = this.extraerAsignaciones(respuesta)
      .map(asignacion => this.normalizarAsignacion(asignacion))
      .filter(asignacion => this.esAsignacionValida(asignacion));
    const objeto = typeof respuesta === 'object' && respuesta !== null ? respuesta as Record<string, unknown> : {};

    const alumnoRaw = typeof objeto['alumno'] === 'object' && objeto['alumno'] !== null ? objeto['alumno'] as Record<string, unknown> : undefined;
    const yaAsignados = Array.isArray(objeto['yaAsignados']) ? objeto['yaAsignados'].map(valor => String(valor)) : [];
    const noEncontrados = Array.isArray(objeto['noEncontrados']) ? objeto['noEncontrados'].map(valor => String(valor)) : [];

    const alumnoNormalizado = alumnoRaw
      ? {
          id: alumnoRaw['id'] ? String(alumnoRaw['id']) : undefined,
          nombre: typeof alumnoRaw['nombre'] === 'string' ? alumnoRaw['nombre'] : undefined,
          email: typeof alumnoRaw['email'] === 'string' ? alumnoRaw['email'] : undefined,
          rol: typeof alumnoRaw['rol'] === 'string' ? alumnoRaw['rol'] : undefined,
          ...alumnoRaw
        }
      : undefined;

    return {
      alumno: alumnoNormalizado,
      asignados: asignaciones,
      yaAsignados,
      noEncontrados
    };
  }

  private extraerAsignaciones(respuesta: unknown): any[] {
    if (Array.isArray(respuesta)) {
      return respuesta;
    }

    if (typeof respuesta === 'object' && respuesta !== null) {
      const obj = respuesta as Record<string, unknown>;
      const claves = ['asignados', 'asignaciones', 'data', 'items', 'results'];
      for (const clave of claves) {
        const valor = obj[clave];
        if (Array.isArray(valor)) {
          return valor;
        }
      }

      for (const valor of Object.values(obj)) {
        const resultado = this.extraerAsignaciones(valor);
        if (resultado.length > 0) {
          return resultado;
        }
      }
    }

    console.warn('Formato de respuesta no reconocido para asignaciones:', respuesta);
    return [];
  }

  private esAsignacionValida(asignacion: AsignacionCurso): boolean {
    return Boolean(asignacion.alumnoId && asignacion.cursoId);
  }
}
