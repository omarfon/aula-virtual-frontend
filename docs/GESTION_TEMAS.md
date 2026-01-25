# Gestión de Temas

## Descripción General

Este documento describe la implementación de la gestión de temas dentro de las unidades del aula virtual. Los temas son recursos anidados dentro de las unidades y contienen contenidos educativos.

## Servicio de Temas

### Ubicación
```
src/app/services/temas.service.ts
```

### Estructura de DTOs

#### CreateTemaDto
```typescript
export interface CreateTemaDto {
  titulo: string;
  descripcion: string;
  duracionEstimada: number;
  contenidos?: CreateContenidoDto[];
}
```

#### CreateContenidoDto
```typescript
export interface CreateContenidoDto {
  tipo: 'video' | 'lectura' | 'documento' | 'quiz';
  titulo: string;
  url?: string;
  contenido?: string;
  duracion?: number;
}
```

### Métodos Disponibles

#### 1. getTemasByUnidad()
Obtiene todos los temas de una unidad específica.

```typescript
getTemasByUnidad(cursoId: string, unidadId: string): Observable<Tema[]>
```

**Endpoint:** `GET /api/cursos/:cursoId/unidades/:unidadId/temas`

**Ejemplo:**
```typescript
this.temasService.getTemasByUnidad('123', '456').subscribe({
  next: (temas) => console.log('Temas:', temas),
  error: (error) => console.error('Error:', error)
});
```

#### 2. getTemaById()
Obtiene un tema específico por su ID.

```typescript
getTemaById(cursoId: string, unidadId: string, temaId: string): Observable<Tema>
```

**Endpoint:** `GET /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId`

#### 3. createTema()
Crea un nuevo tema en una unidad.

```typescript
createTema(cursoId: string, unidadId: string, dto: CreateTemaDto): Observable<Tema>
```

**Endpoint:** `POST /api/cursos/:cursoId/unidades/:unidadId/temas`

**Ejemplo:**
```typescript
const nuevoTema: CreateTemaDto = {
  titulo: 'Introducción a Angular',
  descripcion: 'Conceptos básicos del framework',
  duracionEstimada: 45,
  contenidos: [
    {
      tipo: 'video',
      titulo: 'Video introductorio',
      url: 'https://example.com/video.mp4',
      duracion: 30
    }
  ]
};

this.temasService.createTema('123', '456', nuevoTema).subscribe({
  next: (tema) => console.log('Tema creado:', tema),
  error: (error) => console.error('Error:', error)
});
```

#### 4. updateTema()
Actualiza completamente un tema existente (PUT).

```typescript
updateTema(cursoId: string, unidadId: string, temaId: string, dto: CreateTemaDto): Observable<Tema>
```

**Endpoint:** `PUT /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId`

#### 5. patchTema()
Actualiza parcialmente un tema existente (PATCH).

```typescript
patchTema(cursoId: string, unidadId: string, temaId: string, dto: Partial<CreateTemaDto>): Observable<Tema>
```

**Endpoint:** `PATCH /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId`

**Ejemplo:**
```typescript
// Solo actualizar el título
this.temasService.patchTema('123', '456', '789', {
  titulo: 'Nuevo título del tema'
}).subscribe({
  next: (tema) => console.log('Tema actualizado:', tema),
  error: (error) => console.error('Error:', error)
});
```

#### 6. deleteTema()
Elimina un tema.

```typescript
deleteTema(cursoId: string, unidadId: string, temaId: string): Observable<void>
```

**Endpoint:** `DELETE /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId`

**Ejemplo:**
```typescript
this.temasService.deleteTema('123', '456', '789').subscribe({
  next: () => console.log('Tema eliminado exitosamente'),
  error: (error) => console.error('Error:', error)
});
```

#### 7. reorderTemas()
Reordena los temas dentro de una unidad.

```typescript
reorderTemas(cursoId: string, unidadId: string, temaIds: string[]): Observable<Tema[]>
```

**Endpoint:** `PATCH /api/cursos/:cursoId/unidades/:unidadId/temas/reorder`

**Ejemplo:**
```typescript
const nuevoOrden = ['tema-3', 'tema-1', 'tema-2'];

this.temasService.reorderTemas('123', '456', nuevoOrden).subscribe({
  next: (temas) => console.log('Temas reordenados:', temas),
  error: (error) => console.error('Error:', error)
});
```

