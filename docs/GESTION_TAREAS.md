# Gestión de Tareas

## Descripción General

Este documento describe la implementación de la gestión de tareas dentro de los cursos del aula virtual. Las tareas son asignaciones que los estudiantes deben completar antes de una fecha límite, con puntos asignados y niveles de prioridad.

## Servicio de Tareas

### Ubicación
```
src/app/services/tareas.service.ts
```

### Estructura de DTOs

#### CreateTareaDto
```typescript
export interface CreateTareaDto {
  titulo: string;
  descripcion: string;
  fechaEntrega: string; // formato ISO: YYYY-MM-DD
  puntosPosibles: number;
  prioridad: 'alta' | 'media' | 'baja';
}
```

#### Validaciones Backend (NestJS)
```typescript
export class CreateTareaDto {
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
  fechaEntrega: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  puntosPosibles: number;

  @ApiProperty({ enum: ['alta', 'media', 'baja'] })
  @IsEnum(['alta', 'media', 'baja'])
  @IsNotEmpty()
  prioridad: 'alta' | 'media' | 'baja';
}
```

### Niveles de Prioridad

1. **alta**: Tareas urgentes o críticas (color rojo)
2. **media**: Tareas importantes pero no urgentes (color amarillo)
3. **baja**: Tareas opcionales o de menor importancia (color verde)

## Métodos Disponibles

### 1. getTareasByCurso()
Obtiene todas las tareas de un curso.

```typescript
getTareasByCurso(cursoId: string): Observable<Tarea[]>
```

**Endpoint:** `GET /api/cursos/:cursoId/tareas`

**Ejemplo:**
```typescript
this.tareasService.getTareasByCurso('curso-123').subscribe({
  next: (tareas) => console.log('Tareas:', tareas),
  error: (error) => console.error('Error:', error)
});
```

### 2. getTareaById()
Obtiene una tarea específica por su ID.

```typescript
getTareaById(cursoId: string, tareaId: string): Observable<Tarea>
```

**Endpoint:** `GET /api/cursos/:cursoId/tareas/:tareaId`

### 3. createTarea()
Crea una nueva tarea en un curso.

```typescript
createTarea(cursoId: string, dto: CreateTareaDto): Observable<Tarea>
```

**Endpoint:** `POST /api/cursos/:cursoId/tareas`

**Ejemplo - Tarea de Alta Prioridad:**
```typescript
const nuevaTarea: CreateTareaDto = {
  titulo: 'Proyecto Final - Aplicación Angular',
  descripcion: 'Desarrollar una aplicación completa usando Angular, incluyendo componentes, servicios, routing y formularios reactivos.',
  fechaEntrega: '2026-03-15',
  puntosPosibles: 100,
  prioridad: 'alta'
};

this.tareasService.createTarea('curso-123', nuevaTarea).subscribe({
  next: (tarea) => console.log('Tarea creada:', tarea),
  error: (error) => console.error('Error:', error)
});
```

**Ejemplo - Tarea de Media Prioridad:**
```typescript
const tareaPractica: CreateTareaDto = {
  titulo: 'Ejercicios de RxJS',
  descripcion: 'Completar los ejercicios del módulo de programación reactiva con RxJS.',
  fechaEntrega: '2026-02-20',
  puntosPosibles: 50,
  prioridad: 'media'
};

this.tareasService.createTarea('curso-123', tareaPractica).subscribe({
  next: (tarea) => console.log('Tarea práctica creada:', tarea),
  error: (error) => console.error('Error:', error)
});
```

**Ejemplo - Tarea de Baja Prioridad:**
```typescript
const tareaOpcional: CreateTareaDto = {
  titulo: 'Lectura Complementaria',
  descripcion: 'Leer el artículo sobre mejores prácticas en Angular (opcional).',
  fechaEntrega: '2026-02-28',
  puntosPosibles: 10,
  prioridad: 'baja'
};

this.tareasService.createTarea('curso-123', tareaOpcional).subscribe({
  next: (tarea) => console.log('Tarea opcional creada:', tarea),
  error: (error) => console.error('Error:', error)
});
```

