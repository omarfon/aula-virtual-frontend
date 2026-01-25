const API_URL = 'http://localhost:3001';

async function obtenerRutasBackend() {
  console.log('\n🔍 ANALIZANDO RUTAS DISPONIBLES DEL BACKEND');
  console.log('='.repeat(50));

  const rutasComunes = [
    // Rutas de cursos y tareas
    'GET /cursos',
    'POST /cursos',
    'GET /cursos/:id',
    'PUT /cursos/:id',
    'DELETE /cursos/:id',
    'GET /cursos/:cursoId/tareas',
    'POST /cursos/:cursoId/tareas',
    'GET /cursos/:cursoId/tareas/:tareaId',
    'PUT /cursos/:cursoId/tareas/:tareaId',
    'DELETE /cursos/:cursoId/tareas/:tareaId',
    
    // Rutas de tareas-alumno (asignación)
    'GET /cursos/:cursoId/tareas-alumno/:alumnoId',
    'POST /cursos/tareas/:tareaId/asignar/:alumnoId',
    
    // Posibles rutas para entregar tareas
    'POST /tareas-alumno/:id/entregar',
    'PATCH /tareas-alumno/:id/entregar',
    'PUT /tareas-alumno/:id/entregar',
    'POST /cursos/tareas-alumno/:id/entregar',
    'PATCH /cursos/tareas-alumno/:id/entregar',
    'PUT /cursos/tareas-alumno/:id/entregar',
    'PATCH /tareas-alumno/:id',
    'PUT /tareas-alumno/:id',
  ];

  console.log('\n📋 Rutas esperadas según la documentación:\n');
  rutasComunes.forEach(ruta => console.log(`   ${ruta}`));

  // Intentar obtener información del servidor
  try {
    const response = await fetch(`${API_URL}/`);
    if (response.ok) {
      const data = await response.text();
      console.log('\n✅ Servidor responde en raíz:');
      console.log(data.substring(0, 200));
    }
  } catch (error) {
    console.log('\n❌ No se pudo conectar a la raíz del servidor');
  }

  console.log('\n💡 RECOMENDACIÓN:');
  console.log('   El backend debe implementar una de estas rutas:');
  console.log('   1. PATCH /tareas-alumno/:tareaAlumnoId (actualización completa)');
  console.log('   2. POST /tareas-alumno/:tareaAlumnoId/entregar (acción específica)');
  console.log('   3. PUT /tareas-alumno/:tareaAlumnoId (reemplazo completo)');
  console.log('\n   Body esperado:');
  console.log('   {');
  console.log('     archivoAdjunto: "data:image/png;base64,iVBORw0KGgo...",');
  console.log('     comentarioAlumno: "Comentario opcional",');
  console.log('     estado: "en-progreso" // o "completada"');
  console.log('   }');
}

obtenerRutasBackend().catch(console.error);
