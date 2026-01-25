const API_URL = 'http://localhost:3001/cursos';

const mapaCursos = {
    'Seguridad de la Información': 'Seguridad de la Información',
    'Atención al Cliente': 'Atención al Cliente de Excelencia',
    'Cajero Exitoso': 'Cajero Bancario Profesional'
};

const tareasMockup = [
    {
        titulo: 'Análisis de Vulnerabilidades',
        descripcion: 'Realizar un análisis de vulnerabilidades en un sistema simulado. Identificar al menos 5 vulnerabilidades críticas y proponer soluciones de mitigación.',
        curso: 'Seguridad de la Información',
        fechaEntrega: '2026-02-15',
        fechaAsignacion: '2026-02-01',
        estado: 'pendiente',
        puntosPosibles: 100,
        prioridad: 'alta'
    },
    {
        titulo: 'Plan de Respuesta a Incidentes',
        descripcion: 'Elaborar un plan detallado de respuesta a incidentes de ciberseguridad para una empresa bancaria. Debe incluir fases, responsables y procedimientos.',
        curso: 'Seguridad de la Información',
        fechaEntrega: '2026-02-18',
        fechaAsignacion: '2026-02-05',
        estado: 'en-progreso',
        puntosPosibles: 120,
        prioridad: 'alta'
    },
    {
        titulo: 'Caso Práctico: Cliente Insatisfecho',
        descripcion: 'Analizar un caso de cliente insatisfecho y desarrollar una estrategia de solución aplicando técnicas de comunicación efectiva y empatía.',
        curso: 'Atención al Cliente',
        fechaEntrega: '2026-02-12',
        fechaAsignacion: '2026-02-01',
        estado: 'pendiente',
        puntosPosibles: 80,
        prioridad: 'media'
    },
    {
        titulo: 'Política de Contraseñas Seguras',
        descripcion: 'Diseñar una política de contraseñas seguras para una organización, incluyendo requisitos técnicos y procedimientos de gestión.',
        curso: 'Seguridad de la Información',
        fechaEntrega: '2026-02-08',
        fechaAsignacion: '2026-01-25',
        estado: 'completada',
        puntosPosibles: 90,
        prioridad: 'alta'
    },
    {
        titulo: 'Simulación de Atención Telefónica',
        descripcion: 'Grabar y analizar una simulación de atención telefónica aplicando las técnicas de escucha activa y manejo de objeciones.',
        curso: 'Atención al Cliente',
        fechaEntrega: '2026-02-05',
        fechaAsignacion: '2026-01-20',
        estado: 'en-progreso',
        puntosPosibles: 100,
        prioridad: 'baja'
    },
    {
        titulo: 'Procedimientos de Arqueo de Caja',
        descripcion: 'Documentar paso a paso los procedimientos de arqueo de caja, incluyendo formatos y medidas de control.',
        curso: 'Cajero Exitoso',
        fechaEntrega: '2026-02-14',
        fechaAsignacion: '2026-02-01',
        estado: 'en-progreso',
        puntosPosibles: 85,
        prioridad: 'media'
    },
    {
        titulo: 'Detección de Billetes Falsos',
        descripcion: 'Investigar y documentar las técnicas de detección de billetes falsos, incluyendo características de seguridad del dinero peruano.',
        curso: 'Cajero Exitoso',
        fechaEntrega: '2026-02-03',
        fechaAsignacion: '2026-01-20',
        estado: 'completada',
        puntosPosibles: 100,
        prioridad: 'media'
    },
    {
        titulo: 'Manual de Fidelización de Clientes',
        descripcion: 'Crear un manual de estrategias de fidelización de clientes para una empresa de servicios bancarios.',
        curso: 'Atención al Cliente',
        fechaEntrega: '2026-02-28',
        fechaAsignacion: '2026-02-10',
        estado: 'pendiente',
        puntosPosibles: 90,
        prioridad: 'baja'
    },
    {
        titulo: 'Protocolos de Seguridad en Ventanilla',
        descripcion: 'Elaborar un documento con los protocolos de seguridad que debe seguir un cajero de ventanilla, incluyendo situaciones de riesgo.',
        curso: 'Cajero Exitoso',
        fechaEntrega: '2026-02-20',
        fechaAsignacion: '2026-02-06',
        estado: 'pendiente',
        puntosPosibles: 95,
        prioridad: 'alta'
    },
    {
        titulo: 'Encriptación de Datos Sensibles',
        descripcion: 'Investigar y comparar al menos 3 métodos de encriptación para proteger datos sensibles en sistemas bancarios.',
        curso: 'Seguridad de la Información',
        fechaEntrega: '2026-02-25',
        fechaAsignacion: '2026-02-01',
        estado: 'pendiente',
        puntosPosibles: 100,
        prioridad: 'media'
    }
];

