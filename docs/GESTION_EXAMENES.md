# Gestión de Exámenes

## Descripción General

Este documento describe la implementación de la gestión de exámenes dentro de los cursos del aula virtual. Los exámenes permiten evaluar el conocimiento de los estudiantes mediante preguntas de opción múltiple o verdadero/falso.

## Servicio de Exámenes

### Ubicación
```
src/app/services/examenes.service.ts
```

### Estructura de DTOs

#### CreateExamenDto
```typescript
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
```

#### CreatePreguntaExamenDto
```typescript
export interface CreatePreguntaExamenDto {
  texto: string;
  tipo: 'opcion_multiple' | 'verdadero_falso';
  opciones: string[];
  respuestaCorrecta: number; // índice de la respuesta correcta
}
```

#### Validaciones Backend (NestJS)
```typescript
export class CreateExamenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fecha: string;

  @ApiProperty({ description: 'Duración en minutos' })
  @IsNumber()
  @IsNotEmpty()
  duracion: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  porcentajeAprobacion: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  intentosPermitidos: number;

  @ApiProperty({ enum: ['opcion_multiple', 'verdadero_falso', 'mixto'] })
  @IsEnum(['opcion_multiple', 'verdadero_falso', 'mixto'])
  @IsNotEmpty()
  tipo: 'opcion_multiple' | 'verdadero_falso' | 'mixto';

  @ApiPropertyOptional({ type: [CreatePreguntaExamenDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePreguntaExamenDto)
  @IsOptional()
  preguntasLista?: CreatePreguntaExamenDto[];
}
```

### Tipos de Examen

1. **opcion_multiple**: Solo preguntas de opción múltiple
2. **verdadero_falso**: Solo preguntas de verdadero/falso
3. **mixto**: Combinación de ambos tipos

## Métodos Disponibles

### 1. getExamenesByCurso()
Obtiene todos los exámenes de un curso.

```typescript
getExamenesByCurso(cursoId: string): Observable<Examen[]>
```

**Endpoint:** `GET /api/cursos/:cursoId/examenes`

**Ejemplo:**
```typescript
this.examenesService.getExamenesByCurso('curso-123').subscribe({
  next: (examenes) => console.log('Exámenes:', examenes),
  error: (error) => console.error('Error:', error)
});
```

### 2. getExamenById()
Obtiene un examen específico por su ID.

```typescript
getExamenById(cursoId: string, examenId: string): Observable<Examen>
```

**Endpoint:** `GET /api/cursos/:cursoId/examenes/:examenId`

### 3. createExamen()
Crea un nuevo examen en un curso.

```typescript
createExamen(cursoId: string, dto: CreateExamenDto): Observable<Examen>
```

**Endpoint:** `POST /api/cursos/:cursoId/examenes`

**Ejemplo - Examen de Opción Múltiple:**
```typescript
const nuevoExamen: CreateExamenDto = {
  titulo: 'Examen Final - Angular',
  descripcion: 'Evaluación de conocimientos de Angular',
  fecha: '2026-02-15',
  duracion: 60, // 60 minutos
  porcentajeAprobacion: 70,
  intentosPermitidos: 3,
  tipo: 'opcion_multiple',
  preguntasLista: [
    {
      texto: '¿Qué es Angular?',
      tipo: 'opcion_multiple',
      opciones: [
        'Un framework de JavaScript',
        'Una librería de CSS',
        'Un lenguaje de programación',
        'Un sistema operativo'
      ],
      respuestaCorrecta: 0 // Índice de la respuesta correcta
    },
    {
      texto: '¿Angular usa TypeScript?',
      tipo: 'verdadero_falso',
      opciones: ['Verdadero', 'Falso'],
      respuestaCorrecta: 0
    }
  ]
};

this.examenesService.createExamen('123', nuevoExamen).subscribe({
  next: (examen) => console.log('Examen creado:', examen),
  error: (error) => console.error('Error:', error)
});
```

