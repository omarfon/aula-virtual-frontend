import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Persona {
  id?: string;
  nombre: string;
  apellido: string;
  tipoDocumento?: 'DNI' | 'CE' | 'Pasaporte' | 'RUC';
  numeroDocumento?: string;
  email: string;
  telefono?: string;
  telefonoFijo?: string;
  direccion?: string;
  areaLabor?: string;
  fechaIngreso?: Date;
  tipo: 'alumno' | 'instructor' | 'admin';
  estado: 'activo' | 'inactivo';
  fechaRegistro?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePersonaDto {
  nombre: string;
  apellido: string;
  tipoDocumento?: 'DNI' | 'CE' | 'Pasaporte' | 'RUC';
  numeroDocumento?: string;
  email: string;
  telefono?: string;
  telefonoFijo?: string;
  direccion?: string;
  areaLabor?: string;
  fechaIngreso?: Date;
  tipo: 'alumno' | 'instructor' | 'admin';
  estado?: 'activo' | 'inactivo';
}

export interface UpdatePersonaDto {
  nombre?: string;
  apellido?: string;
  tipoDocumento?: 'DNI' | 'CE' | 'Pasaporte' | 'RUC';
  numeroDocumento?: string;
  email?: string;
  telefono?: string;
  telefonoFijo?: string;
  direccion?: string;
  areaLabor?: string;
  fechaIngreso?: Date;
  tipo?: 'alumno' | 'instructor' | 'admin';
  estado?: 'activo' | 'inactivo';
}

@Injectable({
  providedIn: 'root'
})
export class PersonasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/personas`;

  crearPersona(dto: CreatePersonaDto): Observable<Persona> {
    return this.http.post<Persona>(this.apiUrl, dto);
  }

  listarPersonas(): Observable<Persona[]> {
    return this.http.get<Persona[]>(this.apiUrl);
  }

  obtenerPersona(id: string): Observable<Persona> {
    return this.http.get<Persona>(`${this.apiUrl}/${id}`);
  }

  actualizarPersona(id: string, dto: UpdatePersonaDto): Observable<Persona> {
    return this.http.patch<Persona>(`${this.apiUrl}/${id}`, dto);
  }

  eliminarPersona(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listarPorTipo(tipo: 'alumno' | 'instructor' | 'admin'): Observable<Persona[]> {
    return this.http.get<Persona[]>(`${this.apiUrl}/tipo/${tipo}`);
  }

  buscarPersonas(termino: string): Observable<Persona[]> {
    return this.http.get<Persona[]>(`${this.apiUrl}/buscar`, {
      params: { q: termino }
    });
  }

  cargarMasiva(personas: CreatePersonaDto[]): Observable<{ exitosos: number; fallidos: number; errores: any[] }> {
    return this.http.post<{ exitosos: number; fallidos: number; errores: any[] }>(`${this.apiUrl}/carga-masiva`, { personas });
  }
}
