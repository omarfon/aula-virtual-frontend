/**
 * Script para eliminar todas las tareas y asignaciones
 * Ejecutar con: npx ts-node scripts/limpiar-tareas.ts
 */

const API_URL = 'http://localhost:3001/cursos';

async function obtenerCursos() {
  const response = await fetch(`${API_URL}`);
  if (!response.ok) {
    throw new Error(`Error al obtener cursos: ${response.statusText}`);
  }
  return await response.json();
}

async function obtenerTareasCurso(cursoId: string) {
  const response = await fetch(`${API_URL}/${cursoId}/tareas`);
  if (!response.ok) {
    return [];
  }
  return await response.json();
}

async function eliminarTarea(cursoId: string, tareaId: string) {
  const response = await fetch(`${API_URL}/${cursoId}/tareas/${tareaId}`, {
    method: 'DELETE'
  });
  return response.ok;
}

async function limpiarTareas() {
  console.log('🧹 LIMPIANDO TODAS LAS TAREAS');
  console.log('=====================================\n');

  try {
    const cursos = await obtenerCursos();
    console.log(`📚 Encontrados ${cursos.length} cursos\n`);

    let totalTareas = 0;
    let tareasEliminadas = 0;
    let errores = 0;

    for (const curso of cursos) {
      console.log(`📖 Curso: ${curso.titulo}`);
      
      const tareas = await obtenerTareasCurso(curso.id);
      console.log(`   📝 ${tareas.length} tareas encontradas`);
      totalTareas += tareas.length;

      for (const tarea of tareas) {
        const eliminado = await eliminarTarea(curso.id, tarea.id);
        if (eliminado) {
          console.log(`   ✅ Eliminada: "${tarea.titulo}"`);
          tareasEliminadas++;
        } else {
          console.log(`   ❌ Error al eliminar: "${tarea.titulo}"`);
          errores++;
        }
      }
      console.log('');
    }

    console.log('=====================================');
    console.log('📊 RESUMEN');
    console.log('=====================================');
    console.log(`Total tareas: ${totalTareas}`);
    console.log(`✅ Eliminadas: ${tareasEliminadas}`);
    console.log(`❌ Errores: ${errores}`);
    console.log('=====================================\n');

    if (errores === 0 && totalTareas > 0) {
      console.log('✨ ¡Todas las tareas fueron eliminadas exitosamente!');
      console.log('\n💡 Ahora puedes ejecutar:');
      console.log('   1. node crear-tareas.js');
      console.log('   2. node asignar-tareas-alumno.js\n');
    } else if (totalTareas === 0) {
      console.log('ℹ️  No hay tareas para eliminar');
    } else {
      console.log('⚠️  Algunas tareas no pudieron ser eliminadas');
      console.log('   Verifica que el backend tenga el endpoint DELETE implementado\n');
    }

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

limpiarTareas();
