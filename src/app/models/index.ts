export * from './curso.model';
export * from './progreso.model';
export * from './alumno.model';

// Re-exportaciones específicas para mayor claridad
export type {
  Curso,
  Unidad,
  Tema,
  Contenido,
  Tarea,
  Examen,
  PreguntaExamen,
  CreateCursoDto,
  UpdateCursoDto,
  CreateUnidadDto,
  UpdateUnidadDto,
  CreateTemaDto,
  UpdateTemaDto,
  CreateTareaDto,
  UpdateTareaDto,
  CreateExamenDto,
  UpdateExamenDto
} from './curso.model';

export type {
  Alumno,
  AlumnoConCursos,
  AsignacionCurso,
  EstadoAlumno,
  EstadoAsignacionCurso
} from './alumno.model';

export type {
  ProgresoAlumno,
  ProgresoCurso,
  ProgresoUnidad,
  TemaCompletado,
  ContenidoVisto,
  MarcarTemaDto,
  MarcarContenidoDto
} from './progreso.model';