## Integración en AdminCursosComponent

### Patrón Dual-Mode

El componente AdminCursosComponent implementa un patrón dual-mode que determina si las operaciones se realizan localmente o en el backend:

1. **Modo Backend:** Si el curso y la unidad tienen ID (están persistidos)
2. **Modo Local:** Si el curso o la unidad no tienen ID (aún no se han guardado)

### Método guardarTema()

```typescript
guardarTema() {
  if (!this.unidadSeleccionada) return;
  
  const unidad = this.curso.unidades?.find(u => u.id === this.unidadSeleccionada!.id);
  if (!unidad) return;

  // Modo Backend - Actualizar tema existente
  if (this.curso.id && unidad.id && this.nuevoTema.id) {
    const updateDto: CreateTemaDto = {
      titulo: this.nuevoTema.titulo,
      descripcion: this.nuevoTema.descripcion,
      duracionEstimada: this.nuevoTema.duracionEstimada,
      contenidos: this.nuevoTema.contenidos
    };
    
    this.temasService.updateTema(this.curso.id, unidad.id, this.nuevoTema.id, updateDto)
      .subscribe({
        next: (temaActualizado) => {
          // Actualizar en el array local
          const index = unidad.temas.findIndex(t => t.id === this.nuevoTema.id);
          if (index >= 0) {
            unidad.temas[index] = temaActualizado;
          }
          this.mensajeExito = '✅ Tema actualizado exitosamente';
          this.modalTemaAbierto = false;
        },
        error: (error) => {
          this.error = `Error al actualizar tema: ${error.message}`;
        }
      });
  }
  // Modo Backend - Crear nuevo tema
  else if (this.curso.id && unidad.id && !this.nuevoTema.id) {
    const createDto: CreateTemaDto = {
      titulo: this.nuevoTema.titulo,
      descripcion: this.nuevoTema.descripcion,
      duracionEstimada: this.nuevoTema.duracionEstimada,
      contenidos: this.nuevoTema.contenidos
    };
    
    this.temasService.createTema(this.curso.id, unidad.id, createDto)
      .subscribe({
        next: (temaCreado) => {
          unidad.temas.push(temaCreado);
          this.mensajeExito = '✅ Tema creado exitosamente';
          this.modalTemaAbierto = false;
        },
        error: (error) => {
          this.error = `Error al crear tema: ${error.message}`;
        }
      });
  }
  // Modo Local
  else {
    const index = unidad.temas.findIndex(t => t.id === this.nuevoTema.id);
    if (index >= 0) {
      unidad.temas[index] = { ...this.nuevoTema };
    } else {
      const nuevoTemaConId = {
        ...this.nuevoTema,
        id: this.generarId()
      };
      unidad.temas.push(nuevoTemaConId);
    }
    this.modalTemaAbierto = false;
  }
}
```

### Método eliminarTema()

```typescript
eliminarTema(unidad: Unidad, temaId: string) {
  if (!confirm('¿Estás seguro de eliminar este tema?')) return;

  const unidadCurso = this.curso.unidades?.find(u => u.id === unidad.id);
  if (!unidadCurso) return;

  // Modo Backend
  if (this.curso.id && unidad.id) {
    this.temasService.deleteTema(this.curso.id, unidad.id, temaId)
      .subscribe({
        next: () => {
          unidadCurso.temas = unidadCurso.temas.filter(t => t.id !== temaId);
          this.mensajeExito = '✅ Tema eliminado exitosamente';
          this.calcularDuracionTotal();
        },
        error: (error) => {
          this.error = `Error al eliminar tema: ${error.message}`;
        }
      });
  }
  // Modo Local
  else {
    unidadCurso.temas = unidadCurso.temas.filter(t => t.id !== temaId);
    this.calcularDuracionTotal();
  }
}
```

## Manejo de Errores

El servicio incluye un método `handleError()` privado que:

1. Extrae mensajes de error del backend
2. Proporciona mensajes descriptivos por tipo de error HTTP
3. Retorna un Observable con un mensaje de error amigable

