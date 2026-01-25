const API_URL = 'http://localhost:3001';
const ALUMNO_ID = 'c4532b80-e4d2-4b29-948c-70e11559fc3d';

async function limpiarEntregas() {
  console.log('\n🧹 LIMPIEZA DE ENTREGAS - RESTABLECER TAREAS');
  console.log('='.repeat(60));

  try {
    // Obtener todas las tareas del alumno
    const cursos = [
      { id: '01515026-f343-4321-8933-d7a53f6307e7', nombre: 'Atención al Cliente' },
      { id: 'd0edb866-e341-47cf-a52d-25c4ae835b63', nombre: 'Cajero Bancario' },
      { id: 'e4a22c9b-aeca-4c80-b2ff-c8d8a2f0a1ab', nombre: 'Seguridad de la Información' }
    ];

    let totalLimpiadas = 0;

    for (const curso of cursos) {
      const response = await fetch(`${API_URL}/cursos/${curso.id}/tareas-alumno/${ALUMNO_ID}`);
      const tareasAlumno = await response.json();

      console.log(`\n📖 ${curso.nombre}:`);

      for (const tareaAlumno of tareasAlumno) {
        // Solo limpiar si tiene archivo adjunto o estado diferente a pendiente
        if (tareaAlumno.archivoAdjunto || tareaAlumno.estado !== 'pendiente') {
          console.log(`   🔄 Limpiando: ${tareaAlumno.tarea.titulo}`);
          console.log(`      Estado anterior: ${tareaAlumno.estado}`);
          console.log(`      Archivo adjunto: ${tareaAlumno.archivoAdjunto ? 'SÍ' : 'NO'}`);

          const patchResponse = await fetch(`${API_URL}/cursos/tareas-alumno/${tareaAlumno.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              estado: 'pendiente',
              archivoAdjunto: null,
              comentarioAlumno: null
            })
          });

          if (patchResponse.ok) {
            console.log(`      ✅ Restablecida a pendiente`);
            totalLimpiadas++;
          } else {
            console.log(`      ❌ Error al restablecer`);
          }
        } else {
          console.log(`   ⏭️  ${tareaAlumno.tarea.titulo} - Ya está pendiente`);
        }
      }
    }

    console.log('\n'.repeat(2));
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log(`📊 Total de tareas restablecidas: ${totalLimpiadas}`);
    console.log('\n💡 Ahora todas las tareas están en estado "pendiente"');
    console.log('   sin archivos adjuntos ni comentarios.');

  } catch (error) {
    console.error('\n❌ Error en la limpieza:', error.message);
    throw error;
  }
}

limpiarEntregas().catch(console.error);
