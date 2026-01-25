# Error 404: Asignación de Examen No Encontrada

## 🔴 Problema

Al hacer clic en "Iniciar Examen", obtienes el error:
```
POST http://localhost:3001/examenes/examenes-alumno/d0834926-e60d-4be9-beec-001f17aed499/intentos 404 (Not Found)
Error HTTP: Asignación de examen no encontrada
```

## 🔍 Causa

El backend devuelve **404** porque **no existen registros en la tabla `ExamenAlumno`** en tu base de datos.

### Flujo de Datos

1. **Frontend** llama a `GET /examenes/alumnos/:alumnoId/mis-examenes`
2. **Backend** devuelve una lista de exámenes (posiblemente desde la tabla `Examen` o una vista)
3. **Frontend** muestra los exámenes en la lista
4. **Usuario** hace clic en "Iniciar Examen"
5. **Frontend** navega a `/examenes/tomar/:examenAlumnoId` y llama a `POST /examenes/examenes-alumno/:id/intentos`
6. **Backend** busca el registro en `ExamenAlumno` con ese ID
7. **Backend** no lo encuentra → **404 Error**

## ✅ Solución

Necesitas crear registros en la tabla `ExamenAlumno` que conecten:
- Un **examen** (`Examen`)
- Con un **alumno** (`Usuario`)
- En un **curso** (`Curso`)

### Opción 1: Crear Asignaciones Manualmente

```sql
-- Ver IDs disponibles
SELECT id, titulo FROM Examen;
SELECT id, nombre FROM Usuario WHERE rol = 'alumno';
SELECT id, titulo FROM Curso;

-- Crear asignación
INSERT INTO ExamenAlumno (
    id,
    examenId,
    alumnoId,
    cursoId,
    intentosPermitidos,
    fechaAsignacion,
    fechaLimite
) VALUES (
    NEWID(),                        -- Nuevo ID
    'TU-EXAMEN-ID',                 -- ID del examen
    'TU-ALUMNO-ID',                 -- ID del alumno
    'TU-CURSO-ID',                  -- ID del curso
    3,                              -- 3 intentos
    GETDATE(),                      -- Ahora
    DATEADD(day, 7, GETDATE())      -- 7 días límite
);
```

### Opción 2: Asignar a Todos los Alumnos de un Curso

```sql
INSERT INTO ExamenAlumno (
    id,
    examenId,
    alumnoId,
    cursoId,
    intentosPermitidos,
    fechaAsignacion,
    fechaLimite
)
SELECT 
    NEWID(),
    'TU-EXAMEN-ID',    -- ID del examen
    cu.usuarioId,      -- ID del alumno
    cu.cursoId,        -- ID del curso
    3,
    GETDATE(),
    DATEADD(day, 14, GETDATE())
FROM CursoUsuario cu
WHERE cu.cursoId = 'TU-CURSO-ID'
  AND cu.rol = 'estudiante';
```

### Opción 3: Usar el Script Completo

Ejecuta el archivo `database/crear-asignaciones-examenes.sql` que incluye:
- Verificación de datos existentes
- Creación de asignaciones
- Ejemplos prácticos
- Scripts de limpieza

## 📋 Pasos para Resolverlo

### 1. Identificar el Alumno Actual

En tu frontend, verifica qué ID de alumno estás usando:

```typescript
// En examenes.component.ts
console.log('🔍 ID del alumno:', this.alumnoId);
```

### 2. Verificar Exámenes Disponibles

```sql
-- Ver todos los exámenes
SELECT id, titulo, cursoId FROM Examen WHERE estado = 'activo';
```

### 3. Crear la Asignación

```sql
-- Ejemplo con IDs reales
DECLARE @alumnoId UNIQUEIDENTIFIER = 'tu-alumno-id-aqui';

-- Asignar todos los exámenes activos a este alumno
INSERT INTO ExamenAlumno (
    id,
    examenId,
    alumnoId,
    cursoId,
    intentosPermitidos,
    fechaAsignacion,
    fechaLimite
)
SELECT 
    NEWID(),
    e.id,
    @alumnoId,
    e.cursoId,
    3,
    GETDATE(),
    DATEADD(day, 30, GETDATE())
FROM Examen e
WHERE e.estado = 'activo';
```

### 4. Verificar que se Crearon