**Ejemplo - Examen Mixto:**
```typescript
const examenMixto: CreateExamenDto = {
  titulo: 'Evaluación de TypeScript',
  descripcion: 'Conceptos básicos y avanzados',
  fecha: '2026-02-20',
  duracion: 45,
  porcentajeAprobacion: 75,
  intentosPermitidos: 2,
  tipo: 'mixto',
  preguntasLista: [
    {
      texto: 'TypeScript es un superconjunto de JavaScript',
      tipo: 'verdadero_falso',
      opciones: ['Verdadero', 'Falso'],
      respuestaCorrecta: 0
    },
    {
      texto: '¿Cuál de estos NO es un tipo primitivo en TypeScript?',
      tipo: 'opcion_multiple',
      opciones: ['string', 'number', 'array', 'boolean'],
      respuestaCorrecta: 2
    }
  ]
};

this.examenesService.createExamen('123', examenMixto).subscribe({
  next: (examen) => console.log('Examen mixto creado:', examen),
  error: (error) => console.error('Error:', error)
});
```

### 4. updateExamen()
Actualiza completamente un examen existente (PUT).

```typescript
updateExamen(cursoId: string, examenId: string, dto: CreateExamenDto): Observable<Examen>
```

**Endpoint:** `PUT /api/cursos/:cursoId/examenes/:examenId`

**Ejemplo:**
```typescript
const examenActualizado: CreateExamenDto = {
  titulo: 'Examen Final - Angular (Actualizado)',
  descripcion: 'Evaluación completa de Angular',
  fecha: '2026-02-16', // Nueva fecha
  duracion: 90, // Más tiempo
  porcentajeAprobacion: 65, // Menor porcentaje
  intentosPermitidos: 3,
  tipo: 'mixto',
  preguntasLista: [...] // Preguntas actualizadas
};

this.examenesService.updateExamen('123', 'examen-456', examenActualizado).subscribe({
  next: (examen) => console.log('Examen actualizado:', examen),
  error: (error) => console.error('Error:', error)
});
```

### 5. patchExamen()
Actualiza parcialmente un examen existente (PATCH).

```typescript
patchExamen(cursoId: string, examenId: string, dto: Partial<CreateExamenDto>): Observable<Examen>
```

**Endpoint:** `PATCH /api/cursos/:cursoId/examenes/:examenId`

**Ejemplo:**
```typescript
// Solo actualizar la fecha y duración
this.examenesService.patchExamen('123', 'examen-456', {
  fecha: '2026-03-01',
  duracion: 120
}).subscribe({
  next: (examen) => console.log('Examen actualizado:', examen),
  error: (error) => console.error('Error:', error)
});
```

### 6. deleteExamen()
Elimina un examen.

```typescript
deleteExamen(cursoId: string, examenId: string): Observable<void>
```

**Endpoint:** `DELETE /api/cursos/:cursoId/examenes/:examenId`

**Ejemplo:**
```typescript
this.examenesService.deleteExamen('123', 'examen-456').subscribe({
  next: () => console.log('Examen eliminado exitosamente'),
  error: (error) => console.error('Error:', error)
});
```

### 7. getEstadisticasExamen()
Obtiene estadísticas de un examen (calificaciones, intentos, etc.).

```typescript
getEstadisticasExamen(cursoId: string, examenId: string): Observable<any>
```

**Endpoint:** `GET /api/cursos/:cursoId/examenes/:examenId/estadisticas`

**Ejemplo:**
```typescript
this.examenesService.getEstadisticasExamen('123', 'examen-456').subscribe({
  next: (stats) => {
    console.log('Promedio:', stats.promedio);
    console.log('Aprobados:', stats.aprobados);
    console.log('Reprobados:', stats.reprobados);
  },
  error: (error) => console.error('Error:', error)
});
```

### 8. calificarExamen()
Califica automáticamente un examen basado en las respuestas del estudiante.

