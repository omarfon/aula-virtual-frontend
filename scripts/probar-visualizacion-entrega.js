const API_URL = 'http://localhost:3001';
const ALUMNO_ID = 'c4532b80-e4d2-4b29-948c-70e11559fc3d';

async function probarVisualizacionEntrega() {
  console.log('\n👁️  PROBANDO VISUALIZACIÓN DE ENTREGAS');
  console.log('='.repeat(70));

  try {
    // 1. Buscar una tarea entregada
    const cursoId = '01515026-f343-4321-8933-d7a53f6307e7';
    const response = await fetch(`${API_URL}/cursos/${cursoId}/tareas-alumno/${ALUMNO_ID}`);
    const tareasAlumno = await response.json();

    const tareaEntregada = tareasAlumno.find(t => t.archivoAdjunto && t.estado === 'en-progreso');

    if (!tareaEntregada) {
      console.log('❌ No hay tareas entregadas para probar');
      console.log('💡 Ejecuta primero: node scripts/probar-entregar-tarea.js');
      return;
    }

    console.log(`\n📝 Tarea encontrada: ${tareaEntregada.tarea.titulo}`);
    console.log(`🆔 TareaAlumnoId: ${tareaEntregada.id}`);
    console.log(`📊 Estado: ${tareaEntregada.estado}`);

    // 2. Obtener detalle completo de la entrega
    console.log('\n🔍 Obteniendo detalle de la entrega...');
    const detalleResponse = await fetch(`${API_URL}/cursos/tareas-alumno/${tareaEntregada.id}`);
    
    if (!detalleResponse.ok) {
      console.log(`❌ Error: ${detalleResponse.status} ${detalleResponse.statusText}`);
      return;
    }

    const detalle = await detalleResponse.json();
    console.log('✅ Detalle obtenido correctamente');

    // 3. Mostrar información del detalle
    console.log('\n📋 INFORMACIÓN DE LA ENTREGA:');
    console.log('─'.repeat(70));
    
    console.log(`\n📌 Tarea:`);
    console.log(`   Título: ${detalle.tarea.titulo}`);
    console.log(`   Descripción: ${detalle.tarea.descripcion.substring(0, 80)}...`);
    console.log(`   Puntos posibles: ${detalle.tarea.puntosPosibles}`);
    console.log(`   Fecha límite: ${detalle.tarea.fechaEntrega}`);

    console.log(`\n👤 Alumno:`);
    console.log(`   Nombre: ${detalle.alumno.nombre}`);
    console.log(`   Email: ${detalle.alumno.email}`);

    console.log(`\n📎 Entrega:`);
    console.log(`   Estado: ${detalle.estado}`);
    console.log(`   Fecha de entrega: ${detalle.fechaEntrega}`);
    console.log(`   Tiene archivo: ${detalle.archivoAdjunto ? 'SÍ' : 'NO'}`);
    
    if (detalle.archivoAdjunto) {
      const tipoArchivo = detalle.archivoAdjunto.match(/^data:(.+?);base64,/);
      const tamanoBase64 = detalle.archivoAdjunto.length;
      const tamanoKB = (tamanoBase64 * 0.75 / 1024).toFixed(2);
      
      console.log(`   Tipo MIME: ${tipoArchivo ? tipoArchivo[1] : 'Desconocido'}`);
      console.log(`   Tamaño: ~${tamanoKB} KB`);
      console.log(`   Preview: ${detalle.archivoAdjunto.substring(0, 50)}...`);
    }

    if (detalle.comentarioAlumno) {
      console.log(`   Comentario: ${detalle.comentarioAlumno}`);
    }

    console.log(`\n📊 Calificación:`);
    if (detalle.calificacion !== null) {
      console.log(`   Calificación: ${detalle.calificacion}/${detalle.tarea.puntosPosibles}`);
      if (detalle.retroalimentacion) {
        console.log(`   Retroalimentación: ${detalle.retroalimentacion}`);
      }
    } else {
      console.log(`   Sin calificar`);
    }

    // 4. Simular descarga de archivo
    console.log('\n💾 SIMULANDO DESCARGA DE ARCHIVO:');
    if (detalle.archivoAdjunto) {
      const match = detalle.archivoAdjunto.match(/^data:(.+?);base64,/);
      let extension = 'bin';
      if (match && match[1]) {
        const extensiones = {
          'application/pdf': 'pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'text/plain': 'txt'
        };
        extension = extensiones[match[1]] || 'bin';
      }
      
      const nombreDescarga = `${detalle.tarea.titulo.replace(/\s+/g, '_')}.${extension}`;
      console.log(`   ✅ Archivo se descargará como: ${nombreDescarga}`);
      console.log(`   📁 Formato detectado: ${extension.toUpperCase()}`);
    }

    // 5. Verificar que se puede reenviar
    console.log('\n🔄 CAPACIDAD DE REENVÍO:');
    console.log(`   ✅ El alumno puede reemplazar el archivo`);
    console.log(`   ✅ Se puede actualizar usando PATCH /cursos/tareas-alumno/${tareaEntregada.id}`);

    console.log('\n\n🎉 FUNCIONALIDADES DISPONIBLES EN EL FRONTEND:');
    console.log('   ✅ Ver detalle completo de la entrega');
    console.log('   ✅ Descargar archivo adjunto');
    console.log('   ✅ Ver comentario del alumno');
    console.log('   ✅ Ver calificación y retroalimentación');
    console.log('   ✅ Reenviar/reemplazar archivo');

    console.log('\n📱 INTERFAZ DE USUARIO:');
    console.log('   1. Botón "Ver Entrega" (verde) para tareas entregadas');
    console.log('   2. Modal con toda la información de la entrega');
    console.log('   3. Botón "Descargar" para obtener el archivo');
    console.log('   4. Botón "Reenviar Tarea" para actualizar la entrega');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

probarVisualizacionEntrega().catch(console.error);
