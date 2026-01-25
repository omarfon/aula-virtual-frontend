# Gestión de Unidades - Integración Backend

## 📚 Servicio de Unidades

El servicio `UnidadesService` proporciona métodos para gestionar las unidades dentro de los cursos.

### Endpoints de Unidades

```
Base URL: http://localhost:3000/api/cursos/:cursoId

GET    /unidades              - Listar todas las unidades de un curso
GET    /unidades/:id          - Obtener unidad específica
POST   /unidades              - Crear nueva unidad
PUT    /unidades/:id          - Actualizar unidad completa
PATCH  /unidades/:id          - Actualizar parcialmente
DELETE /unidades/:id          - Eliminar unidad
PUT    /unidades/reorder      - Reordenar unidades
```

## 📋 DTO de Creación de Unidad

```typescript
interface CreateUnidadDto {
  numero: number;              // Requerido - Número de orden de la unidad
  titulo: string;              // Requerido - Título de la unidad
  descripcion: string;         // Requerido - Descripción de la unidad
  temas?: CreateTemaDto[];     // Opcional - Lista de temas
}
```

### Ejemplo de CreateUnidadDto:

```typescript
const nuevaUnidad: CreateUnidadDto = {
  numero: 1,
  titulo: 'Introducción a la Programación',
  descripcion: 'Conceptos básicos de programación y algoritmos',
  temas: [
    {
      titulo: 'Variables y Tipos de Datos',
      descripcion: 'Aprende sobre variables, constantes y tipos de datos',
      duracionEstimada: 45,
      contenidos: []
    },
    {
      titulo: 'Estructuras de Control',
      descripcion: 'Condicionales, bucles y control de flujo',
      duracionEstimada: 60,
      contenidos: []
    }
  ]
};
```

## 🔄 Flujo de Trabajo

### 1. Crear Unidad en Curso Nuevo (Local)

Cuando el curso aún no está persistido:
- La unidad se crea localmente en el array `curso.unidades`
- Se le asigna un ID temporal
- Se guarda junto con el curso cuando se crea

```typescript
// En admin-cursos.component.ts
guardarUnidad() {
  if (!this.curso.id) {
    // Modo local - curso no persistido
    const nuevaUnidad = { ...this.nuevaUnidad, id: this.generarId() };
    this.curso.unidades.push(nuevaUnidad);
  }
}
```

### 2. Crear Unidad en Curso Existente (Backend)

Cuando el curso ya está en el backend:
- Se llama al servicio `unidadesService.createUnidad()`
- Se envía el DTO al backend
- Se recibe la unidad con ID del servidor

```typescript
// En admin-cursos.component.ts
if (this.curso.id && !this.nuevaUnidad.id) {
  const createDto: CreateUnidadDto = {
    numero: this.nuevaUnidad.numero,
    titulo: this.nuevaUnidad.titulo,
    descripcion: this.nuevaUnidad.descripcion,
    temas: this.nuevaUnidad.temas
  };

  this.unidadesService.createUnidad(this.curso.id, createDto).subscribe({
    next: (unidadCreada) => {
      this.curso.unidades.push(unidadCreada);
      this.mensajeExito = '✅ Unidad creada exitosamente';
    }
  });
}
```

### 3. Actualizar Unidad Existente

```typescript
if (this.curso.id && this.nuevaUnidad.id) {
  this.unidadesService.updateUnidad(
    this.curso.id, 
    this.nuevaUnidad.id, 
    updateDto
  ).subscribe({
    next: (unidadActualizada) => {
      // Actualizar en la lista local
      const index = this.curso.unidades.findIndex(u => u.id === this.nuevaUnidad.id);
      this.curso.unidades[index] = unidadActualizada;
    }
  });
}
```

### 4. Eliminar Unidad

```typescript
eliminarUnidad(unidadId: string) {
  if (this.curso.id) {
    this.unidadesService.deleteUnidad(this.curso.id, unidadId).subscribe({
      next: () => {
        this.curso.unidades = this.curso.unidades.filter(u => u.id !== unidadId);
        this.mensajeExito = '🗑️ Unidad eliminada';
      }
    });
  }
}
```

## 🎯 Características Implementadas

### ✅ Gestión Completa de Unidades

1. **Crear Unidad**
   - Formulario modal con validación
   - Persistencia local o en backend según estado del curso
   - Auto-numeración de unidades

2. **Editar Unidad**
   - Cargar datos existentes en el formulario
   - Actualizar en backend si está persistida
   - Actualización local si es temporal

3. **Eliminar Unidad**
   - Confirmación antes de eliminar
   - Eliminación en backend
   - Re-numeración automática

4. **Listar Unidades**
   - Visualización expandible/colapsable
   - Mostrar temas asociados
   - Indicadores de duración