```typescript
calificarExamen(cursoId: string, examenId: string, respuestas: any): Observable<any>
```

**Endpoint:** `POST /api/cursos/:cursoId/examenes/:examenId/calificar`

**Ejemplo:**
```typescript
const respuestasEstudiante = {
  pregunta1: 0, // Índice de la respuesta seleccionada
  pregunta2: 1,
  pregunta3: 2
};

this.examenesService.calificarExamen('123', 'examen-456', respuestasEstudiante).subscribe({
  next: (resultado) => {
    console.log('Calificación:', resultado.calificacion);
    console.log('Aprobado:', resultado.aprobado);
    console.log('Respuestas correctas:', resultado.correctas);
    console.log('Respuestas incorrectas:', resultado.incorrectas);
  },
  error: (error) => console.error('Error:', error)
});
```

## Integración en AdminCursosComponent

### Patrón Dual-Mode

El componente AdminCursosComponent implementa un patrón dual para exámenes:

1. **Modo Backend:** Si `curso.id` existe (curso persistido)
2. **Modo Local:** Si `curso.id` no existe (curso no guardado aún)

### Método guardarExamen()

```typescript
guardarExamen() {
  if (!this.curso.examenes) {
    this.curso.examenes = [];
  }

  // Modo Backend - Actualizar examen existente
  if (this.curso.id && this.nuevoExamen.id) {
    const updateDto: CreateExamenDto = {
      titulo: this.nuevoExamen.titulo,
      descripcion: this.nuevoExamen.descripcion,
      fecha: this.nuevoExamen.fecha,
      duracion: this.nuevoExamen.duracion,
      porcentajeAprobacion: this.nuevoExamen.porcentajeAprobacion,
      intentosPermitidos: this.nuevoExamen.intentosPermitidos,
      tipo: this.nuevoExamen.tipo,
      preguntasLista: this.nuevoExamen.preguntasLista?.map(p => ({
        texto: p.texto,
        tipo: p.tipo,
        opciones: p.opciones,
        respuestaCorrecta: p.respuestaCorrecta
      }))
    };
    
    this.examenesService.updateExamen(this.curso.id, this.nuevoExamen.id, updateDto)
      .subscribe({
        next: (examenActualizado) => {
          const index = this.curso.examenes!.findIndex(e => e.id === this.nuevoExamen.id);
          if (index >= 0) {
            this.curso.examenes![index] = examenActualizado;
          }
          this.mensajeExito = '✅ Examen actualizado exitosamente';
          this.modalExamenAbierto = false;
        },
        error: (error) => {
          this.error = `Error al actualizar examen: ${error.message}`;
        }
      });
  }
  // Modo Backend - Crear nuevo examen
  else if (this.curso.id && !this.nuevoExamen.id) {
    const createDto: CreateExamenDto = {
      titulo: this.nuevoExamen.titulo,
      descripcion: this.nuevoExamen.descripcion,
      fecha: this.nuevoExamen.fecha,
      duracion: this.nuevoExamen.duracion,
      porcentajeAprobacion: this.nuevoExamen.porcentajeAprobacion,
      intentosPermitidos: this.nuevoExamen.intentosPermitidos,
      tipo: this.nuevoExamen.tipo,
      preguntasLista: this.nuevoExamen.preguntasLista?.map(p => ({
        texto: p.texto,
        tipo: p.tipo,
        opciones: p.opciones,
        respuestaCorrecta: p.respuestaCorrecta
      }))
    };
    
    this.examenesService.createExamen(this.curso.id, createDto)
      .subscribe({
        next: (examenCreado) => {
          this.curso.examenes!.push(examenCreado);
          this.mensajeExito = '✅ Examen creado exitosamente';
          this.modalExamenAbierto = false;
        },
        error: (error) => {
          this.error = `Error al crear examen: ${error.message}`;
        }
      });
  }
  // Modo Local
  else {
    const index = this.curso.examenes.findIndex(e => e.id === this.nuevoExamen.id);
    if (index >= 0) {
      this.curso.examenes[index] = { ...this.nuevoExamen };
    } else {
      const nuevoExamenConId = {
        ...this.nuevoExamen,
        id: this.generarId()
      };
      this.curso.examenes.push(nuevoExamenConId);
    }
    this.modalExamenAbierto = false;
  }
}
```