```sql
SELECT 
    ea.id AS 'ExamenAlumno ID',
    e.titulo AS 'Examen',
    u.nombre AS 'Alumno',
    c.titulo AS 'Curso',
    ea.intentosPermitidos,
    ea.fechaLimite
FROM ExamenAlumno ea
INNER JOIN Examen e ON ea.examenId = e.id
INNER JOIN Usuario u ON ea.alumnoId = u.id
INNER JOIN Curso c ON ea.cursoId = c.id;
```

### 5. Reiniciar el Backend

```bash
# Detener el servidor backend
# Reiniciar para que tome los nuevos datos
npm run start
```

### 6. Probar en el Frontend

1. Recargar la página en el navegador (`Ctrl + R`)
2. Ir a la lista de exámenes
3. Hacer clic en "Iniciar Examen"
4. Debería funcionar sin error 404

## 🛠️ Mejoras Implementadas

He actualizado el código para mostrar mensajes más claros:

### En `intentos-examen.service.ts`
```typescript
// Ahora muestra mensaje específico para 404
if (error.status === 404) {
  errorMessage = '⚠️ Asignación de examen no encontrada. 
                   El examen no está asignado al alumno en la base de datos. 
                   Contacta al profesor.';
}
```

### En `examenes.component.ts`
```typescript
// Validación adicional antes de navegar
if (!examenAlumno.id) {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: 'El examen no tiene un identificador válido. Contacta al profesor.'
  });
  return;
}

console.log('🚀 Navegando a tomar examen con ID:', examenAlumno.id);
```

## 🔄 Estructura de Datos Esperada

### Tabla `ExamenAlumno`

```sql
CREATE TABLE ExamenAlumno (
    id UNIQUEIDENTIFIER PRIMARY KEY,
    examenId UNIQUEIDENTIFIER NOT NULL,
    alumnoId UNIQUEIDENTIFIER NOT NULL,
    cursoId UNIQUEIDENTIFIER NOT NULL,
    intentosPermitidos INT DEFAULT 1,
    fechaAsignacion DATETIME DEFAULT GETDATE(),
    fechaLimite DATETIME NULL,
    FOREIGN KEY (examenId) REFERENCES Examen(id),
    FOREIGN KEY (alumnoId) REFERENCES Usuario(id),
    FOREIGN KEY (cursoId) REFERENCES Curso(id)
);
```

## ⚡ Solución Rápida (Copiar y Pegar)

**Reemplaza `TU-ALUMNO-ID` con el ID real de tu alumno:**

```sql
-- Paso 1: Encontrar tu ID de alumno
SELECT id, nombre, email FROM Usuario WHERE rol = 'alumno';

-- Paso 2: Copiar el ID y reemplazar abajo
DECLARE @miAlumnoId UNIQUEIDENTIFIER = 'PEGAR-TU-ID-AQUI';

-- Paso 3: Asignar todos los exámenes
INSERT INTO ExamenAlumno (id, examenId, alumnoId, cursoId, intentosPermitidos, fechaAsignacion, fechaLimite)
SELECT NEWID(), e.id, @miAlumnoId, e.cursoId, 3, GETDATE(), DATEADD(day, 30, GETDATE())
FROM Examen e
WHERE NOT EXISTS (SELECT 1 FROM ExamenAlumno ea WHERE ea.examenId = e.id AND ea.alumnoId = @miAlumnoId);

-- Paso 4: Verificar
SELECT COUNT(*) AS 'Exámenes Asignados' FROM ExamenAlumno WHERE alumnoId = @miAlumnoId;
```

## 📞 Si Persiste el Error

1. **Verifica que el endpoint devuelva datos correctos:**
   ```bash
   curl http://localhost:3001/examenes/alumnos/TU-ALUMNO-ID/mis-examenes
   ```

2. **Revisa la consola del backend** para ver qué query está ejecutando

3. **Asegúrate que el `id` devuelto** sea el de `ExamenAlumno`, no el de `Examen`

4. **Verifica las claves foráneas** en tu base de datos

## ✨ Resultado Esperado

Después de crear las asignaciones:

- ✅ La lista de exámenes se carga correctamente
- ✅ Al hacer clic en "Iniciar Examen" no hay error 404
- ✅ Se crea un nuevo `IntentoExamen` en la base de datos
- ✅ El componente `TomarExamenComponent` se carga con las preguntas
- ✅ El cronómetro inicia automáticamente
