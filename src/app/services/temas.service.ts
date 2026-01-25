import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Tema, CreateTemaDto, UpdateTemaDto } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TemasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cursos`;

  /**
   * Obtiene todos los temas de una unidad
   */
  getTemasByUnidad(cursoId: string, unidadId: string): Observable<Tema[]> {
    return this.http.get<Tema[]>(`${this.apiUrl}/${cursoId}/unidades/${unidadId}/temas`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene un tema específico
   */
  getTemaById(cursoId: string, unidadId: string, temaId: string): Observable<Tema> {
    return this.http.get<Tema>(`${this.apiUrl}/${cursoId}/unidades/${unidadId}/temas/${temaId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crea un nuevo tema en una unidad
   */
  createTema(cursoId: string, unidadId: string, tema: CreateTemaDto): Observable<Tema> {
    return this.http.post<Tema>(`${this.apiUrl}/${cursoId}/unidades/${unidadId}/temas`, tema).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un tema existente
   */
  updateTema(cursoId: string, unidadId: string, temaId: string, tema: UpdateTemaDto): Observable<Tema> {
    return this.http.put<Tema>(`${this.apiUrl}/${cursoId}/unidades/${unidadId}/temas/${temaId}`, tema).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza parcialmente un tema
   */
  patchTema(cursoId: string, unidadId: string, temaId: string, tema: Partial<UpdateTemaDto>): Observable<Tema> {
    return this.http.patch<Tema>(`${this.apiUrl}/${cursoId}/unidades/${unidadId}/temas/${temaId}`, tema).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un tema
   */
  deleteTema(cursoId: string, unidadId: string, temaId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${cursoId}/unidades/${unidadId}/temas/${temaId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Reordena los temas de una unidad
   */
  reorderTemas(cursoId: string, unidadId: string, temasIds: string[]): Observable<Tema[]> {
    return this.http.put<Tema[]>(
      `${this.apiUrl}/${cursoId}/unidades/${unidadId}/temas/reorder`, 
      { temasIds }
    ).pipe(
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
    
    console.error('Error en TemasService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
