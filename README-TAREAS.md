# 🗑️ LIMPIEZA Y ACTUALIZACIÓN DE TAREAS

## Situación Actual
- ✅ El script `crear-tareas.js` ya tiene fechas de febrero 2026
- ✅ Estados variados configurados (pendiente, en-progreso, completada)
- ✅ Validación de duplicados implementada

## ⚠️ El Backend NO tiene endpoint DELETE para tareas

### Opción 1: Limpiar desde la base de datos (RECOMENDADO)

Ejecuta este SQL en tu cliente PostgreSQL:

```sql
-- 1. Eliminar asignaciones de tareas
DELETE FROM tarea_alumno;

-- 2. Eliminar tareas
DELETE FROM tarea;

-- 3. Verificar que se eliminaron
SELECT COUNT(*) FROM tarea;
SELECT COUNT(*) FROM tarea_alumno;
```

Luego ejecuta:
```bash
node crear-tareas.js
node asignar-tareas-alumno.js
```

### Opción 2: Implementar endpoint DELETE en el backend

Agregar en el controlador de tareas:

```typescript
@Delete(':cursoId/tareas/:tareaId')
async eliminarTarea(
  @Param('cursoId') cursoId: string,
  @Param('tareaId') tareaId: string
) {
  return this.tareasService.eliminar(tareaId);
}
```

Luego ejecutar:
```bash
node eliminar-tareas.js
node crear-tareas.js
node asignar-tareas-alumno.js
```

### Opción 3: Usar las tareas existentes

Las tareas actuales ya tienen las fechas de febrero 2026 y estados variados.
Solo necesitas actualizar el frontend para reflejar los cambios.

## 📝 Archivos actualizados

1. **crear-tareas.js** - Fechas febrero 2026 + validación duplicados
2. **eliminar-tareas.js** - Script listo (requiere endpoint DELETE)
3. **asignar-tareas-alumno.js** - Asignación con UUID dinámico
4. **limpiar-base-datos.sql** - Script SQL manual

## ✅ Validación de duplicados

El script `crear-tareas.js` ahora previene la creación de tareas duplicadas:

```javascript
// Verifica antes de crear
const existe = await tareaExiste(curso.id, tareaMockup.titulo);
if (existe) {
  console.log(`⚠️  Tarea ya existe: "${tareaMockup.titulo}"`);
  continue;
}
```

## 🎯 Estados configurados

- **pendiente**: Análisis de Vulnerabilidades, Caso Práctico, Manual de Fidelización, Protocolos de Seguridad, Encriptación de Datos
- **en-progreso**: Plan de Respuesta, Simulación de Atención, Procedimientos de Arqueo
- **completada**: Política de Contraseñas, Detección de Billetes
