import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  ProgresoAlumno,
  ProgresoCurso,
  ProgresoUnidad,
  MarcarTemaDto,
  MarcarContenidoDto
} from '../models/progreso.model';
import { environment } from '../../environments/environment';

/**
 * Servicio para gestionar el progreso del alumno en los cursos
 * Conectado al backend para persistencia en base de datos
 */
@Injectable({
  providedIn: 'root'
})
export class ProgresoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/progreso`;
  private readonly ALUMNO_ID = 'alumno-demo-001'; // ID del alumno simulado
  
  // Cache en memoria (no persistente)
  private cacheProgreso = new Map<string, ProgresoAlumno>();

  /**
   * Obtiene o crea el progreso de un alumno en un curso desde el backend
   */
  obtenerProgresoCurso(cursoId: string): Observable<ProgresoAlumno> {
    // Verificar cache primero
    const cacheKey = `${this.ALUMNO_ID}-${cursoId}`;
    if (this.cacheProgreso.has(cacheKey)) {
      return of(this.cacheProgreso.get(cacheKey)!);
    }

    return this.http.get<ProgresoAlumno>(`${this.apiUrl}/${this.ALUMNO_ID}/curso/${cursoId}`).pipe(
      tap(progreso => this.cacheProgreso.set(cacheKey, progreso)),
      catchError(() => {
        // Si no existe, crear uno nuevo
        const nuevoProgreso: ProgresoAlumno = {
          alumnoId: this.ALUMNO_ID,
          cursoId: cursoId,
          fechaInscripcion: new Date(),
          ultimoAcceso: new Date(),
          estado: 'no-iniciado',
          progresoGeneral: 0,
          temasCompletados: [],
          contenidosVistos: []
        };
        return this.http.post<ProgresoAlumno>(this.apiUrl, nuevoProgreso).pipe(
          tap(progreso => this.cacheProgreso.set(cacheKey, progreso))
        );
      })
    );
  }

  /**
   * Marca un tema como completado o no completado en el backend
   */
  marcarTemaCompletado(dto: MarcarTemaDto): Observable<ProgresoAlumno> {
    return this.http.patch<ProgresoAlumno>(
      `${this.apiUrl}/${this.ALUMNO_ID}/curso/${dto.cursoId}/tema`,
      dto
    ).pipe(
      tap(progreso => {
        const cacheKey = `${this.ALUMNO_ID}-${dto.cursoId}`;
        this.cacheProgreso.set(cacheKey, progreso);
      }),
      catchError(error => {
        console.error('Error al marcar tema:', error);
        return of({
          alumnoId: this.ALUMNO_ID,
          cursoId: dto.cursoId,
          fechaInscripcion: new Date(),
          ultimoAcceso: new Date(),
          estado: 'en-progreso',
          progresoGeneral: 0,
          temasCompletados: [],
          contenidosVistos: []
        } as ProgresoAlumno);
      })
    );
  }

  /**
   * Marca un contenido como visto en el backend
   */
  marcarContenidoVisto(dto: MarcarContenidoDto): Observable<ProgresoAlumno> {
    return this.http.patch<ProgresoAlumno>(
      `${this.apiUrl}/${this.ALUMNO_ID}/curso/${dto.cursoId}/contenido`,
      dto
    ).pipe(
      tap(progreso => {
        const cacheKey = `${this.ALUMNO_ID}-${dto.cursoId}`;
        this.cacheProgreso.set(cacheKey, progreso);
      }),
      catchError(error => {
        console.error('Error al marcar contenido:', error);
        return of({
          alumnoId: this.ALUMNO_ID,
          cursoId: dto.cursoId,
          fechaInscripcion: new Date(),
          ultimoAcceso: new Date(),
          estado: 'en-progreso',
          progresoGeneral: 0,
          temasCompletados: [],
          contenidosVistos: []
        } as ProgresoAlumno);
      })
    );
  }

  /**
   * Calcula el progreso detallado de un curso
   */
  calcularProgresoCurso(cursoId: string, unidades: any[]): Observable<ProgresoCurso> {
    return this.obtenerProgresoCurso(cursoId).pipe(
      map(progreso => {
        // Calcular total de contenidos en el curso
        let totalContenidos = 0;
        unidades.forEach(u => {
          u.temas?.forEach((t: any) => {
            totalContenidos += t.contenidos?.length || 0;
          });
        });

        // Contar contenidos vistos
        const contenidosVistos = progreso.contenidosVistos.filter(c => c.visto).length;
        
        // Calcular porcentaje basado en contenidos vistos
        const porcentaje = totalContenidos > 0 
          ? Math.round((contenidosVistos / totalContenidos) * 100) 
          : 0;

        console.log('📊 Cálculo de progreso:', {
          totalContenidos,
          contenidosVistos,
          porcentaje,
          temasCompletados: progreso.temasCompletados.filter(t => t.completado).length
        });

        const totalTemas = unidades.reduce((sum, u) => sum + (u.temas?.length || 0), 0);
        const temasCompletados = progreso.temasCompletados.filter(t => t.completado).length;

        const unidadesProgreso: ProgresoUnidad[] = unidades.map(unidad => {
          // Calcular contenidos de esta unidad
          let totalContenidosUnidad = 0;
          unidad.temas?.forEach((t: any) => {
            totalContenidosUnidad += t.contenidos?.length || 0;
          });

          // Contar contenidos vistos en esta unidad
          let contenidosVistosUnidad = 0;
          unidad.temas?.forEach((tema: any) => {
            tema.contenidos?.forEach((contenido: any) => {
              if (progreso.contenidosVistos.some(c => c.contenidoId === contenido.id && c.visto)) {
                contenidosVistosUnidad++;
              }
            });
          });

          const porcentajeUnidad = totalContenidosUnidad > 0
            ? Math.round((contenidosVistosUnidad / totalContenidosUnidad) * 100)
            : 0;

          const totalTemasUnidad = unidad.temas?.length || 0;
          const temasCompletadosUnidad = progreso.temasCompletados.filter(
            t => t.unidadId === unidad.id && t.completado
          ).length;

          return {
            unidadId: unidad.id,
            temasCompletados: temasCompletadosUnidad,
            totalTemas: totalTemasUnidad,
            porcentaje: porcentajeUnidad
          };
        });

        return {
          cursoId,
          alumnoId: this.ALUMNO_ID,
          porcentajeCompletado: porcentaje,
          temasCompletados,
          totalTemas,
          unidades: unidadesProgreso,
          ultimoAcceso: progreso.ultimoAcceso
        };
      })
    );
  }

  /**
   * Verifica si un tema está completado (usa cache)
   */
  isTemaCompletado(cursoId: string, unidadId: string, temaId: string): boolean {
    const cacheKey = `${this.ALUMNO_ID}-${cursoId}`;
    const progreso = this.cacheProgreso.get(cacheKey);
    
    if (!progreso) return false;
    
    return progreso.temasCompletados.some(
      t => t.unidadId === unidadId && t.temaId === temaId && t.completado
    );
  }

  /**
   * Verifica si un contenido fue visto (usa cache)
   */
  isContenidoVisto(cursoId: string, contenidoId: string): boolean {
    const cacheKey = `${this.ALUMNO_ID}-${cursoId}`;
    const progreso = this.cacheProgreso.get(cacheKey);
    
    if (!progreso) return false;
    
    return progreso.contenidosVistos.some(
      c => c.contenidoId === contenidoId && c.visto
    );
  }

  /**
   * Auto-completa un tema si todos sus contenidos fueron vistos
   */
  verificarYCompletarTema(cursoId: string, unidadId: string, temaId: string, contenidosIds: string[]): Observable<boolean> {
    // Primero actualizar el cache desde el servidor
    return this.obtenerProgresoCurso(cursoId).pipe(
      map(progreso => {
        // Verificar si todos los contenidos están vistos
        if (contenidosIds.length === 0) return false;
        
        const todosVistos = contenidosIds.every(contenidoId => 
          progreso.contenidosVistos.some(
            c => c.contenidoId === contenidoId && c.temaId === temaId && c.visto
          )
        );
        
        if (todosVistos) {
          // Auto-marcar tema como completado
          this.marcarTemaCompletado({
            cursoId,
            unidadId,
            temaId,
            completado: true
          }).subscribe();
          return true;
        }
        return false;
      })
    );
  }

  /**
   * Verifica si el curso está completado (todos los temas completados)
   */
  cursoCompletado(cursoId: string, totalTemas: number): boolean {
    const cacheKey = `${this.ALUMNO_ID}-${cursoId}`;
    const progreso = this.cacheProgreso.get(cacheKey);
    
    if (!progreso) return false;
    
    const temasCompletados = progreso.temasCompletados.filter(t => t.completado).length;
    return temasCompletados === totalTemas && totalTemas > 0;
  }

  /**
   * Obtiene el progreso de una unidad específica (usa cache)
   */
  obtenerProgresoUnidad(cursoId: string, unidadId: string, totalTemas: number): number {
    const cacheKey = `${this.ALUMNO_ID}-${cursoId}`;
    const progreso = this.cacheProgreso.get(cacheKey);
    
    if (!progreso) return 0;
    
    const temasCompletados = progreso.temasCompletados.filter(
      t => t.unidadId === unidadId && t.completado
    ).length;
    
    return totalTemas > 0 ? Math.round((temasCompletados / totalTemas) * 100) : 0;
  }

  /**
   * Resetea el progreso de un curso en el backend
   */
  resetearProgresoCurso(cursoId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${this.ALUMNO_ID}/curso/${cursoId}`).pipe(
      tap(() => {
        const cacheKey = `${this.ALUMNO_ID}-${cursoId}`;
        this.cacheProgreso.delete(cacheKey);
      }),
      catchError(error => {
        console.error('❌ Error al resetear progreso:', error);
        return of(void 0);
      })
    );
  }

  /**
   * Limpia el cache en memoria
   */
  limpiarCache(): void {
    this.cacheProgreso.clear();
  }
}