### 4. updateTarea()
Actualiza completamente una tarea existente (PUT).

```typescript
updateTarea(cursoId: string, tareaId: string, dto: CreateTareaDto): Observable<Tarea>
```

**Endpoint:** `PUT /api/cursos/:cursoId/tareas/:tareaId`

**Ejemplo:**
```typescript
const tareaActualizada: CreateTareaDto = {
  titulo: 'Proyecto Final - Aplicación Angular (Extendido)',
  descripcion: 'Desarrollar una aplicación completa usando Angular. Se ha extendido el plazo.',
  fechaEntrega: '2026-03-25', // Nueva fecha
  puntosPosibles: 120, // Más puntos
  prioridad: 'alta'
};

this.tareasService.updateTarea('curso-123', 'tarea-456', tareaActualizada).subscribe({
  next: (tarea) => console.log('Tarea actualizada:', tarea),
  error: (error) => console.error('Error:', error)
});
```

### 5. patchTarea()
Actualiza parcialmente una tarea existente (PATCH).

```typescript
patchTarea(cursoId: string, tareaId: string, dto: Partial<CreateTareaDto>): Observable<Tarea>
```

**Endpoint:** `PATCH /api/cursos/:cursoId/tareas/:tareaId`

**Ejemplo:**
```typescript
// Solo extender la fecha de entrega
this.tareasService.patchTarea('curso-123', 'tarea-456', {
  fechaEntrega: '2026-03-30'
}).subscribe({
  next: (tarea) => console.log('Fecha actualizada:', tarea.fechaEntrega),
  error: (error) => console.error('Error:', error)
});

// Cambiar prioridad
this.tareasService.patchTarea('curso-123', 'tarea-456', {
  prioridad: 'media'
}).subscribe({
  next: (tarea) => console.log('Prioridad actualizada:', tarea.prioridad),
  error: (error) => console.error('Error:', error)
});
```

### 6. deleteTarea()
Elimina una tarea.

```typescript
deleteTarea(cursoId: string, tareaId: string): Observable<void>
```

**Endpoint:** `DELETE /api/cursos/:cursoId/tareas/:tareaId`

**Ejemplo:**
```typescript
this.tareasService.deleteTarea('curso-123', 'tarea-456').subscribe({
  next: () => console.log('Tarea eliminada exitosamente'),
  error: (error) => console.error('Error:', error)
});
```

### 7. getTareasByPrioridad()
Filtra tareas por nivel de prioridad.

```typescript
getTareasByPrioridad(cursoId: string, prioridad: 'alta' | 'media' | 'baja'): Observable<Tarea[]>
```

**Endpoint:** `GET /api/cursos/:cursoId/tareas?prioridad=alta`

**Ejemplo:**
```typescript
// Obtener solo tareas de alta prioridad
this.tareasService.getTareasByPrioridad('curso-123', 'alta').subscribe({
  next: (tareasUrgentes) => {
    console.log('Tareas urgentes:', tareasUrgentes);
    this.mostrarAlertasTareasUrgentes(tareasUrgentes);
  },
  error: (error) => console.error('Error:', error)
});
```

### 8. getTareasPendientes()
Obtiene tareas con fecha de entrega futura (pendientes).

```typescript
getTareasPendientes(cursoId: string): Observable<Tarea[]>
```

**Endpoint:** `GET /api/cursos/:cursoId/tareas/pendientes`

**Ejemplo:**
```typescript
this.tareasService.getTareasPendientes('curso-123').subscribe({
  next: (tareasPendientes) => {
    console.log('Tareas pendientes:', tareasPendientes);
    this.mostrarTareasPorEntregar(tareasPendientes);
  },
  error: (error) => console.error('Error:', error)
});
```

### 9. getTareasVencidas()
Obtiene tareas con fecha de entrega pasada (vencidas).