### Método eliminarExamen()

```typescript
eliminarExamen(examen: Examen) {
  if (!confirm('¿Estás seguro de eliminar este examen?')) return;

  // Modo Backend
  if (this.curso.id && examen.id) {
    this.examenesService.deleteExamen(this.curso.id, examen.id)
      .subscribe({
        next: () => {
          if (this.curso.examenes) {
            this.curso.examenes = this.curso.examenes.filter(e => e.id !== examen.id);
          }
          this.mensajeExito = '✅ Examen eliminado exitosamente';
        },
        error: (error) => {
          this.error = `Error al eliminar examen: ${error.message}`;
        }
      });
  }
  // Modo Local
  else {
    if (this.curso.examenes) {
      this.curso.examenes = this.curso.examenes.filter(e => e.id !== examen.id);
    }
  }
}
```

## Manejo de Errores

El servicio incluye un método `handleError()` que proporciona mensajes descriptivos:

```typescript
private handleError(error: any): Observable<never> {
  let errorMessage = 'Ocurrió un error al procesar la solicitud';
  
  if (error.error?.message) {
    errorMessage = error.error.message;
  } else if (error.status === 0) {
    errorMessage = 'No se pudo conectar con el servidor';
  } else if (error.status === 404) {
    errorMessage = 'Examen no encontrado';
  } else if (error.status === 400) {
    errorMessage = 'Datos de examen inválidos';
  }
  
  return throwError(() => ({ message: errorMessage }));
}
```

## Flujo de Trabajo Completo

### 1. Crear un Curso con Exámenes

```typescript
const nuevoCurso: CreateCursoDto = {
  titulo: 'Curso Completo de Angular',
  descripcion: 'Aprende Angular desde cero',
  instructor: 'María García',
  nivel: 'Intermedio',
  imagen: 'https://example.com/angular.jpg',
  categoria: 'Desarrollo Web',
  estudiantes: 0,
  duracionTotal: 0,
  unidades: [],
  tareas: [],
  examenes: [
    {
      titulo: 'Examen Parcial',
      descripcion: 'Evaluación de la primera mitad del curso',
      fecha: '2026-02-15',
      duracion: 45,
      porcentajeAprobacion: 70,
      intentosPermitidos: 2,
      tipo: 'mixto',
      preguntasLista: [
        {
          texto: '¿Qué significa SPA?',
          tipo: 'opcion_multiple',
          opciones: [
            'Single Page Application',
            'Simple Page App',
            'Standard Programming App',
            'Server Page Application'
          ],
          respuestaCorrecta: 0
        },
        {
          texto: 'Angular usa componentes para construir la UI',
          tipo: 'verdadero_falso',
          opciones: ['Verdadero', 'Falso'],
          respuestaCorrecta: 0
        }
      ]
    }
  ]
};

this.cursosService.createCurso(nuevoCurso).subscribe({
  next: (cursoCreado) => {
    console.log('Curso creado con exámenes:', cursoCreado);
  }
});
```

### 2. Agregar Examen a Curso Existente

```typescript
if (this.curso.id) {
  const nuevoExamen: CreateExamenDto = {
    titulo: 'Examen Final',
    descripcion: 'Evaluación completa del curso',
    fecha: '2026-03-15',
    duracion: 90,
    porcentajeAprobacion: 75,
    intentosPermitidos: 1,
    tipo: 'opcion_multiple',
    preguntasLista: [
      {
        texto: '¿Cuál es el propósito de NgModule?',
        tipo: 'opcion_multiple',
        opciones: [
          'Organizar la aplicación en bloques cohesivos',
          'Crear componentes',
          'Manejar rutas',
          'Compilar TypeScript'
        ],
        respuestaCorrecta: 0
      }
    ]
  };
  
  this.examenesService.createExamen(this.curso.id, nuevoExamen).subscribe({
    next: (examenCreado) => {
      if (!this.curso.examenes) {
        this.curso.examenes = [];
      }
      this.curso.examenes.push(examenCreado);
      this.mensajeExito = 'Examen agregado';
    }
  });
}
```

