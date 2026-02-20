import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'alumno' | 'instructor' | 'admin' | 'administrador' | 'coordinador';
  tipoDocumento?: 'DNI' | 'CE' | 'Pasaporte' | 'RUC';
  numeroDocumento?: string;
  telefono?: string;
  telefonoFijo?: string;
  direccion?: string;
  areaLabor?: string;
  fechaIngreso?: Date;
  activo: boolean;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateUsuarioDto {
  nombre?: string;
  email?: string;
  rol?: 'alumno' | 'instructor' | 'admin' | 'administrador' | 'coordinador';
  tipoDocumento?: 'DNI' | 'CE' | 'Pasaporte' | 'RUC';
  numeroDocumento?: string;
  telefono?: string;
  telefonoFijo?: string;
  direccion?: string;
  areaLabor?: string;
  fechaIngreso?: Date;
  activo?: boolean;
}

export interface CreateUsuarioDto {
  nombre: string;
  email: string;
  password?: string;
  rol: 'alumno' | 'instructor' | 'admin' | 'administrador' | 'coordinador';
  tipoDocumento?: 'DNI' | 'CE' | 'Pasaporte' | 'RUC';
  numeroDocumento?: string;
  telefono?: string;
  telefonoFijo?: string;
  direccion?: string;
  areaLabor?: string;
  fechaIngreso?: Date;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  crearUsuario(dto: CreateUsuarioDto): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, dto);
  }

  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  obtenerUsuario(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  actualizarUsuario(id: string, dto: UpdateUsuarioDto): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, dto);
  }

  eliminarUsuario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