```typescript
getTareasVencidas(cursoId: string): Observable<Tarea[]>
```

**Endpoint:** `GET /api/cursos/:cursoId/tareas/vencidas`

**Ejemplo:**
```typescript
this.tareasService.getTareasVencidas('curso-123').subscribe({
  next: (tareasVencidas) => {
    console.log('Tareas vencidas:', tareasVencidas);
    this.mostrarAlertaTareasAtrasadas(tareasVencidas);
  },
  error: (error) => console.error('Error:', error)
});
```

## Integración en AdminCursosComponent

### Patrón Dual-Mode

El componente AdminCursosComponent implementa un patrón dual para tareas:

1. **Modo Backend:** Si `curso.id` existe (curso persistido)
2. **Modo Local:** Si `curso.id` no existe (curso no guardado aún)

### Método guardarTarea()

```typescript
guardarTarea() {
  if (!this.curso.tareas) {
    this.curso.tareas = [];
  }

  // Modo Backend - Actualizar tarea existente
  if (this.curso.id && this.nuevaTarea.id) {
    const updateDto: CreateTareaDto = {
      titulo: this.nuevaTarea.titulo,
      descripcion: this.nuevaTarea.descripcion,
      fechaEntrega: this.nuevaTarea.fechaEntrega,
      puntosPosibles: this.nuevaTarea.puntosPosibles,
      prioridad: this.nuevaTarea.prioridad
    };
    
    this.tareasService.updateTarea(this.curso.id, this.nuevaTarea.id, updateDto)
      .subscribe({
        next: (tareaActualizada) => {
          const index = this.curso.tareas!.findIndex(t => t.id === this.nuevaTarea.id);
          if (index >= 0) {
            this.curso.tareas![index] = tareaActualizada;
          }
          this.mensajeExito = '✅ Tarea actualizada exitosamente';
          this.modalTareaAbierto = false;
        },
        error: (error) => {
          this.error = `Error al actualizar tarea: ${error.message}`;
        }
      });
  }
  // Modo Backend - Crear nueva tarea
  else if (this.curso.id && !this.nuevaTarea.id) {
    const createDto: CreateTareaDto = {
      titulo: this.nuevaTarea.titulo,
      descripcion: this.nuevaTarea.descripcion,
      fechaEntrega: this.nuevaTarea.fechaEntrega,
      puntosPosibles: this.nuevaTarea.puntosPosibles,
      prioridad: this.nuevaTarea.prioridad
    };
    
    this.tareasService.createTarea(this.curso.id, createDto)
      .subscribe({
        next: (tareaCreada) => {
          this.curso.tareas!.push(tareaCreada);
          this.mensajeExito = '✅ Tarea creada exitosamente';
          this.modalTareaAbierto = false;
        },
        error: (error) => {
          this.error = `Error al crear tarea: ${error.message}`;
        }
      });
  }
  // Modo Local
  else {
    const index = this.curso.tareas.findIndex(t => t.id === this.nuevaTarea.id);
    if (index >= 0) {
      this.curso.tareas[index] = { ...this.nuevaTarea };
    } else {
      const nuevaTareaConId = {
        ...this.nuevaTarea,
        id: this.generarId()
      };
      this.curso.tareas.push(nuevaTareaConId);
    }
    this.modalTareaAbierto = false;
  }
}
```

### Método eliminarTarea()

```typescript
eliminarTarea(tarea: Tarea) {
  if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

  // Modo Backend
  if (this.curso.id && tarea.id) {
    this.tareasService.deleteTarea(this.curso.id, tarea.id)
      .subscribe({
        next: () => {
          if (this.curso.tareas) {
            this.curso.tareas = this.curso.tareas.filter(t => t.id !== tarea.id);
          }
          this.mensajeExito = '✅ Tarea eliminada exitosamente';
        },
        error: (error) => {
          this.error = `Error al eliminar tarea: ${error.message}`;
        }
      });
  }
  // Modo Local
  else {
    if (this.curso.tareas) {
      this.curso.tareas = this.curso.tareas.filter(t => t.id !== tarea.id);
    }
  }
}
```

