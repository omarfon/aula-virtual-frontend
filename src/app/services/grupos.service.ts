import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Grupo {
  id: string;
  nombre: string;
  descripcion: string;
  capacidadMaxima: number;
  color: string;
  estado: 'activo' | 'inactivo';
  fechaInicio?: Date;
  fechaFin?: Date;
  alumnos?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateGrupoDto {
  nombre: string;
  descripcion?: string;
  capacidadMaxima: number;
  color?: string;
  estado?: 'activo' | 'inactivo';
  fechaInicio?: Date;
  fechaFin?: Date;
}

export interface UpdateGrupoDto {
  nombre?: string;
  descripcion?: string;
  capacidadMaxima?: number;
  color?: string;
  estado?: 'activo' | 'inactivo';
  fechaInicio?: Date;
  fechaFin?: Date;
}

export interface AgregarAlumnosDto {
  alumnoIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class GruposService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/grupos`;

  crearGrupo(dto: CreateGrupoDto): Observable<Grupo> {
    return this.http.post<Grupo>(this.apiUrl, dto);
  }

  listarGrupos(): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(this.apiUrl);
  }

  obtenerGrupo(id: string): Observable<Grupo> {
    return this.http.get<Grupo>(`${this.apiUrl}/${id}`);
  }

  actualizarGrupo(id: string, dto: UpdateGrupoDto): Observable<Grupo> {
    return this.http.patch<Grupo>(`${this.apiUrl}/${id}`, dto);
  }

  eliminarGrupo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  agregarAlumnos(grupoId: string, alumnoIds: string[]): Observable<Grupo> {
    return this.http.post<Grupo>(`${this.apiUrl}/${grupoId}/alumnos`, { alumnoIds });
  }

  removerAlumnos(grupoId: string, alumnoIds: string[]): Observable<Grupo> {
    return this.http.request<Grupo>('DELETE', `${this.apiUrl}/${grupoId}/alumnos`, {
      body: { alumnoIds }
    });
  }
}
