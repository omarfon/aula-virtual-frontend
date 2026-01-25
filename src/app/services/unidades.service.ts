import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Unidad, CreateUnidadDto, UpdateUnidadDto } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UnidadesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cursos`;

  /**
   * Obtiene todas las unidades de un curso
   */
  getUnidadesByCurso(cursoId: string): Observable<Unidad[]> {
    return this.http.get<Unidad[]>(`${this.apiUrl}/${cursoId}/unidades`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene una unidad específica
   */
  getUnidadById(cursoId: string, unidadId: string): Observable<Unidad> {
    return this.http.get<Unidad>(`${this.apiUrl}/${cursoId}/unidades/${unidadId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crea una nueva unidad en un curso
   */
  createUnidad(cursoId: string, unidad: CreateUnidadDto): Observable<Unidad> {
    return this.http.post<Unidad>(`${this.apiUrl}/${cursoId}/unidades`, unidad).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza una unidad existente
   */
  updateUnidad(cursoId: string, unidadId: string, unidad: UpdateUnidadDto): Observable<Unidad> {
    return this.http.put<Unidad>(`${this.apiUrl}/${cursoId}/unidades/${unidadId}`, unidad).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza parcialmente una unidad
   */
  patchUnidad(cursoId: string, unidadId: string, unidad: Partial<UpdateUnidadDto>): Observable<Unidad> {
    return this.http.patch<Unidad>(`${this.apiUrl}/${cursoId}/unidades/${unidadId}`, unidad).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina una unidad
   */
  deleteUnidad(cursoId: string, unidadId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${cursoId}/unidades/${unidadId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Reordena las unidades de un curso
   */
  reorderUnidades(cursoId: string, unidadesIds: string[]): Observable<Unidad[]> {
    return this.http.put<Unidad[]>(`${this.apiUrl}/${cursoId}/unidades/reorder`, { unidadesIds }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ha ocurrido un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Error en UnidadesService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