## Manejo de Errores

El servicio incluye un método `handleError()` con mensajes descriptivos:

```typescript
private handleError(error: any): Observable<never> {
  let errorMessage = 'Ocurrió un error al procesar la solicitud';
  
  if (error.error?.message) {
    errorMessage = error.error.message;
  } else if (error.status === 0) {
    errorMessage = 'No se pudo conectar con el servidor';
  } else if (error.status === 404) {
    errorMessage = 'Tarea no encontrada';
  } else if (error.status === 400) {
    errorMessage = 'Datos de tarea inválidos';
  }
  
  return throwError(() => ({ message: errorMessage }));
}
```

## Flujo de Trabajo Completo

### 1. Crear un Curso con Tareas

```typescript
const nuevoCurso: CreateCursoDto = {
  titulo: 'Curso Completo de Angular',
  descripcion: 'Domina Angular desde cero',
  instructor: 'Carlos Mendoza',
  nivel: 'Avanzado',
  imagen: 'https://example.com/angular-course.jpg',
  categoria: 'Desarrollo Web',
  estudiantes: 0,
  duracionTotal: 0,
  unidades: [],
  tareas: [
    {
      titulo: 'Configuración del Entorno',
      descripcion: 'Instalar Node.js, Angular CLI y configurar VS Code',
      fechaEntrega: '2026-02-10',
      puntosPosibles: 20,
      prioridad: 'alta'
    },
    {
      titulo: 'Crear Primer Componente',
      descripcion: 'Desarrollar un componente de bienvenida con data binding',
      fechaEntrega: '2026-02-15',
      puntosPosibles: 30,
      prioridad: 'alta'
    },
    {
      titulo: 'Implementar Routing',
      descripcion: 'Configurar rutas para navegación entre páginas',
      fechaEntrega: '2026-02-20',
      puntosPosibles: 40,
      prioridad: 'media'
    },
    {
      titulo: 'Lectura: Mejores Prácticas',
      descripcion: 'Leer documentación oficial sobre style guide',
      fechaEntrega: '2026-02-25',
      puntosPosibles: 10,
      prioridad: 'baja'
    }
  ],
  examenes: []
};

this.cursosService.createCurso(nuevoCurso).subscribe({
  next: (cursoCreado) => {
    console.log('Curso creado con tareas:', cursoCreado);
  }
});
```

### 2. Agregar Tarea a Curso Existente

```typescript
if (this.curso.id) {
  const nuevaTarea: CreateTareaDto = {
    titulo: 'Proyecto de Integración',
    descripcion: 'Integrar todos los conceptos aprendidos en un proyecto único',
    fechaEntrega: '2026-03-30',
    puntosPosibles: 150,
    prioridad: 'alta'
  };
  
  this.tareasService.createTarea(this.curso.id, nuevaTarea).subscribe({
    next: (tareaCreada) => {
      if (!this.curso.tareas) {
        this.curso.tareas = [];
      }
      this.curso.tareas.push(tareaCreada);
      this.mensajeExito = 'Tarea agregada';
    }
  });
}
```

### 3. Dashboard de Tareas

```typescript
cargarDashboardTareas() {
  if (!this.curso.id) return;

  // Cargar todas las tareas
  forkJoin({
    todas: this.tareasService.getTareasByCurso(this.curso.id),
    pendientes: this.tareasService.getTareasPendientes(this.curso.id),
    vencidas: this.tareasService.getTareasVencidas(this.curso.id),
    urgentes: this.tareasService.getTareasByPrioridad(this.curso.id, 'alta')
  }).subscribe({
    next: (resultado) => {
      this.estadisticasTareas = {
        total: resultado.todas.length,
        pendientes: resultado.pendientes.length,
        vencidas: resultado.vencidas.length,
        urgentes: resultado.urgentes.length,
        completadas: resultado.todas.length - resultado.pendientes.length - resultado.vencidas.length
      };
      
      console.log('Dashboard de tareas cargado:', this.estadisticasTareas);
    },
    error: (error) => console.error('Error al cargar dashboard:', error)
  });
}
```

