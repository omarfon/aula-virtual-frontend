# Gestión de Contenidos

## Descripción General

Este documento describe la implementación de la gestión de contenidos dentro de los temas del aula virtual. Los contenidos son recursos educativos anidados dentro de los temas y pueden ser de tipo video, texto, imagen o documento.

## Servicio de Contenidos

### Ubicación
```
src/app/services/contenidos.service.ts
```

### Estructura de DTOs

#### CreateContenidoDto
```typescript
export interface CreateContenidoDto {
  tipo: 'video' | 'texto' | 'imagen' | 'documento';
  titulo: string;
  url?: string;
  contenido?: string;
  duracion?: number; // en minutos, solo para videos
}
```

#### Validaciones Backend (NestJS)
```typescript
export class CreateContenidoDto {
  @ApiProperty({ enum: ['video', 'texto', 'imagen', 'documento'] })
  @IsEnum(['video', 'texto', 'imagen', 'documento'])
  @IsNotEmpty()
  tipo: 'video' | 'texto' | 'imagen' | 'documento';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contenido?: string;

  @ApiPropertyOptional({ description: 'Duración en minutos para videos' })
  @IsNumber()
  @IsOptional()
  duracion?: number;
}
```

### Tipos de Contenido

1. **video**: Contenido multimedia (requiere `url` y opcionalmente `duracion`)
2. **texto**: Contenido textual (requiere `contenido`)
3. **imagen**: Recursos gráficos (requiere `url`)
4. **documento**: Archivos descargables (requiere `url`)

## Métodos Disponibles

### 1. getContenidosByTema()
Obtiene todos los contenidos de un tema específico.

```typescript
getContenidosByTema(cursoId: string, unidadId: string, temaId: string): Observable<Contenido[]>
```

**Endpoint:** `GET /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos`

**Ejemplo:**
```typescript
this.contenidosService.getContenidosByTema('curso-123', 'unidad-456', 'tema-789').subscribe({
  next: (contenidos) => console.log('Contenidos:', contenidos),
  error: (error) => console.error('Error:', error)
});
```

### 2. getContenidoById()
Obtiene un contenido específico por su ID.

```typescript
getContenidoById(
  cursoId: string, 
  unidadId: string, 
  temaId: string, 
  contenidoId: string
): Observable<Contenido>
```

**Endpoint:** `GET /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos/:contenidoId`

### 3. createContenido()
Crea un nuevo contenido en un tema.

```typescript
createContenido(
  cursoId: string, 
  unidadId: string, 
  temaId: string, 
  dto: CreateContenidoDto
): Observable<Contenido>
```

**Endpoint:** `POST /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos`

**Ejemplo - Video:**
```typescript
const nuevoVideo: CreateContenidoDto = {
  tipo: 'video',
  titulo: 'Introducción a Angular Components',
  url: 'https://example.com/videos/intro-angular.mp4',
  duracion: 15 // 15 minutos
};

this.contenidosService.createContenido('123', '456', '789', nuevoVideo).subscribe({
  next: (contenido) => console.log('Video creado:', contenido),
  error: (error) => console.error('Error:', error)
});
```

**Ejemplo - Texto:**
```typescript
const nuevoTexto: CreateContenidoDto = {
  tipo: 'texto',
  titulo: 'Conceptos básicos de TypeScript',
  contenido: 'TypeScript es un superconjunto de JavaScript que añade tipado estático...'
};

this.contenidosService.createContenido('123', '456', '789', nuevoTexto).subscribe({
  next: (contenido) => console.log('Texto creado:', contenido),
  error: (error) => console.error('Error:', error)
});
```

**Ejemplo - Documento:**
```typescript
const nuevoDocumento: CreateContenidoDto = {
  tipo: 'documento',
  titulo: 'Guía de Angular CLI',
  url: 'https://example.com/docs/angular-cli-guide.pdf'
};

this.contenidosService.createContenido('123', '456', '789', nuevoDocumento).subscribe({
  next: (contenido) => console.log('Documento creado:', contenido),
  error: (error) => console.error('Error:', error)
});
```

### 4. updateContenido()
Actualiza completamente un contenido existente (PUT).

