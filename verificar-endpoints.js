const API_URL = 'http://localhost:3001/cursos';
const ALUMNO_ID = 'c4532b80-e4d2-4b29-948c-70e11559fc3d';

async function verificarEndpoints() {
    console.log('🔍 VERIFICADOR DE ENDPOINTS DEL BACKEND');
    console.log('=====================================\n');
    
    try {
        // Obtener un curso y tarea para probar
        const cursosRes = await fetch(`${API_URL}`);
        const cursos = await cursosRes.json();
        const curso = cursos[0];
        
        const tareasRes = await fetch(`${API_URL}/${curso.id}/tareas-alumno/${ALUMNO_ID}`);
        const tareas = await tareasRes.json();
        const tarea = tareas[0];
        
        console.log(`📖 Curso: ${curso.titulo}`);
        console.log(`📝 Tarea: ${tarea.tarea.titulo}`);
        console.log(`🆔 TareaAlumnoId: ${tarea.id}\n`);
        
        // Probar diferentes endpoints
        const endpoints = [
            { method: 'POST', url: `${API_URL}/tareas-alumno/${tarea.id}/entregar`, desc: 'Entregar tarea (ruta actual)' },
            { method: 'POST', url: `http://localhost:3001/tareas-alumno/${tarea.id}/entregar`, desc: 'Entregar tarea (sin /cursos)' },
            { method: 'PATCH', url: `${API_URL}/tareas-alumno/${tarea.id}/entregar`, desc: 'Entregar tarea (PATCH)' },
            { method: 'POST', url: `${API_URL}/${curso.id}/tareas/${tarea.tarea.id}/entregar/${ALUMNO_ID}`, desc: 'Entregar tarea (ruta con cursoId)' }
        ];
        
        console.log('🧪 Probando endpoints...\n');
        
        for (const endpoint of endpoints) {
            const testBody = { archivoAdjunto: 'data:text/plain;base64,dGVzdA==', comentarioAlumno: 'test' };
            
            try {
                const response = await fetch(endpoint.url, {
                    method: endpoint.method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testBody)
                });
                
                if (response.ok || response.status === 400) {
                    console.log(`✅ ${endpoint.method} ${endpoint.url}`);
                    console.log(`   ${endpoint.desc} - Status: ${response.status}\n`);
                } else {
                    console.log(`❌ ${endpoint.method} ${endpoint.url}`);
                    console.log(`   ${endpoint.desc} - Status: ${response.status}`);
                    const text = await response.text();
                    console.log(`   ${text}\n`);
                }
            } catch (error) {
                console.log(`❌ ${endpoint.method} ${endpoint.url}`);
                console.log(`   ${endpoint.desc} - Error: ${error.message}\n`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verificarEndpoints();
