# Gestión de Preguntas de Examen

## Descripción General

Este documento describe la implementación de la gestión de preguntas dentro de los exámenes del aula virtual. Las preguntas son recursos anidados dentro de los exámenes y pueden ser de tipo opción múltiple o verdadero/falso.

## Servicio de Preguntas de Examen

### Ubicación
```
src/app/services/preguntas-examen.service.ts
```

### Estructura de DTOs

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
export class CreatePreguntaExamenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  texto: string;

  @ApiProperty({ enum: ['opcion_multiple', 'verdadero_falso'] })
  @IsEnum(['opcion_multiple', 'verdadero_falso'])
  @IsNotEmpty()
  tipo: 'opcion_multiple' | 'verdadero_falso';

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsNotEmpty()
  opciones: string[];

  @ApiProperty({ description: 'Índice de la respuesta correcta' })
  @IsNumber()
  @IsNotEmpty()
  respuestaCorrecta: number;
}
```

### Tipos de Pregunta

1. **opcion_multiple**: Pregunta con múltiples opciones donde solo una es correcta
2. **verdadero_falso**: Pregunta binaria con dos opciones (Verdadero/Falso)

## Métodos Disponibles

### 1. getPreguntasByExamen()
Obtiene todas las preguntas de un examen.

```typescript
getPreguntasByExamen(cursoId: string, examenId: string): Observable<PreguntaExamen[]>
```

**Endpoint:** `GET /api/cursos/:cursoId/examenes/:examenId/preguntas`

**Ejemplo:**
```typescript
this.preguntasExamenService.getPreguntasByExamen('curso-123', 'examen-456').subscribe({
  next: (preguntas) => console.log('Preguntas:', preguntas),
  error: (error) => console.error('Error:', error)
});
```

### 2. getPreguntaById()
Obtiene una pregunta específica por su ID.

```typescript
getPreguntaById(cursoId: string, examenId: string, preguntaId: string): Observable<PreguntaExamen>
```

**Endpoint:** `GET /api/cursos/:cursoId/examenes/:examenId/preguntas/:preguntaId`

### 3. createPregunta()
Crea una nueva pregunta en un examen.

```typescript
createPregunta(cursoId: string, examenId: string, dto: CreatePreguntaExamenDto): Observable<PreguntaExamen>
```

**Endpoint:** `POST /api/cursos/:cursoId/examenes/:examenId/preguntas`

**Ejemplo - Pregunta de Opción Múltiple:**
```typescript
const nuevaPregunta: CreatePreguntaExamenDto = {
  texto: '¿Cuál es el propósito principal de Angular?',
  tipo: 'opcion_multiple',
  opciones: [
    'Crear aplicaciones web modernas',
    'Compilar JavaScript',
    'Gestionar bases de datos',
    'Diseñar interfaces CSS'
  ],
  respuestaCorrecta: 0 // Índice de "Crear aplicaciones web modernas"
};

this.preguntasExamenService.createPregunta('123', '456', nuevaPregunta).subscribe({
  next: (pregunta) => console.log('Pregunta creada:', pregunta),
  error: (error) => console.error('Error:', error)
});
```

**Ejemplo - Pregunta Verdadero/Falso:**
```typescript
const preguntaVF: CreatePreguntaExamenDto = {
  texto: 'Angular es un framework de JavaScript desarrollado por Google',
  tipo: 'verdadero_falso',
  opciones: ['Verdadero', 'Falso'],
  respuestaCorrecta: 0 // Verdadero
};

