import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConfiguracionEmpresa {
  id: string;
  nombreEmpresa: string;
  logoUrl?: string;
  colorPrimario: string;
  colorSecundario: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  sitioWeb?: string;
  descripcion?: string;
  terminosServicio?: string;
  politicaPrivacidad?: string;
  activa: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateConfiguracionEmpresaDto {
  nombreEmpresa: string;
  logoUrl?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  sitioWeb?: string;
  descripcion?: string;
  terminosServicio?: string;
  politicaPrivacidad?: string;
  activa?: boolean;
}

export interface UpdateConfiguracionEmpresaDto {
  nombreEmpresa?: string;
  logoUrl?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  sitioWeb?: string;
  descripcion?: string;
  terminosServicio?: string;
  politicaPrivacidad?: string;
  activa?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/empresa`;

  crearConfiguracion(dto: CreateConfiguracionEmpresaDto): Observable<ConfiguracionEmpresa> {
    return this.http.post<ConfiguracionEmpresa>(this.apiUrl, dto);
  }

  listarConfiguraciones(): Observable<ConfiguracionEmpresa[]> {
    return this.http.get<ConfiguracionEmpresa[]>(this.apiUrl);
  }

  obtenerConfiguracionActiva(): Observable<ConfiguracionEmpresa> {
    return this.http.get<ConfiguracionEmpresa>(`${this.apiUrl}/activa`);
  }

  obtenerConfiguracion(id: string): Observable<ConfiguracionEmpresa> {
    return this.http.get<ConfiguracionEmpresa>(`${this.apiUrl}/${id}`);
  }

  actualizarConfiguracion(id: string, dto: UpdateConfiguracionEmpresaDto): Observable<ConfiguracionEmpresa> {
    return this.http.patch<ConfiguracionEmpresa>(`${this.apiUrl}/${id}`, dto);
  }

  eliminarConfiguracion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