### 4. Notificaciones de Tareas Próximas a Vencer

```typescript
verificarTareasProximasAVencer() {
  if (!this.curso.id) return;

  this.tareasService.getTareasPendientes(this.curso.id).subscribe({
    next: (tareasPendientes) => {
      const hoy = new Date();
      const proximasAVencer = tareasPendientes.filter(tarea => {
        const fechaEntrega = new Date(tarea.fechaEntrega);
        const diasRestantes = Math.floor((fechaEntrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return diasRestantes <= 3 && diasRestantes >= 0;
      });

      if (proximasAVencer.length > 0) {
        this.mostrarNotificacion(
          `⚠️ Tienes ${proximasAVencer.length} tarea(s) próximas a vencer en los próximos 3 días`,
          'warning'
        );
      }
    }
  });
}
```

## Validaciones

### Frontend
- **titulo**: Requerido, no vacío
- **descripcion**: Requerido, no vacío
- **fechaEntrega**: Requerido, formato ISO (YYYY-MM-DD)
- **puntosPosibles**: Requerido, número positivo
- **prioridad**: Debe ser 'alta', 'media' o 'baja'

### Backend (class-validator)
```typescript
@IsString()
@IsNotEmpty()
titulo: string;

@IsString()
@IsNotEmpty()
descripcion: string;

@IsString()
@IsNotEmpty()
fechaEntrega: string;

@IsNumber()
@IsNotEmpty()
puntosPosibles: number;

@IsEnum(['alta', 'media', 'baja'])
@IsNotEmpty()
prioridad: 'alta' | 'media' | 'baja';
```

## Mejores Prácticas

### 1. Formato de Fecha
```typescript
// Asegurar formato ISO
const fecha = new Date('2026-03-15');
const fechaISO = fecha.toISOString().split('T')[0]; // '2026-03-15'
```

### 2. Validación de Fecha Futura
```typescript
validarFechaEntrega(fecha: string): boolean {
  const fechaEntrega = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fechaEntrega >= hoy;
}
```

### 3. Cálculo de Días Restantes
```typescript
calcularDiasRestantes(tarea: Tarea): number {
  const hoy = new Date();
  const fechaEntrega = new Date(tarea.fechaEntrega);
  const diferencia = fechaEntrega.getTime() - hoy.getTime();
  return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
}
```

## Endpoints Completos

```
POST   /api/cursos/:cursoId/tareas
GET    /api/cursos/:cursoId/tareas
GET    /api/cursos/:cursoId/tareas/:tareaId
PUT    /api/cursos/:cursoId/tareas/:tareaId
PATCH  /api/cursos/:cursoId/tareas/:tareaId
DELETE /api/cursos/:cursoId/tareas/:tareaId
GET    /api/cursos/:cursoId/tareas?prioridad=alta
GET    /api/cursos/:cursoId/tareas/pendientes
GET    /api/cursos/:cursoId/tareas/vencidas
```

## Resumen

- ✅ **Servicio creado:** TareasService con métodos CRUD completos
- ✅ **Componente actualizado:** AdminCursosComponent con integración dual-mode
- ✅ **DTOs validados:** CreateTareaDto según backend
- ✅ **Niveles de prioridad:** alta, media, baja
- ✅ **Filtros:** Por prioridad, pendientes, vencidas
- ✅ **Validaciones:** Fechas, puntos, prioridad
- ✅ **Manejo de errores:** Mensajes descriptivos y notificaciones

La gestión de tareas está completamente integrada con el backend NestJS siguiendo el patrón dual-mode establecido, completando así todos los recursos del sistema de aula virtual.
