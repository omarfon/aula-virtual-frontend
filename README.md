# Aula Virtual Frontend

Plataforma de gestión de aula virtual construida con Angular 21 y Tailwind CSS.

## Descripción

Aula Virtual es una aplicación web moderna para la gestión educativa que incluye:
- 📚 Gestión de cursos
- 📝 Sistema de tareas y asignaciones ✨ **NUEVO: Entrega de tareas**
- 📊 Dashboard con estadísticas
- 👥 Gestión de estudiantes y profesores
- 📈 Sistema de calificaciones
- 📎 Carga y entrega de archivos (Base64, máx. 5MB)

## Características

- **Angular 21**: Framework moderno con componentes standalone
- **Tailwind CSS**: Diseño responsive y moderno
- **Routing**: Navegación entre módulos
- **Servicios**: Arquitectura escalable con servicios inyectables
- **TypeScript**: Tipado estático para mayor seguridad
- **SweetAlert2**: Notificaciones elegantes y amigables
- **Entrega de Tareas**: Sistema completo de upload con validación de tamaño (5MB)

## Tecnologías

- Angular 21
- TypeScript
- Tailwind CSS
- RxJS

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## 📚 Documentación Adicional

### Integración con Backend

- [ENTREGA_TAREAS.md](docs/ENTREGA_TAREAS.md) - Sistema completo de entrega de tareas
- [INTEGRACION_BACKEND.md](docs/INTEGRACION_BACKEND.md) - Guía de integración con API
- [RESUMEN_INTEGRACION.md](docs/RESUMEN_INTEGRACION.md) - Resumen de endpoints

### Scripts Útiles

Ubicados en `scripts/`:

```bash
# Crear tareas de demostración (10 tareas en 3 cursos)
node scripts/crear-tareas.js

# Asignar tareas a alumno demo
node scripts/asignar-tareas-alumno.js

# Verificar tareas en backend
node scripts/verificar-tareas.js

# Probar endpoint de entrega
node scripts/probar-entregar-tarea.js

# Verificación completa del sistema
node scripts/verificacion-completa.js

# Limpiar entregas y restablecer tareas
node scripts/limpiar-entregas.js
```

### Configuración del Backend

El frontend espera que el backend esté corriendo en `http://localhost:3001`

Endpoints principales:
- `GET /cursos/:cursoId/tareas-alumno/:alumnoId` - Listar tareas del alumno
- `PATCH /cursos/tareas-alumno/:tareaAlumnoId` - Actualizar/entregar tarea
- `POST /cursos/tareas/:tareaId/asignar/:alumnoId` - Asignar tarea

Ver [ENTREGA_TAREAS.md](docs/ENTREGA_TAREAS.md) para documentación completa de endpoints.

## 🎯 Estado del Proyecto

✅ **Sistema de Entrega de Tareas**: COMPLETAMENTE FUNCIONAL (17 enero 2026)

- Frontend conectado correctamente al backend
- Validación de archivos (máx. 5MB)
- Conversión automática a Base64
- Actualización de estado en tiempo real
- Integración con SweetAlert2 para notificaciones

## 🚀 Inicio Rápido

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar backend** (debe estar en `http://localhost:3001`)

3. **Crear datos de prueba** (opcional)
   ```bash
   node scripts/crear-tareas.js
   node scripts/asignar-tareas-alumno.js
   ```

4. **Iniciar aplicación**
   ```bash
   npm start
   ```

5. **Navegar a** `http://localhost:4200`

6. **Probar entrega de tareas**
   - Ir a "Mis Tareas"
   - Seleccionar una tarea pendiente
   - Adjuntar archivo (<5MB)
   - Entregar tarea

## 📞 Soporte

Para problemas o preguntas, consulta la documentación en `docs/`
