const API_URL = 'http://localhost:3001/cursos';

async function obtenerCursos() {
    console.log('📚 Obteniendo cursos...');
    const response = await fetch(API_URL);
    const cursos = await response.json();
    console.log(`✅ ${cursos.length} cursos encontrados\n`);
    return cursos;
}

async function obtenerTareasCurso(cursoId) {
    const response = await fetch(`${API_URL}/${cursoId}/tareas`);
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
    }
    return await response.json();
}

async function eliminarTarea(cursoId, tareaId) {
    const url = `${API_URL}/${cursoId}/tareas/${tareaId}`;
    const response = await fetch(url, {
        method: 'DELETE'
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Error ${response.status}: ${error}`);
    }
    
    return true;
}

async function main() {
    console.log('🗑️  ELIMINADOR DE TODAS LAS TAREAS');
    console.log('=====================================\n');
    
    let eliminadas = 0;
    let errores = 0;

    try {
        const cursos = await obtenerCursos();
        
        console.log('🚀 Iniciando eliminación de tareas...\n');

        for (const curso of cursos) {
            console.log(`📖 Curso: ${curso.titulo}`);
            
            try {
                const tareas = await obtenerTareasCurso(curso.id);
                console.log(`   📝 ${tareas.length} tareas encontradas`);

                for (const tarea of tareas) {
                    try {
                        await eliminarTarea(curso.id, tarea.id);
                        console.log(`   ✅ Eliminada: "${tarea.titulo}"`);
                        eliminadas++;
                    } catch (error) {
                        console.log(`   ❌ Error al eliminar "${tarea.titulo}": ${error.message}`);
                        errores++;
                    }
                }
                console.log('');
            } catch (error) {
                console.log(`   ⚠️  Error al obtener tareas: ${error.message}\n`);
            }
        }

        console.log('=====================================');
        console.log('📊 RESUMEN');
        console.log('=====================================');
        console.log(`Total cursos: ${cursos.length}`);
        console.log(`✅ Tareas eliminadas: ${eliminadas}`);
        console.log(`❌ Errores: ${errores}`);
        console.log('=====================================\n');
        
        if (eliminadas > 0) {
            console.log('✨ Base de datos limpiada exitosamente!');
        }

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
    }
}

main();
