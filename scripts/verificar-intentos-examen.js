/**
 * Script de Verificación: Gestión de Intentos de Examen
 * 
 * Prueba todos los endpoints de intentos:
 * 1. Iniciar nuevo intento
 * 2. Entregar intento
 * 3. Listar intentos
 * 4. Obtener detalle de intento
 * 5. Calificar intento (simula profesor)
 * 6. Abandonar intento
 */

const API_URL = 'http://localhost:3000/api';
const EXAMEN_ALUMNO_ID = '676f0bfd6bfe46666c75ca40'; // Reemplazar con ID real

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(emoji, mensaje, color = colors.reset) {
  console.log(`${color}${emoji} ${mensaje}${colors.reset}`);
}

function header(titulo) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  ${titulo}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);
}

async function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TEST 1: Iniciar Nuevo Intento
// ============================================================================
async function test1_IniciarIntento() {
  header('TEST 1: Iniciar Nuevo Intento');
  
  try {
    const response = await fetch(
      `${API_URL}/examenes/examenes-alumno/${EXAMEN_ALUMNO_ID}/intentos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuestas: [] })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      log('❌', `Error: ${error.message}`, colors.red);
      return null;
    }

    const intento = await response.json();
    log('✅', 'Intento iniciado correctamente', colors.green);
    log('📝', `Intento #${intento.numeroIntento}`, colors.blue);
    log('🆔', `ID: ${intento.id}`, colors.blue);
    log('📅', `Fecha inicio: ${new Date(intento.fechaInicio).toLocaleString()}`, colors.blue);
    log('🟢', `Estado: ${intento.estado}`, colors.blue);
    
    return intento;
  } catch (error) {
    log('❌', `Error de conexión: ${error.message}`, colors.red);
    return null;
  }
}

// ============================================================================
// TEST 2: Listar Intentos
// ============================================================================
async function test2_ListarIntentos() {
  header('TEST 2: Listar Todos los Intentos');
  
  try {
    const response = await fetch(
      `${API_URL}/examenes/examenes-alumno/${EXAMEN_ALUMNO_ID}/intentos`
    );

    if (!response.ok) {
      const error = await response.json();
      log('❌', `Error: ${error.message}`, colors.red);
      return [];
    }

    const intentos = await response.json();
    log('✅', `${intentos.length} intento(s) encontrado(s)`, colors.green);
    
    intentos.forEach((intento, index) => {
      console.log(`\n${colors.yellow}Intento #${intento.numeroIntento}:${colors.reset}`);
      console.log(`  ID: ${intento.id}`);
      console.log(`  Estado: ${intento.estado}`);
      console.log(`  Fecha inicio: ${new Date(intento.fechaInicio).toLocaleString()}`);
      
      if (intento.fechaEntrega) {
        console.log(`  Fecha entrega: ${new Date(intento.fechaEntrega).toLocaleString()}`);
      }
      
      if (intento.calificacion !== null && intento.calificacion !== undefined) {
        console.log(`  Calificación: ${intento.calificacion}`);
      }
      
      if (intento.tiempoEmpleado) {
        const minutos = Math.floor(intento.tiempoEmpleado / 60);
        const segundos = intento.tiempoEmpleado % 60;
        console.log(`  Tiempo: ${minutos}m ${segundos}s`);
      }
    });
    
    return intentos;
  } catch (error) {
    log('❌', `Error de conexión: ${error.message}`, colors.red);
    return [];
  }
}

// ============================================================================
// TEST 3: Obtener Detalle de Intento
// ============================================================================
async function test3_ObtenerDetalle(intentoId) {
  header('TEST 3: Obtener Detalle de Intento');
  
  try {
    const response = await fetch(
      `${API_URL}/examenes/intentos/${intentoId}`
    );

    if (!response.ok) {
      const error = await response.json();
      log('❌', `Error: ${error.message}`, colors.red);
      return null;
    }

    const detalle = await response.json();
    log('✅', 'Detalle obtenido correctamente', colors.green);
    log('📋', `Intento #${detalle.numeroIntento}`, colors.blue);
    log('🎯', `Estado: ${detalle.estado}`, colors.blue);
    log('📝', `Respuestas: ${detalle.respuestas.length}`, colors.blue);
    
    if (detalle.examenAlumno?.examen) {
      log('📚', `Examen: ${detalle.examenAlumno.examen.titulo}`, colors.blue);
      log('❓', `Preguntas: ${detalle.examenAlumno.examen.preguntas?.length || 0}`, colors.blue);
    }
    
    return detalle;
  } catch (error) {
    log('❌', `Error de conexión: ${error.message}`, colors.red);
    return null;
  }
}

// ============================================================================
// TEST 4: Entregar Intento
// ============================================================================
async function test4_EntregarIntento(intentoId) {
  header('TEST 4: Entregar Intento');
  
  // Respuestas de ejemplo
  const respuestas = [
    { preguntaId: 'pregunta-1', respuesta: 'opción A' },
    { preguntaId: 'pregunta-2', respuesta: 'verdadero' },
    { preguntaId: 'pregunta-3', respuesta: 'Los componentes son bloques reutilizables...' }
  ];
  
  try {
    const response = await fetch(
      `${API_URL}/examenes/intentos/${intentoId}/entregar`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respuestas,
          tiempoEmpleado: 1800 // 30 minutos
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      log('❌', `Error: ${error.message}`, colors.red);
      return null;
    }

    const intento = await response.json();
    log('✅', 'Intento entregado correctamente', colors.green);
    log('📤', `Estado: ${intento.estado}`, colors.blue);
    log('📅', `Fecha entrega: ${new Date(intento.fechaEntrega).toLocaleString()}`, colors.blue);
    log('⏱️', `Tiempo empleado: ${Math.floor(intento.tiempoEmpleado / 60)}m ${intento.tiempoEmpleado % 60}s`, colors.blue);
    log('📝', `Respuestas guardadas: ${intento.respuestas.length}`, colors.blue);
    
    return intento;
  } catch (error) {
    log('❌', `Error de conexión: ${error.message}`, colors.red);
    return null;
  }
}

// ============================================================================
// TEST 5: Calificar Intento (Profesor)
// ============================================================================
async function test5_CalificarIntento(intentoId) {
  header('TEST 5: Calificar Intento (Profesor)');
  
  try {
    const response = await fetch(
      `${API_URL}/examenes/intentos/${intentoId}/calificar`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calificacion: 85,
          retroalimentacion: 'Excelente trabajo. Solo revisa la pregunta 3 sobre componentes.'
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      log('❌', `Error: ${error.message}`, colors.red);
      return null;
    }

    const intento = await response.json();
    log('✅', 'Intento calificado correctamente', colors.green);
    log('🎯', `Calificación: ${intento.calificacion}`, colors.blue);
    log('💬', `Retroalimentación: ${intento.retroalimentacion}`, colors.blue);
    log('📊', `Estado: ${intento.estado}`, colors.blue);
    
    if (intento.examenAlumno) {
      log('🏆', `Mejor intento del alumno: #${intento.examenAlumno.mejorIntento}`, colors.yellow);
      log('📈', `Mejor calificación: ${intento.examenAlumno.calificacion}`, colors.yellow);
    }
    
    return intento;
  } catch (error) {
    log('❌', `Error de conexión: ${error.message}`, colors.red);
    return null;
  }
}

// ============================================================================
// TEST 6: Abandonar Intento
// ============================================================================
async function test6_AbandonarIntento() {
  header('TEST 6: Abandonar Intento');
  
  // Primero iniciar un nuevo intento
  log('📝', 'Iniciando nuevo intento para abandonar...', colors.yellow);
  
  try {
    const responseIniciar = await fetch(
      `${API_URL}/examenes/examenes-alumno/${EXAMEN_ALUMNO_ID}/intentos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuestas: [] })
      }
    );

    if (!responseIniciar.ok) {
      const error = await responseIniciar.json();
      log('❌', `Error al iniciar: ${error.message}`, colors.red);
      return null;
    }

    const intentoIniciado = await responseIniciar.json();
    log('✅', `Intento #${intentoIniciado.numeroIntento} iniciado`, colors.green);
    
    // Esperar 2 segundos
    await esperar(2000);
    
    // Ahora abandonar
    log('🚫', 'Abandonando intento...', colors.yellow);
    
    const responseAbandonar = await fetch(
      `${API_URL}/examenes/intentos/${intentoIniciado.id}/abandonar`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!responseAbandonar.ok) {
      const error = await responseAbandonar.json();
      log('❌', `Error al abandonar: ${error.message}`, colors.red);
      return null;
    }

    const intentoAbandonado = await responseAbandonar.json();
    log('✅', 'Intento abandonado correctamente', colors.green);
    log('📊', `Estado: ${intentoAbandonado.estado}`, colors.blue);
    log('⚠️', 'Este intento cuenta como intento usado', colors.yellow);
    
    return intentoAbandonado;
  } catch (error) {
    log('❌', `Error de conexión: ${error.message}`, colors.red);
    return null;
  }
}

// ============================================================================
// EJECUTAR TODOS LOS TESTS
// ============================================================================
async function ejecutarTodos() {
  console.log(`\n${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  VERIFICACIÓN COMPLETA: GESTIÓN DE INTENTOS DE EXAMEN            ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  log('🌐', `API URL: ${API_URL}`, colors.cyan);
  log('🆔', `Examen Alumno ID: ${EXAMEN_ALUMNO_ID}`, colors.cyan);
  
  // TEST 1: Iniciar intento
  const intento = await test1_IniciarIntento();
  if (!intento) {
    log('⚠️', 'No se puede continuar sin un intento iniciado', colors.yellow);
    return;
  }
  
  await esperar(1000);
  
  // TEST 2: Listar intentos
  await test2_ListarIntentos();
  await esperar(1000);
  
  // TEST 3: Obtener detalle
  await test3_ObtenerDetalle(intento.id);
  await esperar(1000);
  
  // TEST 4: Entregar intento
  const intentoEntregado = await test4_EntregarIntento(intento.id);
  await esperar(1000);
  
  // TEST 5: Calificar intento
  if (intentoEntregado) {
    await test5_CalificarIntento(intentoEntregado.id);
    await esperar(1000);
  }
  
  // TEST 6: Abandonar intento
  await test6_AbandonarIntento();
  await esperar(1000);
  
  // Resumen final
  header('RESUMEN FINAL');
  await test2_ListarIntentos();
  
  console.log(`\n${colors.bright}${colors.green}`);
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  ✅ VERIFICACIÓN COMPLETA                                         ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
}

// Ejecutar
ejecutarTodos().catch(error => {
  log('❌', `Error fatal: ${error.message}`, colors.red);
  process.exit(1);
});