### 3. Calificar un Examen de Estudiante

```typescript
// Sistema de calificación automática
calificarExamenEstudiante(examenId: string, respuestas: number[]) {
  const respuestasFormateadas = respuestas.reduce((acc, resp, index) => {
    acc[`pregunta${index + 1}`] = resp;
    return acc;
  }, {} as any);

  this.examenesService.calificarExamen(
    this.curso.id!,
    examenId,
    respuestasFormateadas
  ).subscribe({
    next: (resultado) => {
      console.log(`Calificación: ${resultado.calificacion}/100`);
      console.log(`Estado: ${resultado.aprobado ? 'APROBADO' : 'REPROBADO'}`);
      
      if (resultado.aprobado) {
        this.mensajeExito = `¡Felicidades! Aprobaste con ${resultado.calificacion}`;
      } else {
        this.error = `No aprobaste. Obtuviste ${resultado.calificacion}. Necesitas ${this.examen.porcentajeAprobacion}`;
      }
    }
  });
}
```

## Validaciones

### Frontend
- **titulo**: Requerido, no vacío
- **descripcion**: Requerido, no vacío
- **fecha**: Requerido (formato ISO: YYYY-MM-DD)
- **duracion**: Requerido, número positivo (en minutos)
- **porcentajeAprobacion**: Requerido, número entre 0-100
- **intentosPermitidos**: Requerido, número positivo
- **tipo**: Debe ser 'opcion_multiple', 'verdadero_falso' o 'mixto'
- **preguntasLista**: Opcional, array de preguntas

### Backend (class-validator)
```typescript
@IsString()
@IsNotEmpty()
titulo: string;

@IsNumber()
@IsNotEmpty()
duracion: number;

@IsNumber()
@IsNotEmpty()
porcentajeAprobacion: number;

@IsEnum(['opcion_multiple', 'verdadero_falso', 'mixto'])
@IsNotEmpty()
tipo: 'opcion_multiple' | 'verdadero_falso' | 'mixto';

@IsArray()
@ValidateNested({ each: true })
@Type(() => CreatePreguntaExamenDto)
@IsOptional()
preguntasLista?: CreatePreguntaExamenDto[];
```

## Endpoints Completos

```
POST   /api/cursos/:cursoId/examenes
GET    /api/cursos/:cursoId/examenes
GET    /api/cursos/:cursoId/examenes/:examenId
PUT    /api/cursos/:cursoId/examenes/:examenId
PATCH  /api/cursos/:cursoId/examenes/:examenId
DELETE /api/cursos/:cursoId/examenes/:examenId
GET    /api/cursos/:cursoId/examenes/:examenId/estadisticas
POST   /api/cursos/:cursoId/examenes/:examenId/calificar
```

## Resumen

- ✅ **Servicio creado:** ExamenesService con métodos CRUD completos
- ✅ **Componente actualizado:** AdminCursosComponent con integración dual-mode
- ✅ **DTOs validados:** CreateExamenDto y CreatePreguntaExamenDto
- ✅ **Tipos de examen:** opcion_multiple, verdadero_falso, mixto
- ✅ **Calificación automática:** Sistema de evaluación integrado
- ✅ **Estadísticas:** Endpoint para análisis de resultados
- ✅ **Manejo de errores:** Mensajes descriptivos y notificaciones

La gestión de exámenes está completamente integrada con el backend NestJS siguiendo el patrón dual-mode establecido.
