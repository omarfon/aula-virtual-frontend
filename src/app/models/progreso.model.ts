/**
 * Modelos para el sistema de seguimiento de progreso de alumnos
 */

export interface TemaCompletado {
  unidadId: string;
  temaId: string;
  completado: boolean;
  fechaCompletado?: Date;
  tiempoInvertido?: number; // minutos
}

export interface ContenidoVisto {
  contenidoId: string;
  temaId: string;
  visto: boolean;
  fechaVisto?: Date;
}

export interface ProgresoUnidad {
  unidadId: string;
  temasCompletados: number;
  totalTemas: number;
  porcentaje: number;
}

export interface ProgresoCurso {
  cursoId: string;
  alumnoId: string;
  porcentajeCompletado: number;
  temasCompletados: number;
  totalTemas: number;
  unidades: ProgresoUnidad[];
  ultimoTemaVisto?: string;
  ultimoAcceso?: Date;
}

export interface ProgresoAlumno {
  id?: string;
  alumnoId: string;
  cursoId: string;
  fechaInscripcion: Date;
  ultimoAcceso: Date;
  estado: 'en-progreso' | 'completado' | 'abandonado' | 'no-iniciado';
  progresoGeneral: number; // 0-100%
  temasCompletados: TemaCompletado[];
  contenidosVistos: ContenidoVisto[];
}

export interface MarcarTemaDto {
  cursoId: string;
  unidadId: string;
  temaId: string;
  completado: boolean;
}

export interface MarcarContenidoDto {
  cursoId: string;
  temaId: string;
  contenidoId: string;
  visto: boolean;
}