```typescript
updateContenido(
  cursoId: string, 
  unidadId: string, 
  temaId: string, 
  contenidoId: string, 
  dto: CreateContenidoDto
): Observable<Contenido>
```

**Endpoint:** `PUT /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos/:contenidoId`

### 5. patchContenido()
Actualiza parcialmente un contenido existente (PATCH).

```typescript
patchContenido(
  cursoId: string, 
  unidadId: string, 
  temaId: string, 
  contenidoId: string, 
  dto: Partial<CreateContenidoDto>
): Observable<Contenido>
```

**Endpoint:** `PATCH /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos/:contenidoId`

**Ejemplo:**
```typescript
// Solo actualizar la URL de un video
this.contenidosService.patchContenido('123', '456', '789', 'contenido-001', {
  url: 'https://new-url.com/video.mp4'
}).subscribe({
  next: (contenido) => console.log('Contenido actualizado:', contenido),
  error: (error) => console.error('Error:', error)
});
```

### 6. deleteContenido()
Elimina un contenido.

```typescript
deleteContenido(
  cursoId: string, 
  unidadId: string, 
  temaId: string, 
  contenidoId: string
): Observable<void>
```

**Endpoint:** `DELETE /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos/:contenidoId`

**Ejemplo:**
```typescript
this.contenidosService.deleteContenido('123', '456', '789', 'contenido-001').subscribe({
  next: () => console.log('Contenido eliminado exitosamente'),
  error: (error) => console.error('Error:', error)
});
```

### 7. reorderContenidos()
Reordena los contenidos dentro de un tema.

```typescript
reorderContenidos(
  cursoId: string, 
  unidadId: string, 
  temaId: string, 
  contenidoIds: string[]
): Observable<Contenido[]>
```

**Endpoint:** `PATCH /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos/reorder`

**Ejemplo:**
```typescript
const nuevoOrden = ['contenido-3', 'contenido-1', 'contenido-2', 'contenido-4'];

this.contenidosService.reorderContenidos('123', '456', '789', nuevoOrden).subscribe({
  next: (contenidos) => console.log('Contenidos reordenados:', contenidos),
  error: (error) => console.error('Error:', error)
});
```

## Integración en AdminCursosComponent

### Patrón Dual-Mode

El componente AdminCursosComponent implementa un patrón cuádruple de verificación para determinar el modo de operación:

1. **Modo Backend:** Si `curso.id`, `unidad.id`, `tema.id` existen (todos persistidos)
2. **Modo Local:** Si cualquiera de los anteriores no existe (aún no guardados)

### Método guardarContenido()