this.preguntasExamenService.createPregunta('123', '456', preguntaVF).subscribe({
  next: (pregunta) => console.log('Pregunta V/F creada:', pregunta),
  error: (error) => console.error('Error:', error)
});
```

### 4. updatePregunta()
Actualiza completamente una pregunta existente (PUT).

```typescript
updatePregunta(
  cursoId: string, 
  examenId: string, 
  preguntaId: string, 
  dto: CreatePreguntaExamenDto
): Observable<PreguntaExamen>
```

**Endpoint:** `PUT /api/cursos/:cursoId/examenes/:examenId/preguntas/:preguntaId`

**Ejemplo:**
```typescript
const preguntaActualizada: CreatePreguntaExamenDto = {
  texto: '¿Cuál es el propósito de los componentes en Angular?',
  tipo: 'opcion_multiple',
  opciones: [
    'Crear elementos reutilizables de UI',
    'Manejar rutas',
    'Gestionar estado global',
    'Compilar TypeScript'
  ],
  respuestaCorrecta: 0
};

this.preguntasExamenService.updatePregunta('123', '456', 'pregunta-789', preguntaActualizada)
  .subscribe({
    next: (pregunta) => console.log('Pregunta actualizada:', pregunta),
    error: (error) => console.error('Error:', error)
  });
```

### 5. patchPregunta()
Actualiza parcialmente una pregunta existente (PATCH).

```typescript
patchPregunta(
  cursoId: string, 
  examenId: string, 
  preguntaId: string, 
  dto: Partial<CreatePreguntaExamenDto>
): Observable<PreguntaExamen>
```

**Endpoint:** `PATCH /api/cursos/:cursoId/examenes/:examenId/preguntas/:preguntaId`

**Ejemplo:**
```typescript
// Solo actualizar el texto de la pregunta
this.preguntasExamenService.patchPregunta('123', '456', 'pregunta-789', {
  texto: '¿Para qué sirven los componentes en Angular?'
}).subscribe({
  next: (pregunta) => console.log('Texto actualizado:', pregunta.texto),
  error: (error) => console.error('Error:', error)
});
```

### 6. deletePregunta()
Elimina una pregunta.

```typescript
deletePregunta(cursoId: string, examenId: string, preguntaId: string): Observable<void>
```

**Endpoint:** `DELETE /api/cursos/:cursoId/examenes/:examenId/preguntas/:preguntaId`

**Ejemplo:**
```typescript
this.preguntasExamenService.deletePregunta('123', '456', 'pregunta-789').subscribe({
  next: () => console.log('Pregunta eliminada exitosamente'),
  error: (error) => console.error('Error:', error)
});
```

### 7. reorderPreguntas()
Reordena las preguntas dentro de un examen.

```typescript
reorderPreguntas(
  cursoId: string, 
  examenId: string, 
  preguntaIds: string[]
): Observable<PreguntaExamen[]>
```

**Endpoint:** `PATCH /api/cursos/:cursoId/examenes/:examenId/preguntas/reorder`

**Ejemplo:**
```typescript
const nuevoOrden = ['pregunta-3', 'pregunta-1', 'pregunta-4', 'pregunta-2'];

