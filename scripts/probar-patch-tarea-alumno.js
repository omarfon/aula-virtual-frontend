const API_URL = 'http://localhost:3001';
const ALUMNO_ID = 'c4532b80-e4d2-4b29-948c-70e11559fc3d';

async function probarActualizacionDirecta() {
  console.log('\n🧪 PROBANDO ACTUALIZACIÓN DIRECTA DE TAREA-ALUMNO');
  console.log('='.repeat(60));

  // 1. Obtener una tarea asignada
  const cursoId = '01515026-f343-4321-8933-d7a53f6307e7'; // Atención al Cliente
  const response = await fetch(`${API_URL}/cursos/${cursoId}/tareas-alumno/${ALUMNO_ID}`);
  const tareasAlumno = await response.json();
  
  if (tareasAlumno.length === 0) {
    console.log('❌ No hay tareas asignadas');
    return;
  }

  const tareaAlumno = tareasAlumno[0];
  console.log(`\n📝 Tarea seleccionada: ${tareaAlumno.tarea.titulo}`);
  console.log(`🆔 TareaAlumnoId: ${tareaAlumno.id}`);
  console.log(`📊 Estado actual: ${tareaAlumno.estado}`);

  // 2. Intentar actualizar con PATCH en diferentes rutas
  const rutasProbar = [
    `/tareas-alumno/${tareaAlumno.id}`,
    `/cursos/tareas-alumno/${tareaAlumno.id}`,
  ];

  const archivoBase64 = 'data:text/plain;base64,RXN0ZSBlcyB1biBhcmNoaXZvIGRlIHBydWViYQ==';
  
  const payloads = [
    {
      nombre: 'Actualización completa',
      data: {
        estado: 'en-progreso',
        archivoAdjunto: archivoBase64,
        comentarioAlumno: 'Tarea entregada desde script de prueba'
      }
    },
    {
      nombre: 'Solo archivo',
      data: {
        archivoAdjunto: archivoBase64
      }
    },
    {
      nombre: 'Estado + archivo',
      data: {
        estado: 'completada',
        archivoAdjunto: archivoBase64
      }
    }
  ];

  for (const ruta of rutasProbar) {
    for (const payload of payloads) {
      console.log(`\n🔄 Probando: PATCH ${ruta}`);
      console.log(`   Payload: ${payload.nombre}`);
      
      try {
        const patchResponse = await fetch(`${API_URL}${ruta}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload.data)
        });

        console.log(`   Status: ${patchResponse.status}`);
        
        if (patchResponse.ok) {
          const resultado = await patchResponse.json();
          console.log('   ✅ ÉXITO!');
          console.log('   Respuesta:', JSON.stringify(resultado, null, 2));
          
          // Verificar cambio
          const verificacion = await fetch(`${API_URL}/cursos/${cursoId}/tareas-alumno/${ALUMNO_ID}`);
          const tareasActualizadas = await verificacion.json();
          const tareaActualizada = tareasActualizadas.find(t => t.id === tareaAlumno.id);
          console.log(`   📊 Estado actualizado: ${tareaActualizada.estado}`);
          console.log(`   📎 Archivo adjunto: ${tareaActualizada.archivoAdjunto ? 'SÍ' : 'NO'}`);
          
          return; // Salir si encontramos una ruta que funciona
        } else {
          const error = await patchResponse.text();
          console.log(`   ❌ Error: ${error.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`   ❌ Excepción: ${error.message}`);
      }
    }
  }

  console.log('\n❌ NINGUNA RUTA FUNCIONÓ');
  console.log('\n💡 SOLUCIÓN REQUERIDA:');
  console.log('   El backend necesita implementar un endpoint para entregar tareas.');
  console.log('   Opciones sugeridas:');
  console.log('   1. PATCH /tareas-alumno/:id');
  console.log('   2. POST /tareas-alumno/:id/entregar');
  console.log('   3. PUT /tareas-alumno/:id');
}

probarActualizacionDirecta().catch(console.error);