```typescript
guardarContenido() {
  if (!this.temaSeleccionado) return;

  // Buscar el tema y la unidad
  let unidadEncontrada: Unidad | undefined;
  let temaEncontrado: Tema | undefined;

  for (const unidad of this.curso.unidades ?? []) {
    const tema = unidad.temas?.find(t => t.id === this.temaSeleccionado!.id);
    if (tema) {
      unidadEncontrada = unidad;
      temaEncontrado = tema;
      break;
    }
  }

  if (!unidadEncontrada || !temaEncontrado) return;

  // Modo Backend - Actualizar contenido existente
  if (this.curso.id && unidadEncontrada.id && temaEncontrado.id && this.nuevoContenido.id) {
    const updateDto: CreateContenidoDto = {
      tipo: this.nuevoContenido.tipo,
      titulo: this.nuevoContenido.titulo,
      url: this.nuevoContenido.url,
      contenido: this.nuevoContenido.contenido,
      duracion: this.nuevoContenido.duracion
    };
    
    this.contenidosService.updateContenido(
      this.curso.id,
      unidadEncontrada.id,
      temaEncontrado.id,
      this.nuevoContenido.id,
      updateDto
    ).subscribe({
      next: (contenidoActualizado) => {
        const index = temaEncontrado!.contenidos!.findIndex(c => c.id === this.nuevoContenido.id);
        if (index >= 0) {
          temaEncontrado!.contenidos![index] = contenidoActualizado;
        }
        this.mensajeExito = '✅ Contenido actualizado exitosamente';
        this.modalContenidoAbierto = false;
      },
      error: (error) => {
        this.error = `Error al actualizar contenido: ${error.message}`;
      }
    });
  }
  // Modo Backend - Crear nuevo contenido
  else if (this.curso.id && unidadEncontrada.id && temaEncontrado.id && !this.nuevoContenido.id) {
    const createDto: CreateContenidoDto = {
      tipo: this.nuevoContenido.tipo,
      titulo: this.nuevoContenido.titulo,
      url: this.nuevoContenido.url,
      contenido: this.nuevoContenido.contenido,
      duracion: this.nuevoContenido.duracion
    };
    
    this.contenidosService.createContenido(
      this.curso.id,
      unidadEncontrada.id,
      temaEncontrado.id,
      createDto
    ).subscribe({
      next: (contenidoCreado) => {
        if (!temaEncontrado!.contenidos) {
          temaEncontrado!.contenidos = [];
        }
        temaEncontrado!.contenidos.push(contenidoCreado);
        this.mensajeExito = '✅ Contenido creado exitosamente';
        this.modalContenidoAbierto = false;
      },
      error: (error) => {
        this.error = `Error al crear contenido: ${error.message}`;
      }
    });
  }
  // Modo Local
  else {
    if (!temaEncontrado.contenidos) {
      temaEncontrado.contenidos = [];
    }
    const index = temaEncontrado.contenidos.findIndex(c => c.id === this.nuevoContenido.id);
    if (index >= 0) {
      temaEncontrado.contenidos[index] = { ...this.nuevoContenido };
    } else {
      const nuevoContenidoConId = {
        ...this.nuevoContenido,
        id: this.generarId()
      };
      temaEncontrado.contenidos.push(nuevoContenidoConId);
    }
    this.modalContenidoAbierto = false;
  }
}
```

### Método eliminarContenido()

```typescript
eliminarContenido(tema: Tema, contenidoIndex: number) {
  if (!confirm('¿Estás seguro de eliminar este contenido?')) return;

  // Buscar el tema y la unidad
  let unidadEncontrada: Unidad | undefined;
  let temaEncontrado: Tema | undefined;

  for (const unidad of this.curso.unidades ?? []) {
    const temaAux = unidad.temas?.find(t => t.id === tema.id);
    if (temaAux) {
      unidadEncontrada = unidad;
      temaEncontrado = temaAux;
      break;
    }
  }

  if (!unidadEncontrada || !temaEncontrado || !temaEncontrado.contenidos) return;

  const contenido = temaEncontrado.contenidos[contenidoIndex];
  if (!contenido) return;

  // Modo Backend
  if (this.curso.id && unidadEncontrada.id && temaEncontrado.id && contenido.id) {
    this.contenidosService.deleteContenido(
      this.curso.id,
      unidadEncontrada.id,
      temaEncontrado.id,
      contenido.id
    ).subscribe({
      next: () => {
        temaEncontrado!.contenidos!.splice(contenidoIndex, 1);
        this.mensajeExito = '✅ Contenido eliminado exitosamente';
      },
      error: (error) => {
        this.error = `Error al eliminar contenido: ${error.message}`;
      }
    });
  }
  // Modo Local
  else {
    temaEncontrado.contenidos.splice(contenidoIndex, 1);
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
    errorMessage = 'Contenido no encontrado';
  } else if (error.status === 400) {
    errorMessage = 'Datos de contenido inválidos';
  }
  
  return throwError(() => ({ message: errorMessage }));
}
```

## Flujo de Trabajo Completo

### 1. Crear un Curso con Jerarquía Completa

