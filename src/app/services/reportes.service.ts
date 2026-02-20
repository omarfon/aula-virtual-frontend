import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CursoCompletado {
  nombre: string;
  calificacion: number;
  fechaFinalizacion: string;
  asistencia: number;
}

export interface Participante {
  id: string;
  nombre: string;
  email: string;
  dni: string;
  telefono: string;
  ciudad: string;
  fechaInicio: string;
  fechaFinalizacion?: string;
  estado: 'completado' | 'en_curso' | 'abandonado';
  aptitud: 'apto' | 'no_apto' | 'en_evaluacion';
  promedioGeneral: number;
  asistenciaPromedio: number;
  tareasEntregadas: number;
  totalTareas: number;
  examenesAprobados: number;
  totalExamenes: number;
  cursosCompletados: CursoCompletado[];
  observaciones?: string;
}

export interface Estadisticas {
  total: number;
  aptos: number;
  noAptos: number;
  promedioGeneral: number;
}

export interface ReporteParticipantesResponse {
  estadisticas: Estadisticas;
  participantes: Participante[];
}

export interface CriteriosAptitud {
  promedioMinimo?: number;
  asistenciaMinima?: number;
  tareasMinimas?: number;
  examenesAprobadosMinimo?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  /**
   * Obtiene el reporte de participantes con estadísticas de aptitud laboral
   * GET /usuarios/reportes/participantes
   * 
   * NOTA: Por ahora no se envían parámetros porque el backend necesita configurar
   * el DTO para aceptarlos. Cuando el backend esté listo, descomentar el código.
   */
  getReporteParticipantes(criterios?: CriteriosAptitud): Observable<ReporteParticipantesResponse> {
    // Temporalmente deshabilitado hasta que el backend acepte estos parámetros
    // let params = new HttpParams();
    // 
    // if (criterios) {
    //   if (criterios.promedioMinimo !== undefined) {
    //     params = params.set('promedioMinimo', criterios.promedioMinimo.toString());
    //   }
    //   if (criterios.asistenciaMinima !== undefined) {
    //     params = params.set('asistenciaMinima', criterios.asistenciaMinima.toString());
    //   }
    //   if (criterios.tareasMinimas !== undefined) {
    //     params = params.set('tareasMinimas', criterios.tareasMinimas.toString());
    //   }
    //   if (criterios.examenesAprobadosMinimo !== undefined) {
    //     params = params.set('examenesAprobadosMinimo', criterios.examenesAprobadosMinimo.toString());
    //   }
    // }

    const url = `${this.apiUrl}/reportes/participantes`;
    console.log('📊 Solicitando reporte de participantes:', url);
    console.log('⚠️ NOTA: Criterios NO enviados - backend necesita configurar DTO para aceptarlos');
    
    // Por ahora llamar sin parámetros
    return this.http.get<ReporteParticipantesResponse>(url);
  }
}