```typescript
private handleError(error: any): Observable<never> {
  let errorMessage = 'Ocurrió un error al procesar la solicitud';
  
  if (error.error?.message) {
    errorMessage = error.error.message;
  } else if (error.status === 0) {
    errorMessage = 'No se pudo conectar con el servidor';
  } else if (error.status === 404) {
    errorMessage = 'Tema no encontrado';
  } else if (error.status === 400) {
    errorMessage = 'Datos inválidos';
  }
  
  console.error('Error en TemasService:', error);
  return throwError(() => ({ message: errorMessage }));
}
```

## Flujo de Trabajo Completo

### 1. Crear un Curso con Unidades y Temas

```typescript
// Paso 1: Crear el curso (sin persistir)
this.curso = {
  titulo: 'Curso de Angular',
  descripcion: 'Aprende Angular desde cero',
  // ... otros campos
  unidades: []
};

// Paso 2: Agregar unidades localmente
const unidad = this.crearUnidadVacia();
unidad.titulo = 'Unidad 1: Introducción';
this.curso.unidades.push(unidad);

// Paso 3: Agregar temas a la unidad localmente
const tema = this.crearTemaVacio();
tema.titulo = 'Tema 1: Componentes';
tema.duracionEstimada = 30;
unidad.temas.push(tema);

// Paso 4: Guardar todo el curso (se envían unidades y temas anidados)
this.cursosService.createCurso(this.curso).subscribe({
  next: (cursoCreado) => {
    this.curso = cursoCreado; // Ahora tiene IDs del backend
    console.log('Curso creado con unidades y temas:', cursoCreado);
  }
});
```

### 2. Agregar un Tema a un Curso Existente

```typescript
// El curso ya existe en el backend (tiene ID)
if (this.curso.id && unidad.id) {
  const nuevoTema: CreateTemaDto = {
    titulo: 'Nuevo Tema',
    descripcion: 'Descripción del tema',
    duracionEstimada: 45,
    contenidos: []
  };
  
  this.temasService.createTema(this.curso.id, unidad.id, nuevoTema)
    .subscribe({
      next: (temaCreado) => {
        unidad.temas.push(temaCreado);
        this.mensajeExito = 'Tema agregado exitosamente';
      }
    });
}
```

## Validaciones

### Frontend (TypeScript)
- Título requerido y no vacío
- Descripción requerida
- Duración estimada debe ser un número positivo
- Contenidos opcional (array)

### Backend (NestJS con class-validator)
```typescript
export class CreateTemaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  duracionEstimada: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContenidoDto)
  contenidos?: CreateContenidoDto[];
}
```

## Próximos Pasos

1. **Gestión de Contenidos:** Implementar servicio separado para CRUD de contenidos
2. **Reordenamiento:** Implementar drag & drop para reordenar temas
3. **Búsqueda:** Agregar filtros para buscar temas por título
4. **Validaciones avanzadas:** Agregar validaciones personalizadas en el formulario
5. **Notificaciones mejoradas:** Sistema de toast notifications

## Ejemplo Completo

```typescript
// En AdminCursosComponent

// 1. Cargar un curso existente
this.cursosService.getCursoById('123').subscribe({
  next: (curso) => {
    this.curso = curso;
  }
});

// 2. Agregar un nuevo tema a una unidad
abrirModalTema(unidad: Unidad) {
  this.unidadSeleccionada = unidad;
  this.nuevoTema = this.crearTemaVacio();
  this.modalTemaAbierto = true;
}

// 3. Guardar el tema (automáticamente detecta si es backend o local)
guardarTema() {
  // El método ya implementado maneja ambos casos
}

// 4. Editar un tema existente
editarTema(unidad: Unidad, tema: Tema) {
  this.unidadSeleccionada = unidad;
  this.nuevoTema = { ...tema, contenidos: [...tema.contenidos] };
  this.modalTemaAbierto = true;
}

// 5. Eliminar un tema
eliminarTema(unidad: Unidad, temaId: string) {
  // El método ya implementado maneja ambos casos
}
```

## Resumen

- ✅ **Servicio creado:** TemasService con todos los métodos CRUD
- ✅ **Componente actualizado:** AdminCursosComponent con integración dual-mode
- ✅ **DTOs definidos:** CreateTemaDto y CreateContenidoDto
- ✅ **Manejo de errores:** Mensajes descriptivos y notificaciones al usuario
- ✅ **Documentación:** Guía completa de uso e integración

La gestión de temas está completamente integrada siguiendo el mismo patrón establecido para cursos y unidades.
