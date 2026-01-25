const API_URL = 'http://localhost:3001/cursos';
const ALUMNO_ID = 'c4532b80-e4d2-4b29-948c-70e11559fc3d';

async function verificarTareas() {
    console.log('🔍 VERIFICADOR DE TAREAS');
    console.log('=====================================\n');
    
    try {
        // 1. Obtener cursos
        console.log('📚 Obteniendo cursos...');
        const cursosRes = await fetch(`${API_URL}`);
        const cursos = await cursosRes.json();
        console.log(`✅ ${cursos.length} cursos encontrados\n`);
        
        for (const curso of cursos) {
            console.log(`📖 Curso: ${curso.titulo} (ID: ${curso.id})`);
            
            // 2. Verificar tareas del curso
            const tareasUrl = `${API_URL}/${curso.id}/tareas`;
            console.log(`   🔗 GET ${tareasUrl}`);
            const tareasRes = await fetch(tareasUrl);
            
            if (tareasRes.ok) {
                const tareas = await tareasRes.json();
                console.log(`   📝 ${tareas.length} tareas encontradas`);
                tareas.forEach(t => console.log(`      - ${t.titulo}`));
            } else {
                console.log(`   ❌ Error al obtener tareas: ${tareasRes.status}`);
            }
            
            // 3. Verificar tareas asignadas al alumno
            const tareasAlumnoUrl = `${API_URL}/${curso.id}/tareas-alumno/${ALUMNO_ID}`;
            console.log(`   🔗 GET ${tareasAlumnoUrl}`);
            const tareasAlumnoRes = await fetch(tareasAlumnoUrl);
            
            if (tareasAlumnoRes.ok) {
                const tareasAlumno = await tareasAlumnoRes.json();
                console.log(`   👤 ${tareasAlumno.length} tareas asignadas al alumno`);
                tareasAlumno.forEach(t => {
                    const titulo = t.tarea?.titulo || t.titulo || 'Sin título';
                    const estado = t.estado || 'sin estado';
                    console.log(`      - ${titulo} (${estado})`);
                });
            } else {
                const error = await tareasAlumnoRes.text();
                console.log(`   ❌ Error al obtener tareas del alumno: ${tareasAlumnoRes.status}`);
                console.log(`      ${error}`);
            }
            
            console.log('');
        }
        
        console.log('=====================================');
        console.log('✅ Verificación completada\n');
        
    } catch (error) {
        console.error('❌ Error fatal:', error.message);
    }
}

verificarTareas();
