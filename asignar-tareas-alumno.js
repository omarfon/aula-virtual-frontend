const { randomUUID } = require('crypto');
const fs = require('fs');

const API_URL = 'http://localhost:3001';
// Se guardará el ID del alumno creado
let ALUMNO_ID = null;

// Función para crear el alumno primero
async function crearAlumno() {
    console.log('👤 Creando alumno en el sistema...');
    
    try {
        const response = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: 'Alumno Demo',
                email: 'alumno.demo@test.com',
                password: 'demo123',
                rol: 'alumno'
            })
        });

        if (response.ok) {
            const alumno = await response.json();
            ALUMNO_ID = alumno.id;
            console.log(`✅ Alumno creado con ID: ${ALUMNO_ID}`);
            
            // Guardar el ID en un archivo para uso del frontend
            fs.writeFileSync('alumno-demo.json', JSON.stringify({ alumnoId: ALUMNO_ID }, null, 2));
            console.log(`💾 ID guardado en alumno-demo.json\n`);
            return true;
        } else if (response.status === 409 || response.status === 400) {
            // Si ya existe, intentar obtenerlo
            console.log(`⚠️  El alumno ya existe o hay error, intentando obtener usuarios...`);
            const getResponse = await fetch(`${API_URL}/usuarios`);
            if (getResponse.ok) {
                const usuarios = await getResponse.json();
                const alumnoDemo = usuarios.find(u => u.email === 'alumno.demo@test.com');
                if (alumnoDemo) {
                    ALUMNO_ID = alumnoDemo.id;
                    console.log(`✅ Usando alumno existente con ID: ${ALUMNO_ID}\n`);
                    return true;
                }
            }
            // Si no lo encontramos, generar UUID
            ALUMNO_ID = randomUUID();
            console.log(`⚠️  Usando UUID generado: ${ALUMNO_ID}\n`);
            return true;
        } else {
            const error = await response.text();
            console.log(`⚠️  No se pudo crear alumno: ${error}`);
            ALUMNO_ID = randomUUID();
            console.log(`   Usando UUID generado: ${ALUMNO_ID}\n`);
            return true;
        }
    } catch (error) {
        console.log(`⚠️  Error al crear alumno: ${error.message}`);
        ALUMNO_ID = randomUUID();
        console.log(`   Usando UUID generado: ${ALUMNO_ID}\n`);
        return true;
    }
}

async function obtenerCursos() {
    console.log('📚 Obteniendo cursos...');
    const response = await fetch(`${API_URL}/cursos`);
    const cursos = await response.json();
    console.log(`✅ ${cursos.length} cursos encontrados\n`);
    return cursos;
}

async function obtenerTareasCurso(cursoId) {
    const response = await fetch(`${API_URL}/cursos/${cursoId}/tareas`);
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
    }
    return await response.json();
}

async function asignarTarea(tareaId, alumnoId) {
    const url = `${API_URL}/cursos/tareas/${tareaId}/asignar/${alumnoId}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tareaId,
            alumnoId,
            estado: 'pendiente'
        })
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Error ${response.status}: ${error}`);
    }
    
    return await response.json();
}

async function asignarTodasLasTareas() {
    console.log('🎯 ASIGNADOR DE TAREAS A ALUMNO');
    console.log('=====================================\n');

    // Primero crear el alumno
    await crearAlumno();
    
    console.log(`👤 Alumno ID: ${ALUMNO_ID}\n`);

    let tareasAsignadas = 0;
    let errores = 0;

    try {
        // Obtener todos los cursos
        const cursos = await obtenerCursos();
        
        console.log('🚀 Iniciando asignación de tareas...\n');

        // Para cada curso, obtener sus tareas y asignarlas
        for (const curso of cursos) {
            console.log(`📖 Curso: ${curso.titulo}`);
            
            try {
                // Obtener tareas del curso
                const tareas = await obtenerTareasCurso(curso.id);
                console.log(`   📝 ${tareas.length} tareas encontradas`);

                // Asignar cada tarea al alumno
                for (const tarea of tareas) {
                    try {
                        await asignarTarea(tarea.id, ALUMNO_ID);
                        console.log(`   ✅ Asignada: "${tarea.titulo}"`);
                        tareasAsignadas++;
                    } catch (error) {
                        // Puede fallar si ya está asignada
                        if (error.message.includes('409') || error.message.includes('already')) {
                            console.log(`   ⚠️  Ya asignada: "${tarea.titulo}"`);
                            tareasAsignadas++; // Contar como éxito si ya existe
                        } else {
                            console.log(`   ❌ Error al asignar "${tarea.titulo}": ${error.message}`);
                            errores++;
                        }
                    }
                }
                console.log(''); // Línea en blanco entre cursos
            } catch (error) {
                console.log(`   ⚠️  No se pudieron obtener las tareas: ${error.message}\n`);
            }
        }

        console.log('=====================================');
        console.log('📊 RESUMEN');
        console.log('=====================================');
        console.log(`Total cursos: ${cursos.length}`);
        console.log(`✅ Tareas asignadas: ${tareasAsignadas}`);
        console.log(`❌ Errores: ${errores}`);
        console.log('=====================================\n');
        
        if (tareasAsignadas > 0) {
            console.log('✨ ¡Listo! Ahora el alumno puede ver sus tareas en "Mis Tareas"');
        }

    } catch (error) {
        console.error('❌ Error fatal:', error.message);
    }
}

// Ejecutar
asignarTodasLasTareas();
