const API_URL = 'http://localhost:3001';
const ALUMNO_ID = 'c4532b80-e4d2-4b29-948c-70e11559fc3d';

async function probarEntregarTarea() {
  console.log('\n✅ PROBANDO NUEVO ENDPOINT PATCH');
  console.log('='.repeat(60));

  try {
    // 1. Obtener una tarea pendiente
    const cursoId = '01515026-f343-4321-8933-d7a53f6307e7'; // Atención al Cliente
    const response = await fetch(`${API_URL}/cursos/${cursoId}/tareas-alumno/${ALUMNO_ID}`);
    const tareasAlumno = await response.json();
    
    const tareaPendiente = tareasAlumno.find(t => t.estado === 'pendiente');
    
    if (!tareaPendiente) {
      console.log('❌ No hay tareas pendientes para probar');
      return;
    }

    console.log(`\n📝 Tarea seleccionada: ${tareaPendiente.tarea.titulo}`);
    console.log(`🆔 TareaAlumnoId: ${tareaPendiente.id}`);
    console.log(`📊 Estado actual: ${tareaPendiente.estado}`);
    console.log(`📎 Archivo adjunto: ${tareaPendiente.archivoAdjunto || 'No'}`);

    // 2. Simular entrega con archivo Base64
    const archivoBase64 = 'data:text/plain;base64,RXN0ZSBlcyB1biBhcmNoaXZvIGRlIHBydWViYSBkZXNkZSBlbCBmcm9udGVuZA==';
    
    console.log('\n🚀 Enviando PATCH /cursos/tareas-alumno/:id...');
    
    const patchResponse = await fetch(`${API_URL}/cursos/tareas-alumno/${tareaPendiente.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        estado: 'en-progreso',
        archivoAdjunto: archivoBase64,
        comentarioAlumno: 'Tarea entregada desde el script de prueba'
      })
    });

    console.log(`📡 Status: ${patchResponse.status} ${patchResponse.statusText}`);

    if (!patchResponse.ok) {
      const errorText = await patchResponse.text();
      console.log('❌ Error en la respuesta:');
      console.log(errorText);
      return;
    }

    const resultado = await patchResponse.json();
    console.log('\n✅ ¡ENTREGA EXITOSA!');
    console.log('\n📋 Respuesta del servidor:');
    console.log(JSON.stringify(resultado, null, 2));

    // 3. Verificar cambios
    console.log('\n🔍 Verificando cambios...');
    const verificacion = await fetch(`${API_URL}/cursos/${cursoId}/tareas-alumno/${ALUMNO_ID}`);
    const tareasActualizadas = await verificacion.json();
    const tareaActualizada = tareasActualizadas.find(t => t.id === tareaPendiente.id);

    console.log(`\n✅ Estado actualizado: ${tareaActualizada.estado}`);
    console.log(`📎 Archivo adjunto: ${tareaActualizada.archivoAdjunto ? 'SÍ' : 'NO'}`);
    console.log(`💬 Comentario: ${tareaActualizada.comentarioAlumno || 'Sin comentario'}`);
    console.log(`📅 Fecha entrega: ${tareaActualizada.fechaEntrega || 'No establecida'}`);

    console.log('\n🎉 ¡ENDPOINT FUNCIONANDO CORRECTAMENTE!');

  } catch (error) {
    console.error('\n❌ Error en la prueba:', error.message);
    throw error;
  }
}

probarEntregarTarea().catch(console.error);
