const API_URL = 'http://localhost:3001';
const ALUMNO_ID = 'c4532b80-e4d2-4b29-948c-70e11559fc3d';

/**
 * Función para extraer info del archivo (igual que en el componente)
 */
function extraerInfoArchivo(base64) {
  if (!base64 || base64.length === 0) return '';
  
  const match = base64.match(/^data:(.+?);base64,/);
  if (match && match[1]) {
    const mimeType = match[1];
    
    const tiposArchivo = {
      'application/pdf': 'Archivo PDF',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Documento Word',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Hoja de Excel',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Presentación PowerPoint',
      'application/msword': 'Documento Word',
      'application/vnd.ms-excel': 'Hoja de Excel',
      'application/vnd.ms-powerpoint': 'Presentación PowerPoint',
      'image/jpeg': 'Imagen JPEG',
      'image/jpg': 'Imagen JPG',
      'image/png': 'Imagen PNG',
      'image/gif': 'Imagen GIF',
      'text/plain': 'Archivo de texto',
      'application/zip': 'Archivo ZIP',
      'application/x-rar-compressed': 'Archivo RAR'
    };
    
    return tiposArchivo[mimeType] || 'Archivo adjunto';
  }
  
  return 'Archivo adjunto';
}

async function verificarVisualizacion() {
  console.log('\n📋 VERIFICANDO VISUALIZACIÓN DE ARCHIVOS ADJUNTOS');
  console.log('='.repeat(70));

  try {
    // Obtener tareas del alumno
    const cursos = [
      { id: '01515026-f343-4321-8933-d7a53f6307e7', nombre: 'Atención al Cliente' },
      { id: 'd0edb866-e341-47cf-a52d-25c4ae835b63', nombre: 'Cajero Bancario' },
      { id: 'e4a22c9b-aeca-4c80-b2ff-c8d8a2f0a1ab', nombre: 'Seguridad de la Información' }
    ];

    let tareasConArchivo = 0;

    for (const curso of cursos) {
      const response = await fetch(`${API_URL}/cursos/${curso.id}/tareas-alumno/${ALUMNO_ID}`);
      const tareasAlumno = await response.json();

      if (tareasAlumno.length === 0) continue;

      console.log(`\n📖 ${curso.nombre}:`);

      for (const tareaAlumno of tareasAlumno) {
        const tarea = tareaAlumno.tarea;
        
        if (tareaAlumno.archivoAdjunto) {
          tareasConArchivo++;
          
          // Extraer información del archivo
          const archivoInfo = extraerInfoArchivo(tareaAlumno.archivoAdjunto);
          const base64Preview = tareaAlumno.archivoAdjunto.substring(0, 100) + '...';
          const tamanoBase64 = tareaAlumno.archivoAdjunto.length;
          const tamanoKB = (tamanoBase64 * 0.75 / 1024).toFixed(2); // Aproximación del tamaño real

          console.log(`\n   📝 ${tarea.titulo}`);
          console.log(`   📊 Estado: ${tareaAlumno.estado}`);
          console.log(`   📎 Archivo adjunto:`);
          console.log(`      ✅ Tipo detectado: ${archivoInfo}`);
          console.log(`      📏 Tamaño Base64: ${tamanoBase64} caracteres (~${tamanoKB} KB)`);
          console.log(`      🔍 Vista previa: ${base64Preview}`);
          console.log(`      ✨ Lo que verá el usuario: "${archivoInfo}"`);
        } else {
          console.log(`   ⏭️  ${tarea.titulo} - Sin archivo adjunto`);
        }
      }
    }

    console.log('\n\n📊 RESUMEN:');
    console.log(`   ✅ Tareas con archivo adjunto: ${tareasConArchivo}`);
    console.log('\n💡 MEJORAS IMPLEMENTADAS:');
    console.log('   • Se extrae solo el tipo de archivo del Base64');
    console.log('   • No se guarda el Base64 completo en la interfaz');
    console.log('   • Visualización limpia con iconos y badges');
    console.log('   • Mapeo de tipos MIME a nombres legibles');
    console.log('\n🎨 CÓMO SE VERÁ EN LA UI:');
    console.log('   Antes: data:application/vnd.openxmlformats-officed...[3000 caracteres]');
    console.log('   Ahora: 📄 Hoja de Excel ✅');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

verificarVisualizacion().catch(console.error);
