-- Script SQL para eliminar todas las tareas
-- Ejecuta esto en tu cliente SQL (pgAdmin, DBeaver, etc.)

-- Primero eliminar las asignaciones de tareas (tarea_alumno)
DELETE FROM tarea_alumno;

-- Luego eliminar las tareas
DELETE FROM tarea;

-- Verificar que se eliminaron
SELECT COUNT(*) as total_tareas FROM tarea;
SELECT COUNT(*) as total_asignaciones FROM tarea_alumno;

-- Debería mostrar 0 en ambos casos
