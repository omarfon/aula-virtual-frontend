import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Alumno } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AlumnosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios/alumnos`;
  private readonly alumnosSubject = new BehaviorSubject<Alumno[]>([]);
  private datosSincronizados = false;
  private cargaEnCurso = false;

  getAlumnos(forceReload = false): Observable<Alumno[]> {
    if (forceReload) {
      this.datosSincronizados = false;
    }
    if (!this.datosSincronizados || forceReload) {
      this.sincronizarConBackend();
    }
    return this.alumnosSubject.asObservable();
  }

  private sincronizarConBackend(): void {
    if (this.cargaEnCurso) {
      return;
    }
    this.cargaEnCurso = true;
    this.http.get<unknown>(this.apiUrl).pipe(
      map(response => {
        console.info('[AlumnosService] Respuesta cruda de alumnos:', response);
        const alumnosCrudos = this.extraerAlumnos(response);
        if (!alumnosCrudos.length) {
          console.warn('[AlumnosService] El backend no devolvió alumnos; se mantiene la lista previa.');
          return this.alumnosSubject.value;
        }
        return alumnosCrudos.map(alumno => this.normalizarAlumno(alumno));
      }),
      tap(alumnos => {
        this.alumnosSubject.next(alumnos);
        this.datosSincronizados = true;
      }),
      catchError(error => {
        console.warn('No se pudo obtener alumnos desde el backend, se mantiene la lista existente.', error);
        this.datosSincronizados = true;
        return of(this.alumnosSubject.value);
      }),
      finalize(() => {
        this.cargaEnCurso = false;
      })
    ).subscribe();
  }

  private normalizarAlumno(alumno: any): Alumno {
    const id = alumno?.id || alumno?.alumnoId || alumno?._id || alumno?.uuid || alumno?.codigo || alumno?.dni;
    const nombres = alumno?.nombres || alumno?.nombre || alumno?.firstName;
    const apellidos = alumno?.apellidos || alumno?.apellido || alumno?.lastName;
    const nombreCompleto = alumno?.nombreCompleto || alumno?.fullName || [nombres, apellidos].filter(Boolean).join(' ');
    const email = alumno?.email || alumno?.correo || alumno?.correoElectronico || alumno?.username || 'sin-correo@salesland.com';
    const telefono = alumno?.telefono || alumno?.phone || alumno?.celular;
    const fechaRegistro = alumno?.fechaRegistro || alumno?.createdAt || alumno?.fechaCreacion || new Date().toISOString();
    const estado = (alumno?.estado || alumno?.status || 'activo').toString().toLowerCase() === 'inactivo' ? 'inactivo' : 'activo';

    return {
      id: id ? String(id) : this.generarIdLocal(),
      nombre: nombreCompleto || nombres || apellidos || 'Alumno sin nombre',
      email,
      telefono,
      fechaRegistro,
      estado
    };
  }

  private extraerAlumnos(respuesta: unknown): any[] {
    if (Array.isArray(respuesta)) {
      return respuesta;
    }

    if (typeof respuesta === 'object' && respuesta !== null) {
      const prioridadClaves = ['alumnos', 'usuarios', 'users', 'students', 'data', 'items', 'results', 'content', 'records', 'rows'];
      for (const clave of prioridadClaves) {
        const valor = (respuesta as Record<string, unknown>)[clave];
        if (Array.isArray(valor)) {
          return valor;
        }
        if (valor && typeof valor === 'object') {
          const anidado = this.extraerAlumnos(valor);
          if (anidado.length) {
            return anidado;
          }
        }
      }
    }

    console.warn('Formato de respuesta no reconocido para alumnos:', respuesta);
    return [];
  }

  private generarIdLocal(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `alu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

}
