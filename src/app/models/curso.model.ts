export interface Contenido {
  id?: string;
  tipo: 'video' | 'texto' | 'imagen' | 'documento';
  titulo: string;
  url?: string;
  contenido?: string;
  duracion?: number; // en minutos para videos
}

export interface Tema {
  id?: string;
  titulo: string;
  descripcion: string;
  duracionEstimada: number; // en minutos
  contenidos?: Contenido[];
}

export interface Unidad {
  id?: string;
  numero: number;
  titulo: string;
  descripcion: string;
  temas?: Tema[];
}

// DTOs para Contenidos
export interface CreateContenidoDto {
  tipo: 'video' | 'texto' | 'imagen' | 'documento';
  titulo: string;
  url?: string;
  contenido?: string;
  duracion?: number;
}

export interface UpdateContenidoDto extends Partial<CreateContenidoDto> {}

// DTOs para Temas
export interface CreateTemaDto {
  titulo: string;
  descripcion: string;
  duracionEstimada: number; // en minutos
  contenidos?: CreateContenidoDto[];
}

export interface UpdateTemaDto extends Partial<CreateTemaDto> {}

// DTOs para Unidades
export interface CreateUnidadDto {
  numero: number;
  titulo: string;
  descripcion: string;
  temas?: CreateTemaDto[];
}

export interface UpdateUnidadDto extends Partial<CreateUnidadDto> {}

// DTOs para Preguntas de Examen
export interface CreatePreguntaExamenDto {
  texto: string;
  tipo: 'opcion_multiple' | 'verdadero_falso';
  opciones: string[];
  respuestaCorrecta: number; // índice de la respuesta correcta
}

export interface UpdatePreguntaExamenDto extends Partial<CreatePreguntaExamenDto> {}

export interface PreguntaExamen {
  id?: string;
  texto: string;
  tipo: 'opcion_multiple' | 'verdadero_falso';
  opciones: string[];
  respuestaCorrecta: number; // índice de la respuesta correcta
}

export interface Examen {
  id?: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  duracion: number;
  preguntasLista: PreguntaExamen[];
  porcentajeAprobacion: number;
  intentosPermitidos: number;
  tipo: 'opcion_multiple' | 'verdadero_falso' | 'mixto';
}

export interface Tarea {
  id?: string;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  puntosPosibles: number;
  prioridad: 'alta' | 'media' | 'baja';
}

export interface Curso {
  id?: string;
  titulo: string;
  descripcion: string;
  instructor: string;
  nivel: 'Principiante' | 'Intermedio' | 'Avanzado';
  imagen: string;
  categoria: string;
  estudiantes?: number;
  duracionTotal?: number; // en horas
  unidades?: Unidad[];
  tareas?: Tarea[];
  examenes?: Examen[];
}

export interface CreateCursoDto {
  titulo: string;
  descripcion: string;
  instructor: string;
  nivel: 'Principiante' | 'Intermedio' | 'Avanzado';
  imagen: string;
  categoria: string;
  estudiantes?: number;
  duracionTotal?: number;
  unidades?: CreateUnidadDto[];
  tareas?: Tarea[];
  examenes?: Examen[];
}

export interface UpdateCursoDto extends Partial<CreateCursoDto> {}

// DTOs para Tareas
export interface CreateTareaDto {
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  puntosPosibles: number;
  prioridad: 'alta' | 'media' | 'baja';
}

export interface UpdateTareaDto extends Partial<CreateTareaDto> {}

// DTOs para Exámenes
export interface CreateExamenDto {
  titulo: string;
  descripcion: string;
  fecha: string;
  duracion: number; // en minutos
  porcentajeAprobacion: number;
  intentosPermitidos: number;
  tipo: 'opcion_multiple' | 'verdadero_falso' | 'mixto';
  preguntasLista?: CreatePreguntaExamenDto[];
}

export interface UpdateExamenDto extends Partial<CreateExamenDto> {}