this.preguntasExamenService.reorderPreguntas('123', '456', nuevoOrden).subscribe({
  next: (preguntas) => console.log('Preguntas reordenadas:', preguntas),
  error: (error) => console.error('Error:', error)
});
```

### 8. validarRespuesta()
Valida si la respuesta seleccionada por el estudiante es correcta.

```typescript
validarRespuesta(
  cursoId: string, 
  examenId: string, 
  preguntaId: string, 
  respuestaSeleccionada: number
): Observable<{ correcta: boolean; respuestaCorrecta: number }>
```

**Endpoint:** `POST /api/cursos/:cursoId/examenes/:examenId/preguntas/:preguntaId/validar`

**Ejemplo:**
```typescript
// El estudiante seleccionó la opción con índice 2
this.preguntasExamenService.validarRespuesta('123', '456', 'pregunta-789', 2).subscribe({
  next: (resultado) => {
    if (resultado.correcta) {
      console.log('¡Respuesta correcta!');
    } else {
      console.log(`Respuesta incorrecta. La correcta es: ${resultado.respuestaCorrecta}`);
    }
  },
  error: (error) => console.error('Error:', error)
});
```

## Integración en AdminCursosComponent

### Patrón Dual-Mode

El componente AdminCursosComponent implementa un patrón dual para preguntas:

1. **Modo Backend:** Si `curso.id` y `examen.id` existen (ambos persistidos)
2. **Modo Local:** Si cualquiera no existe (aún no guardados)

### Método guardarPregunta()

```typescript
guardarPregunta() {
  if (!this.examenSeleccionado) return;

  const examen = this.curso.examenes?.find(e => e.id === this.examenSeleccionado!.id);
  if (!examen) return;

  // Modo Backend - Actualizar pregunta existente
  if (this.curso.id && examen.id && this.nuevaPregunta.id) {
    const updateDto: CreatePreguntaExamenDto = {
      texto: this.nuevaPregunta.texto,
      tipo: this.nuevaPregunta.tipo,
      opciones: this.nuevaPregunta.opciones,
      respuestaCorrecta: this.nuevaPregunta.respuestaCorrecta
    };
    
    this.preguntasExamenService.updatePregunta(
      this.curso.id,
      examen.id,
      this.nuevaPregunta.id,
      updateDto
    ).subscribe({
      next: (preguntaActualizada) => {
        const index = examen.preguntasLista.findIndex(p => p.id === this.nuevaPregunta.id);
        if (index >= 0) {
          examen.preguntasLista[index] = preguntaActualizada;
        }
        this.mensajeExito = '✅ Pregunta actualizada exitosamente';
        this.modalPreguntaAbierto = false;
        this.nuevaPregunta = this.crearPreguntaVacia();
        this.opcionTemporal = '';
      },
      error: (error) => {
        this.error = `Error al actualizar pregunta: ${error.message}`;
      }
    });
  }
  // Modo Backend - Crear nueva pregunta
  else if (this.curso.id && examen.id && !this.nuevaPregunta.id) {
    const createDto: CreatePreguntaExamenDto = {
      texto: this.nuevaPregunta.texto,
      tipo: this.nuevaPregunta.tipo,
      opciones: this.nuevaPregunta.opciones,
      respuestaCorrecta: this.nuevaPregunta.respuestaCorrecta
    };
    
    this.preguntasExamenService.createPregunta(
      this.curso.id,
      examen.id,
      createDto
    ).subscribe({
      next: (preguntaCreada) => {
        examen.preguntasLista.push(preguntaCreada);
        this.mensajeExito = '✅ Pregunta creada exitosamente';
        this.modalPreguntaAbierto = false;
        this.nuevaPregunta = this.crearPreguntaVacia();
        this.opcionTemporal = '';
      },
      error: (error) => {
        this.error = `Error al crear pregunta: ${error.message}`;
      }
    });
  }
  // Modo Local
  else {
    const index = examen.preguntasLista.findIndex(p => p.id === this.nuevaPregunta.id);
    if (index >= 0) {
      examen.preguntasLista[index] = { ...this.nuevaPregunta };
    } else {
      const nuevaPreguntaConId = {
        ...this.nuevaPregunta,
        id: this.generarId()
      };
      examen.preguntasLista.push(nuevaPreguntaConId);
    }
    this.modalPreguntaAbierto = false;
    this.nuevaPregunta = this.crearPreguntaVacia();
    this.opcionTemporal = '';
  }
}
```

### Método eliminarPregunta()

```typescript
eliminarPregunta(examen: Examen, preguntaId: string) {
  if (!confirm('¿Estás seguro de eliminar esta pregunta?')) return;

  const examenEncontrado = this.curso.examenes?.find(e => e.id === examen.id);
  if (!examenEncontrado) return;

  // Modo Backend
  if (this.curso.id && examen.id) {
    this.preguntasExamenService.deletePregunta(this.curso.id, examen.id, preguntaId)
      .subscribe({
        next: () => {
          examenEncontrado.preguntasLista = examenEncontrado.preguntasLista.filter(
            p => p.id !== preguntaId
          );
          this.mensajeExito = '✅ Pregunta eliminada exitosamente';
        },
        error: (error) => {
          this.error = `Error al eliminar pregunta: ${error.message}`;
        }
      });
  }
  // Modo Local
  else {
    examenEncontrado.preguntasLista = examenEncontrado.preguntasLista.filter(
      p => p.id !== preguntaId
    );
  }
}
```

## Manejo de Errores

El servicio incluye un método `handleError()` con mensajes específicos:

```typescript
private handleError(error: any): Observable<never> {
  let errorMessage = 'Ocurrió un error al procesar la solicitud';
  
  if (error.error?.message) {
    errorMessage = error.error.message;
  } else if (error.status === 0) {
    errorMessage = 'No se pudo conectar con el servidor';
  } else if (error.status === 404) {
    errorMessage = 'Pregunta no encontrada';
  } else if (error.status === 400) {
    errorMessage = 'Datos de pregunta inválidos. Verifica que todos los campos requeridos estén completos.';
  }
  
  return throwError(() => ({ message: errorMessage }));
}
```

## Flujo de Trabajo Completo

### 1. Crear un Examen con Preguntas

```typescript
const nuevoExamen: CreateExamenDto = {
  titulo: 'Examen de Angular Básico',
  descripcion: 'Evaluación de conceptos fundamentales',
  fecha: '2026-02-15',
  duracion: 60,
  porcentajeAprobacion: 70,
  intentosPermitidos: 3,
  tipo: 'mixto',
  preguntasLista: [
    {
      texto: '¿Qué es un componente en Angular?',
      tipo: 'opcion_multiple',
      opciones: [
        'Un bloque de construcción reutilizable de UI',
        'Una librería externa',
        'Un archivo de estilos',
        'Un servidor backend'
      ],
      respuestaCorrecta: 0
    },
    {
      texto: 'Angular usa TypeScript por defecto',
      tipo: 'verdadero_falso',
      opciones: ['Verdadero', 'Falso'],
      respuestaCorrecta: 0
    },
    {
      texto: '¿Cuál de estos es un lifecycle hook de Angular?',
      tipo: 'opcion_multiple',
      opciones: [
        'componentDidMount',
        'ngOnInit',
        'mounted',
        'created'
      ],
      respuestaCorrecta: 1
    }
  ]
};