async function obtenerCursos() {
    console.log('📚 Obteniendo cursos de la BD...');
    const response = await fetch(API_URL);
    const cursos = await response.json();
    console.log(`✅ ${cursos.length} cursos encontrados\n`);
    return cursos;
}

async function crearTarea(cursoId, tareaData) {
    const url = `${API_URL}/${cursoId}/tareas`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(tareaData)
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Error ${response.status}: ${error}`);
    }
    
    return await response.json();
}

async function obtenerTareasCurso(cursoId) {
    const response = await fetch(`${API_URL}/${cursoId}/tareas`);
    if (!response.ok) {
        return [];
    }
    return await response.json();
}

async function tareaExiste(cursoId, tituloTarea) {
    const tareas = await obtenerTareasCurso(cursoId);
    return tareas.some(tarea => tarea.titulo === tituloTarea);
}

async function main() {
    console.log('🎯 CREADOR DE TAREAS EN BASE DE DATOS');
    console.log('=====================================\n');
    
    let creadas = 0;
    let errores = 0;

    try {
        const cursos = await obtenerCursos();
        
        const cursosMap = {};
        cursos.forEach(curso => {
            cursosMap[curso.titulo] = curso;
        });

        console.log('🚀 Iniciando creación de tareas...\n');

        for (const tareaMockup of tareasMockup) {
            const tituloReal = mapaCursos[tareaMockup.curso];
            const curso = cursosMap[tituloReal];

            if (!curso) {
                console.log(`❌ Curso no encontrado: ${tareaMockup.curso} (${tituloReal})`);
                errores++;
                continue;
            }

            // Verificar si la tarea ya existe
            const existe = await tareaExiste(curso.id, tareaMockup.titulo);
            if (existe) {
                console.log(`⚠️  Tarea ya existe: "${tareaMockup.titulo}" en ${curso.titulo}`);
                errores++;
                continue;
            }

            try {
                const tareaData = {
                    titulo: tareaMockup.titulo,
                    descripcion: tareaMockup.descripcion,
                    fechaEntrega: tareaMockup.fechaEntrega,
                    fechaAsignacion: tareaMockup.fechaAsignacion,
                    puntosPosibles: tareaMockup.puntosPosibles,
                    prioridad: tareaMockup.prioridad,
                    estado: tareaMockup.estado
                };

                await crearTarea(curso.id, tareaData);
                console.log(`✅ Tarea creada: "${tareaMockup.titulo}" en ${curso.titulo}`);
                creadas++;
            } catch (error) {
                console.log(`❌ Error al crear "${tareaMockup.titulo}": ${error.message}`);
                errores++;
            }
        }

        console.log('\n=====================================');
        console.log('📊 RESUMEN');
        console.log('=====================================');
        console.log(`Total:   ${tareasMockup.length} tareas`);
        console.log(`✅ Creadas: ${creadas} tareas`);
        console.log(`❌ Errores: ${errores} tareas`);
        console.log('=====================================\n');
        console.log('✨ Proceso completado exitosamente!\n');

    } catch (error) {
        console.error(`\n💥 Error fatal: ${error.message}\n`);
        process.exit(1);
    }
}

main();
