# Integración con Backend - Aula Virtual

## Configuración de la API

### Variables de Entorno

La configuración de la URL de la API se encuentra en:

- **Desarrollo**: `src/environments/environment.ts`
- **Producción**: `src/environments/environment.prod.ts`

```typescript
// environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};

// environment.prod.ts (producción)
export const environment = {
  production: true,
  apiUrl: 'https://tu-api-produccion.com/api'
};
```

### Modelos TypeScript

Los modelos de datos están definidos en `src/app/models/curso.model.ts` y coinciden con los DTOs del backend NestJS:

#### Interfaces principales:

- **Curso**: Estructura completa del curso
- **CreateCursoDto**: DTO para crear cursos (coincide con el backend)
- **UpdateCursoDto**: DTO para actualizar cursos
- **Unidad**: Unidades de contenido del curso
- **Tema**: Temas dentro de cada unidad
- **Tarea**: Tareas asignables
- **Examen**: Exámenes con preguntas

### Servicio de Cursos

El servicio `CursosService` (`src/app/services/cursos.service.ts`) proporciona los siguientes métodos:

#### Operaciones CRUD:

- `getCursos()`: Obtiene todos los cursos
- `getCursoById(id)`: Obtiene un curso por ID
- `createCurso(curso)`: Crea un nuevo curso
- `updateCurso(id, curso)`: Actualiza un curso completo
- `patchCurso(id, curso)`: Actualiza parcialmente un curso
- `deleteCurso(id)`: Elimina un curso

#### Búsquedas:

- `getCursosByCategoria(categoria)`: Filtra por categoría
- `getCursosByNivel(nivel)`: Filtra por nivel

### Endpoints del Backend

El servicio se conecta a los siguientes endpoints:

```
GET    /api/cursos              - Listar todos los cursos
GET    /api/cursos/:id          - Obtener curso por ID
POST   /api/cursos              - Crear nuevo curso
PUT    /api/cursos/:id          - Actualizar curso
PATCH  /api/cursos/:id          - Actualizar parcialmente
DELETE /api/cursos/:id          - Eliminar curso
GET    /api/cursos?categoria=X  - Filtrar por categoría
GET    /api/cursos?nivel=X      - Filtrar por nivel
```

### Estructura del DTO CreateCursoDto

```typescript
{
  titulo: string;              // Requerido
  descripcion: string;         // Requerido
  instructor: string;          // Requerido
  nivel: 'Principiante' | 'Intermedio' | 'Avanzado'; // Requerido
  imagen: string;              // Requerido
  categoria: string;           // Requerido
  estudiantes?: number;        // Opcional (default: 0)
  duracionTotal?: number;      // Opcional (default: 0)
  unidades?: Unidad[];         // Opcional
  tareas?: Tarea[];            // Opcional
  examenes?: Examen[];         // Opcional
}
```

### Interceptor HTTP

Se ha configurado un interceptor HTTP (`src/app/interceptors/http.interceptor.ts`) que:

- Agrega headers automáticamente (`Content-Type`, `Accept`)
- Maneja errores globalmente
- Proporciona mensajes de error descriptivos
- Captura errores de conexión

### Manejo de Errores

El servicio implementa un sistema robusto de manejo de errores:

1. **Fallback a datos mock**: Si el backend no está disponible, usa datos de ejemplo
2. **Mensajes descriptivos**: Errores específicos según el código HTTP
3. **Logging**: Registro de errores en consola para debugging

### Modo Offline

El servicio incluye datos mock de respaldo que se activan automáticamente cuando:

- El backend no está disponible
- Hay problemas de conexión
- Se recibe un error del servidor

Esto permite desarrollar y probar el frontend sin necesidad de tener el backend activo.

### Configuración Recomendada del Backend

Para que funcione correctamente, el backend NestJS debe:

1. **CORS habilitado** para permitir peticiones del frontend
2. **Puerto configurado**: Por defecto `3000`, ajustar según necesidad
3. **Validación de DTOs**: Usar los decoradores de `class-validator`
4. **Swagger habilitado**: Para documentación de la API

### Ejemplo de Configuración CORS (Backend NestJS)

```typescript
// main.ts
app.enableCors({
  origin: 'http://localhost:4200', // URL del frontend Angular
  credentials: true,
});
```

### Testing

Para probar la integración:

1. **Sin backend**: El servicio usará automáticamente los datos mock
2. **Con backend**: 
   - Asegúrate de que el backend esté ejecutándose
   - Verifica la URL en `environment.ts`
   - Revisa la consola del navegador para logs

### Próximos pasos

1. Implementar autenticación con JWT
2. Agregar guards de rutas
3. Implementar caché de datos
4. Agregar paginación
5. Implementar búsqueda avanzada
6. Agregar subida de archivos para imágenes

## Comandos Útiles

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm start

# Compilar para producción
npm run build

# Ejecutar tests
npm test
```

## Notas Importantes

- Todos los IDs de curso deben ser strings (UUID o similar)
- Las fechas deben estar en formato ISO 8601
- Las imágenes se almacenan como URLs (considerar implementar subida de archivos)
- Mantener sincronizados los DTOs del frontend con el backend