this.examenesService.createExamen('curso-123', nuevoExamen).subscribe({
  next: (examen) => console.log('Examen creado con preguntas:', examen)
});
```

### 2. Agregar Pregunta a Examen Existente

```typescript
if (this.curso.id && examen.id) {
  const nuevaPregunta: CreatePreguntaExamenDto = {
    texto: '¿Qué directiva se usa para iterar sobre arrays?',
    tipo: 'opcion_multiple',
    opciones: ['*ngIf', '*ngFor', '*ngSwitch', '*ngModel'],
    respuestaCorrecta: 1
  };
  
  this.preguntasExamenService.createPregunta(
    this.curso.id,
    examen.id,
    nuevaPregunta
  ).subscribe({
    next: (preguntaCreada) => {
      examen.preguntasLista.push(preguntaCreada);
      this.mensajeExito = 'Pregunta agregada';
    }
  });
}
```

### 3. Validar Respuesta de Estudiante

```typescript
// Durante la realización del examen
validarRespuestaEstudiante(preguntaId: string, respuestaSeleccionada: number) {
  this.preguntasExamenService.validarRespuesta(
    this.curso.id!,
    this.examen.id!,
    preguntaId,
    respuestaSeleccionada
  ).subscribe({
    next: (resultado) => {
      if (resultado.correcta) {
        this.puntaje++;
        this.mostrarFeedback('¡Correcto!', 'success');
      } else {
        this.mostrarFeedback(
          `Incorrecto. La respuesta correcta era la opción ${resultado.respuestaCorrecta + 1}`,
          'error'
        );
      }
    }
  });
}
```

### 4. Reordenar Preguntas (Drag & Drop)

```typescript
// Después de un evento de drag & drop
onPreguntasReordered(nuevoOrden: string[]) {
  if (this.curso.id && this.examen.id) {
    this.preguntasExamenService.reorderPreguntas(
      this.curso.id,
      this.examen.id,
      nuevoOrden
    ).subscribe({
      next: (preguntasReordenadas) => {
        this.examen.preguntasLista = preguntasReordenadas;
        this.mensajeExito = 'Preguntas reordenadas';
      }
    });
  }
}
```

## Buenas Prácticas

### 1. Validación de Opciones
```typescript
// Asegurarse de que haya al menos 2 opciones
if (this.nuevaPregunta.opciones.length < 2) {
  this.error = 'Debe haber al menos 2 opciones';
  return;
}

