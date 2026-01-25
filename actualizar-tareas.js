const API_URL = 'http://localhost:3001/cursos';
const ALUMNO_ID = 'c4532b80-e4d2-4b29-948c-70e11559fc3d'; // Del archivo alumno-demo.json

const actualizaciones = {
    'Análisis de Vulnerabilidades': {
        estado: 'pendiente'
    },
    'Plan de Respuesta a Incidentes': {
        estado: 'en-progreso'
    },
    'Caso Práctico: Cliente Insatisfecho': {
        estado: 'pendiente'
    },
    'Política de Contraseñas Seguras': {
        estado: 'completada'
    },
    'Simulación de Atención Telefónica': {
        estado: 'en-progreso'
    },
    'Procedimientos de Arqueo de Caja': {
        estado: 'en-progreso'
    },
    'Detección de Billetes Falsos': {
        estado: 'completada'
    },
    'Manual de Fidelización de Clientes': {
        estado: 'pendiente'
    },
    'Protocolos de Seguridad en Ventanilla': {
        estado: 'pendiente'
    },
    'Encriptación de Datos Sensibles': {
        estado: 'pendiente'
    }
};

async function obtenerCursos() {
    console.log('📚 Obteniendo cursos...');
    const response = await fetch(API_URL);
    const cursos = await response.json();
    console.log(`✅ ${cursos.length} cursos encontrados\n`);
    return cursos;
}

async function obtenerTareasAlumnoCurso(cursoId, alumnoId) {
    const response = await fetch(`${API_URL}/${cursoId}/tareas-alumno/${alumnoId}`);
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
    }
    return await response.json();
}

async function actualizarTareaAlumno(tareaAlumnoId, estado) {
    const url = `${API_URL}/tareas-alumno/${tareaAlumnoId}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado })
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Error ${response.status}: ${error}`);
    }
    
    return await response.json();
}

async function main() {
    console.log('🔄 ACTUALIZADOR DE FECHAS Y ESTADOS DE TAREAS');
    console.log('=============================================\n');
    
    let actualizadas = 0;
    let errores = 0;

    try {
        const cursos = await obtenerCursos();
        
        console.log('🚀 Iniciando actualización...\n');

        for (const curso of cursos) {
            console.log(`📖 Curso: ${curso.titulo}`);
            
            try {
                const tareasAlumno = await obtenerTareasAlumnoCurso(curso.id, ALUMNO_ID);
                console.log(`   📝 ${tareasAlumno.length} tareas asignadas encontradas`);

                for (const tareaAlumno of tareasAlumno) {
                    const tituloTarea = tareaAlumno.tarea?.titulo || tareaAlumno.titulo;
                    const actualizacion = actualizaciones[tituloTarea];
                    
                    if (actualizacion) {
                        try {
                            await actualizarTareaAlumno(tareaAlumno.id, actualizacion.estado);
                            console.log(`   ✅ Actualizada: "${tituloTarea}" → ${actualizacion.estado}`);
                            actualizadas++;
                        } catch (error) {
                            console.log(`   ❌ Error al actualizar "${tituloTarea}": ${error.message}`);
                            errores++;
                        }
                    }
                }
                console.log('');
            } catch (error) {
                console.log(`   ⚠️  Error al obtener tareas: ${error.message}\n`);
            }
        }

        console.log('=============================================');
        console.log('📊 RESUMEN');
        console.log('=============================================');
        console.log(`Total cursos: ${cursos.length}`);
        console.log(`✅ Tareas actualizadas: ${actualizadas}`);
        console.log(`❌ Errores: ${errores}`);
        console.log('=============================================\n');
        
        if (actualizadas > 0) {
            console.log('✨ Estados de tareas actualizados!');
            console.log('📅 Las fechas están en febrero 2026 (definidas en las tareas base)');
        }

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
    }
}

main();