```typescript
// Crear curso con unidades, temas y contenidos anidados
const nuevoCurso: CreateCursoDto = {
  titulo: 'Curso de Angular Avanzado',
  descripcion: 'Domina Angular',
  instructor: 'Juan Pérez',
  nivel: 'Avanzado',
  imagen: 'https://example.com/angular.jpg',
  categoria: 'Programación',
  estudiantes: 0,
  duracionTotal: 0,
  unidades: [
    {
      numero: 1,
      titulo: 'Componentes Avanzados',
      descripcion: 'Aprende componentes complejos',
      temas: [
        {
          titulo: 'Lifecycle Hooks',
          descripcion: 'Hooks del ciclo de vida',
          duracionEstimada: 30,
          contenidos: [
            {
              tipo: 'video',
              titulo: 'Video: Lifecycle Hooks',
              url: 'https://example.com/lifecycle.mp4',
              duracion: 20
            },
            {
              tipo: 'texto',
              titulo: 'Documentación',
              contenido: 'Los hooks más importantes son...'
            },
            {
              tipo: 'documento',
              titulo: 'Guía PDF',
              url: 'https://example.com/lifecycle-guide.pdf'
            }
          ]
        }
      ]
    }
  ],
  tareas: [],
  examenes: []
};

this.cursosService.createCurso(nuevoCurso).subscribe({
  next: (cursoCreado) => {
    console.log('Curso creado con toda la jerarquía:', cursoCreado);
  }
});
```

### 2. Agregar Contenido a un Tema Existente

```typescript
// El curso, unidad y tema ya existen en el backend
if (this.curso.id && unidad.id && tema.id) {
  const nuevoContenido: CreateContenidoDto = {
    tipo: 'video',
    titulo: 'Tutorial de Services',
    url: 'https://example.com/services-tutorial.mp4',
    duracion: 25
  };
  
  this.contenidosService.createContenido(
    this.curso.id,
    unidad.id,
    tema.id,
    nuevoContenido
  ).subscribe({
    next: (contenidoCreado) => {
      if (!tema.contenidos) {
        tema.contenidos = [];
      }
      tema.contenidos.push(contenidoCreado);
      this.mensajeExito = 'Contenido agregado';
    }
  });
}
```

### 3. Actualizar Solo la URL de un Video

```typescript
// Actualización parcial con PATCH
this.contenidosService.patchContenido(
  this.curso.id,
  unidad.id,
  tema.id,
  contenido.id,
  { url: 'https://new-cdn.com/video-hd.mp4' }
).subscribe({
  next: (actualizado) => {
    console.log('URL actualizada:', actualizado.url);
  }
});
```

## Validaciones

### Frontend
- **tipo**: Debe ser 'video', 'texto', 'imagen' o 'documento'
- **titulo**: Requerido, no vacío
- **url**: Opcional, requerido para video, imagen y documento
- **contenido**: Opcional, requerido para tipo texto
- **duracion**: Opcional, solo para videos (en minutos)

### Backend (class-validator)
```typescript
@IsEnum(['video', 'texto', 'imagen', 'documento'])
@IsNotEmpty()
tipo: 'video' | 'texto' | 'imagen' | 'documento';

@IsString()
@IsNotEmpty()
titulo: string;

@IsString()
@IsOptional()
url?: string;

@IsString()
@IsOptional()
contenido?: string;

@IsNumber()
@IsOptional()
duracion?: number;
```

## Jerarquía Completa

```
Curso
├── Unidades[]
│   ├── Temas[]
│   │   ├── Contenidos[]
│   │   │   ├── tipo: 'video' | 'texto' | 'imagen' | 'documento'
│   │   │   ├── titulo
│   │   │   ├── url? (para video, imagen, documento)
│   │   │   ├── contenido? (para texto)
│   │   │   └── duracion? (para video)
│   │   └── ...
│   └── ...
├── Tareas[]
└── Examenes[]
```

## Endpoints Completos

```
POST   /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos
GET    /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos
GET    /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos/:contenidoId
PUT    /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos/:contenidoId
PATCH  /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos/:contenidoId
DELETE /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos/:contenidoId
PATCH  /api/cursos/:cursoId/unidades/:unidadId/temas/:temaId/contenidos/reorder
```

## Resumen

- ✅ **Servicio creado:** ContenidosService con todos los métodos CRUD
- ✅ **Componente actualizado:** AdminCursosComponent con integración dual-mode
- ✅ **DTOs validados:** CreateContenidoDto con tipos específicos
- ✅ **Tipos de contenido:** video, texto, imagen, documento
- ✅ **Manejo de errores:** Mensajes descriptivos y notificaciones
- ✅ **Documentación:** Guía completa de uso

La gestión de contenidos completa la jerarquía: **Cursos → Unidades → Temas → Contenidos** con integración total al backend NestJS.
