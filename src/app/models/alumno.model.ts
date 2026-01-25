import { Curso } from './curso.model';

export type EstadoAlumno = 'activo' | 'inactivo';
export type EstadoAsignacionCurso = 'pendiente' | 'activo' | 'completado';

export interface Alumno {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  fechaRegistro?: string | Date;
  estado: EstadoAlumno;
}

export interface AsignacionCurso {
  id: string;
  alumnoId: string;
  cursoId: string;
  fechaAsignacion: string;
  progreso: number;
  estado: EstadoAsignacionCurso;
  curso?: {
    id?: string;
    titulo?: string;
    categoria?: string;
    instructor?: string;
    imagen?: string;
  };
  alumno?: {
    id?: string;
    nombre?: string;
    email?: string;
  };
}

export interface AlumnoConCursos extends Alumno {
  cursosAsignados?: Curso[];
}
