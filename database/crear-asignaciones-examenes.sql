-- Script para crear asignaciones de exámenes a alumnos
-- Ejecuta este script en tu base de datos para crear los registros de ExamenAlumno necesarios

-- ============================================
-- 1. Verificar datos existentes
-- ============================================

-- Ver todos los exámenes disponibles
SELECT id, titulo FROM Examen;

-- Ver todos los alumnos
SELECT id, nombre, email FROM Usuario WHERE rol = 'alumno';

-- Ver todos los cursos
SELECT id, titulo FROM Curso;

-- Ver asignaciones existentes
SELECT * FROM ExamenAlumno;


-- ============================================
-- 2. Crear asignaciones de examen a alumnos
-- ============================================

-- EJEMPLO: Asignar un examen a un alumno específico
-- Reemplaza los valores con tus IDs reales

INSERT INTO ExamenAlumno (
    id,
    examenId,
    alumnoId,
    cursoId,
    intentosPermitidos,
    fechaAsignacion,
    fechaLimite
) VALUES (
    NEWID(),                        -- Genera un nuevo GUID
    '11111111-1111-1111-1111-111111111111',  -- ID del examen (reemplazar)
    '22222222-2222-2222-2222-222222222222',  -- ID del alumno (reemplazar)
    '33333333-3333-3333-3333-333333333333',  -- ID del curso (reemplazar)
    3,                              -- 3 intentos permitidos
    GETDATE(),                      -- Fecha de asignación = ahora
    DATEADD(day, 7, GETDATE())      -- Fecha límite = 7 días desde ahora
);


-- ============================================
-- 3. Asignar un examen a TODOS los alumnos de un curso
-- ============================================

-- OPCIÓN 1: Asignar a todos los alumnos inscritos en un curso específico
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
    '11111111-1111-1111-1111-111111111111',  -- ID del examen a asignar (reemplazar)
    cu.usuarioId,                            -- ID del alumno
    cu.cursoId,                              -- ID del curso
    3,                                       -- 3 intentos
    GETDATE(),
    DATEADD(day, 7, GETDATE())
FROM CursoUsuario cu
WHERE cu.cursoId = '33333333-3333-3333-3333-333333333333'  -- ID del curso (reemplazar)
  AND cu.rol = 'estudiante'
  AND NOT EXISTS (
      -- Evitar duplicados
      SELECT 1 FROM ExamenAlumno ea 
      WHERE ea.examenId = '11111111-1111-1111-1111-111111111111'
        AND ea.alumnoId = cu.usuarioId
  );


-- ============================================
-- 4. Verificar que se crearon correctamente
-- ============================================

SELECT 
    ea.id,
    e.titulo AS examen,
    u.nombre AS alumno,
    c.titulo AS curso,
    ea.intentosPermitidos,
    ea.fechaAsignacion,
    ea.fechaLimite
FROM ExamenAlumno ea
INNER JOIN Examen e ON ea.examenId = e.id
INNER JOIN Usuario u ON ea.alumnoId = u.id
INNER JOIN Curso c ON ea.cursoId = c.id
ORDER BY ea.fechaAsignacion DESC;


-- ============================================
-- 5. EJEMPLO PRÁCTICO: Crear examen de prueba y asignarlo
-- ============================================

-- Paso 1: Crear un examen de prueba
DECLARE @examenId UNIQUEIDENTIFIER = NEWID();
DECLARE @cursoId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM Curso);

INSERT INTO Examen (
    id,
    titulo,
    descripcion,
    cursoId,
    temaId,
    tiempoLimite,
    intentosPermitidos,
    porcentajeAprobacion,
    puntosTotales,
    estado,
    fechaCreacion
) VALUES (
    @examenId,
    'Examen de Prueba - Integración Frontend',
    'Este es un examen de prueba para verificar la integración',
    @cursoId,
    NULL,
    60,      -- 60 minutos
    3,       -- 3 intentos
    70,      -- 70% para aprobar
    100,     -- 100 puntos totales
    'activo',
    GETDATE()
);

-- Paso 2: Asignarlo a todos los alumnos
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
    @examenId,
    u.id,
    @cursoId,
    3,
    GETDATE(),
    DATEADD(day, 14, GETDATE())  -- 14 días para completar
FROM Usuario u
WHERE u.rol = 'alumno';

-- Verificar
SELECT 
    ea.id AS 'ExamenAlumno ID',
    e.titulo AS 'Examen',
    u.nombre AS 'Alumno',
    ea.intentosPermitidos,
    ea.fechaLimite
FROM ExamenAlumno ea
INNER JOIN Examen e ON ea.examenId = e.id
INNER JOIN Usuario u ON ea.alumnoId = u.id
WHERE ea.examenId = @examenId;


-- ============================================
-- 6. Limpieza (si necesitas borrar todo y empezar de nuevo)
-- ============================================

-- ¡CUIDADO! Esto eliminará todas las asignaciones y sus intentos
-- DELETE FROM IntentoExamen;
-- DELETE FROM ExamenAlumno;
-- DELETE FROM RespuestaExamen;
-- DELETE FROM PreguntaExamen;
-- DELETE FROM Examen;


-- ============================================
-- 7. Solución rápida para el alumno actual
-- ============================================

-- Obtener el ID del alumno actual (reemplazar con el correcto)
DECLARE @alumnoIdActual UNIQUEIDENTIFIER = '22222222-2222-2222-2222-222222222222';

-- Asignar TODOS los exámenes existentes a este alumno
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
    @alumnoIdActual,
    e.cursoId,
    e.intentosPermitidos,
    GETDATE(),
    DATEADD(day, 30, GETDATE())
FROM Examen e
WHERE NOT EXISTS (
    SELECT 1 FROM ExamenAlumno ea 
    WHERE ea.examenId = e.id 
      AND ea.alumnoId = @alumnoIdActual
);

PRINT 'Asignaciones creadas exitosamente';