5. **Reordenar Unidades**
   - Renumeración automática
   - Sincronización con backend (futura)

## 📊 Estados y Validación

### Estados de la Unidad

```typescript
interface EstadoUnidad {
  modoLocal: boolean;      // true si el curso no está persistido
  editando: boolean;       // true si se está editando
  guardando: boolean;      // true durante guardado
  error: string | null;    // mensaje de error si hay
}
```

### Validaciones

- **Número**: Debe ser mayor a 0, único en el curso
- **Título**: Requerido, mínimo 3 caracteres
- **Descripción**: Requerido, mínimo 10 caracteres
- **Temas**: Opcional, cada tema debe ser válido

## 🔌 Integración con el Backend

### Configuración Necesaria

El backend NestJS debe tener los siguientes controladores:

```typescript
// unidades.controller.ts
@Controller('cursos/:cursoId/unidades')
export class UnidadesController {
  
  @Get()
  findAll(@Param('cursoId') cursoId: string) {
    return this.unidadesService.findAllByCurso(cursoId);
  }

  @Get(':id')
  findOne(@Param('cursoId') cursoId: string, @Param('id') id: string) {
    return this.unidadesService.findOne(cursoId, id);
  }

  @Post()
  create(
    @Param('cursoId') cursoId: string,
    @Body() createUnidadDto: CreateUnidadDto
  ) {
    return this.unidadesService.create(cursoId, createUnidadDto);
  }

  @Put(':id')
  update(
    @Param('cursoId') cursoId: string,
    @Param('id') id: string,
    @Body() updateUnidadDto: UpdateUnidadDto
  ) {
    return this.unidadesService.update(cursoId, id, updateUnidadDto);
  }

  @Delete(':id')
  remove(@Param('cursoId') cursoId: string, @Param('id') id: string) {
    return this.unidadesService.remove(cursoId, id);
  }
}
```

## 🎨 Componentes UI

### Modal de Unidad

```html
<div *ngIf="modalUnidadAbierto" class="modal">
  <h3>{{ nuevaUnidad.id ? 'Editar' : 'Nueva' }} Unidad</h3>
  
  <input [(ngModel)]="nuevaUnidad.titulo" placeholder="Título">
  <textarea [(ngModel)]="nuevaUnidad.descripcion" placeholder="Descripción"></textarea>
  <input type="number" [(ngModel)]="nuevaUnidad.numero" placeholder="Número">
  
  <button (click)="guardarUnidad()">Guardar</button>
  <button (click)="cerrarModal()">Cancelar</button>
</div>
```

### Lista de Unidades

```html
<div *ngFor="let unidad of curso.unidades; let i = index">
  <div (click)="toggleUnidad(i)">
    <h4>Unidad {{ unidad.numero }}: {{ unidad.titulo }}</h4>
    <p>{{ unidad.descripcion }}</p>
  </div>
  
  <div *ngIf="unidadExpandida === i">
    <!-- Temas de la unidad -->
    <div *ngFor="let tema of unidad.temas">
      <p>{{ tema.titulo }}</p>
    </div>
    
    <button (click)="abrirModalUnidad(unidad)">Editar</button>
    <button (click)="eliminarUnidad(unidad.id)">Eliminar</button>
  </div>
</div>
```

## 🔍 Depuración

### Logs Importantes

```typescript
// Al crear unidad
console.log('✅ Unidad creada:', unidadCreada);

// Al actualizar
console.log('📝 Unidad actualizada:', unidadActualizada);

// Al eliminar
console.log('🗑️ Unidad eliminada:', unidadId);

// En caso de error
console.error('❌ Error:', error.message);
```

### Verificación en Red

1. Abrir DevTools (F12)
2. Ir a la pestaña Network
3. Buscar peticiones a `/cursos/:id/unidades`
4. Verificar status codes (200, 201, 204)
5. Revisar request/response bodies

## 📝 Notas Importantes

1. **IDs Temporales**: Las unidades locales usan IDs generados con `generarId()`
2. **Sincronización**: Al guardar el curso, las unidades locales se envían al backend
3. **Cascada**: Al eliminar un curso, sus unidades se eliminan automáticamente
4. **Orden**: El campo `numero` define el orden de presentación
5. **Temas**: Los temas se gestionan de forma anidada dentro de las unidades

## 🚀 Mejoras Futuras

1. **Drag & Drop**: Reordenar unidades arrastrando
2. **Duplicar Unidad**: Copiar unidad completa con sus temas
3. **Plantillas**: Templates de unidades predefinidas
4. **Importar/Exportar**: Compartir unidades entre cursos
5. **Historial**: Ver cambios realizados en unidades
6. **Búsqueda**: Filtrar unidades por palabra clave
7. **Estadísticas**: Mostrar progreso y métricas de unidades