// Validar que respuestaCorrecta esté en rango
if (this.nuevaPregunta.respuestaCorrecta >= this.nuevaPregunta.opciones.length) {
  this.error = 'Índice de respuesta correcta inválido';
  return;
}
```

### 2. Preguntas de Verdadero/Falso
```typescript
crearPreguntaVerdaderoFalso(): CreatePreguntaExamenDto {
  return {
    texto: '',
    tipo: 'verdadero_falso',
    opciones: ['Verdadero', 'Falso'],
    respuestaCorrecta: 0
  };
}
```

### 3. Preguntas de Opción Múltiple
```typescript
crearPreguntaOpcionMultiple(): CreatePreguntaExamenDto {
  return {
    texto: '',
    tipo: 'opcion_multiple',
    opciones: ['', '', '', ''], // 4 opciones por defecto
    respuestaCorrecta: 0
  };
}
```

## Validaciones

### Frontend
- **texto**: Requerido, no vacío
- **tipo**: Debe ser 'opcion_multiple' o 'verdadero_falso'
- **opciones**: Array requerido, mínimo 2 elementos
- **respuestaCorrecta**: Número requerido, debe estar entre 0 y opciones.length-1

### Backend (class-validator)
```typescript
@IsString()
@IsNotEmpty()
texto: string;

@IsEnum(['opcion_multiple', 'verdadero_falso'])
@IsNotEmpty()
tipo: 'opcion_multiple' | 'verdadero_falso';

@IsArray()
@IsNotEmpty()
opciones: string[];

@IsNumber()
@IsNotEmpty()
respuestaCorrecta: number;
```

## Jerarquía Completa

```
Curso
├── Examenes[]
│   ├── Preguntas[]
│   │   ├── texto: string
│   │   ├── tipo: 'opcion_multiple' | 'verdadero_falso'
│   │   ├── opciones: string[]
│   │   └── respuestaCorrecta: number
│   └── ...
└── ...
```

## Endpoints Completos

```
POST   /api/cursos/:cursoId/examenes/:examenId/preguntas
GET    /api/cursos/:cursoId/examenes/:examenId/preguntas
GET    /api/cursos/:cursoId/examenes/:examenId/preguntas/:preguntaId
PUT    /api/cursos/:cursoId/examenes/:examenId/preguntas/:preguntaId
PATCH  /api/cursos/:cursoId/examenes/:examenId/preguntas/:preguntaId
DELETE /api/cursos/:cursoId/examenes/:examenId/preguntas/:preguntaId
PATCH  /api/cursos/:cursoId/examenes/:examenId/preguntas/reorder
POST   /api/cursos/:cursoId/examenes/:examenId/preguntas/:preguntaId/validar
```

## Resumen

- ✅ **Servicio creado:** PreguntasExamenService con métodos CRUD completos
- ✅ **Componente actualizado:** AdminCursosComponent con integración dual-mode
- ✅ **DTOs validados:** CreatePreguntaExamenDto según backend
- ✅ **Tipos de pregunta:** opcion_multiple, verdadero_falso
- ✅ **Validación de respuestas:** Sistema de verificación automática
- ✅ **Reordenamiento:** Soporte para cambiar el orden de preguntas
- ✅ **Manejo de errores:** Mensajes descriptivos y notificaciones

La gestión de preguntas de examen completa la jerarquía: **Cursos → Exámenes → Preguntas** con integración total al backend NestJS.
