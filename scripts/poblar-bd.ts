/**
 * Script para poblar la base de datos con cursos de ejemplo
 * Ejecutar con: npx ts-node scripts/poblar-bd.ts
 */

const API_URL = 'http://localhost:3001';

interface CreateCursoDto {
  titulo: string;
  descripcion: string;
  instructor: string;
  nivel: 'Principiante' | 'Intermedio' | 'Avanzado';
  imagen: string;
  categoria: string;
  estudiantes: number;
  duracionTotal: number;
  unidades: any[];
  tareas: any[];
  examenes: any[];
}

interface UnidadDto {
  numero: number;
  titulo: string;
  descripcion: string;
  temas?: TemaDto[];
}

interface TemaDto {
  titulo: string;
  descripcion: string;
  duracionEstimada: number;
  contenidos?: any[];
}

async function crearCurso(curso: CreateCursoDto) {
  const response = await fetch(`${API_URL}/cursos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(curso)
  });
  
  if (!response.ok) {
    throw new Error(`Error al crear curso: ${response.statusText}`);
  }
  
  return response.json();
}

async function crearUnidad(cursoId: string, unidad: UnidadDto) {
  const response = await fetch(`${API_URL}/cursos/${cursoId}/unidades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(unidad)
  });
  
  if (!response.ok) {
    throw new Error(`Error al crear unidad: ${response.statusText}`);
  }
  
  return response.json();
}

async function crearTema(cursoId: string, unidadId: string, tema: TemaDto) {
  const response = await fetch(`${API_URL}/cursos/${cursoId}/unidades/${unidadId}/temas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tema)
  });
  
  if (!response.ok) {
    throw new Error(`Error al crear tema: ${response.statusText}`);
  }
  
  return response.json();
}

async function verificarConexion() {
  console.log('🔍 Verificando conexión con el backend...');
  
  try {
    // Intentar con /api/cursos
    let response = await fetch(`${API_URL}/cursos`);
    if (response.ok || response.status === 404) {
      console.log(`✅ Backend conectado en ${API_URL}/cursos`);
      return true;
    }
    
    // Intentar sin /api
    const API_URL_ALT = 'http://localhost:3001';
    response = await fetch(`${API_URL_ALT}/cursos`);
    if (response.ok || response.status === 404) {
      console.log(`✅ Backend conectado en ${API_URL_ALT}/cursos`);
      console.log(`⚠️  NOTA: El backend no usa el prefijo /api`);
      return true;
    }
    
    throw new Error('Backend no responde');
  } catch (error: any) {
    console.error('❌ No se puede conectar al backend');
    console.error('   Asegúrate de que el backend está corriendo en http://localhost:3001');
    throw error;
  }
}

async function poblarBaseDeDatos() {
  console.log('🚀 Iniciando población de base de datos...\n');
  
  // Verificar conexión primero
  await verificarConexion();
  console.log('');

  const cursosData = [
    // CURSO 1: SEGURIDAD DE LA INFORMACIÓN
    {
      titulo: 'Seguridad de la Información',
      descripcion: 'Curso completo de ciberseguridad, protección de datos empresariales y gestión de riesgos informáticos',
      instructor: 'Ing. Patricia Ramírez',
      nivel: 'Intermedio' as const,
      imagen: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop',
      categoria: 'Seguridad',
      estudiantes: 0,
      duracionTotal: 120,
      unidades: [
        {
          numero: 1,
          titulo: 'Introducción a la Ciberseguridad',
          descripcion: 'Conceptos fundamentales de seguridad informática',
          temas: [
            { titulo: 'Conceptos Básicos de Seguridad', descripcion: 'Principios CIA: Confidencialidad, Integridad y Disponibilidad', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Tipos de Amenazas Cibernéticas', descripcion: 'Malware, phishing, ransomware y ataques DDoS', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Ingeniería Social', descripcion: 'Manipulación psicológica para obtener información', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Historia de la Ciberseguridad', descripcion: 'Evolución de las amenazas y defensas digitales', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Terminología Esencial', descripcion: 'Vocabulario técnico de seguridad informática', duracionEstimada: 30, contenidos: [] }
          ]
        },
        tareas: [
          {
            titulo: 'Análisis de Vulnerabilidades',
            descripcion: 'Identificar y documentar las principales vulnerabilidades en un sistema empresarial',
            fechaEntrega: '2026-02-15',
            puntosPosibles: 100,
            prioridad: 'alta' as const
          }
        ],
        examenes: [
          {
            titulo: 'Examen Final de Ciberseguridad',
            descripcion: 'Evaluación integral de conceptos de seguridad',
            fecha: '2026-03-15T10:00:00',
            duracion: 90,
            preguntasLista: [
              {
                texto: '¿Cuál es el propósito principal de un firewall?',
                tipo: 'opcion_multiple' as const,
                opciones: ['Acelerar internet', 'Filtrar tráfico no autorizado', 'Eliminar virus', 'Crear backups'],
                respuestaCorrecta: 1
              }
            ],
            porcentajeAprobacion: 70,
            intentosPermitidos: 2,
            tipo: 'mixto' as const
          }
        ]
      },
      unidades: [
        {
          numero: 1,
          titulo: 'Introducción a la Ciberseguridad',
          descripcion: 'Conceptos fundamentales de seguridad informática',
          temas: [
            { titulo: 'Conceptos Básicos de Seguridad', descripcion: 'Principios CIA: Confidencialidad, Integridad y Disponibilidad', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Tipos de Amenazas Cibernéticas', descripcion: 'Malware, phishing, ransomware y ataques DDoS', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Ingeniería Social', descripcion: 'Manipulación psicológica para obtener información', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Historia de la Ciberseguridad', descripcion: 'Evolución de las amenazas y defensas digitales', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Terminología Esencial', descripcion: 'Vocabulario técnico de seguridad informática', duracionEstimada: 30, contenidos: [] }
          ]
        },
        {
          numero: 2,
          titulo: 'Gestión de Contraseñas y Autenticación',
          descripcion: 'Creación y administración segura de credenciales',
          temas: [
            { titulo: 'Creación de Contraseñas Robustas', descripcion: 'Técnicas para generar contraseñas seguras', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Gestores de Contraseñas', descripcion: 'Uso de herramientas para administrar credenciales', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Autenticación Multifactor (MFA)', descripcion: 'Implementación de capas adicionales de seguridad', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Biometría y Tokens', descripcion: 'Métodos modernos de autenticación', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Políticas de Contraseñas', descripcion: 'Establecer reglas organizacionales de credenciales', duracionEstimada: 35, contenidos: [] }
          ]
        },
        {
          numero: 3,
          titulo: 'Protección de Datos Empresariales',
          descripcion: 'Salvaguardar información crítica de la organización',
          temas: [
            { titulo: 'Clasificación de Datos', descripcion: 'Categorizar información según sensibilidad', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Cifrado de Datos', descripcion: 'Técnicas de encriptación para proteger información', duracionEstimada: 55, contenidos: [] },
            { titulo: 'Copias de Seguridad', descripcion: 'Estrategias de backup y recuperación (3-2-1)', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Control de Acceso', descripcion: 'Gestión de permisos y privilegios de usuarios', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Prevención de Fugas de Datos (DLP)', descripcion: 'Herramientas para evitar pérdida de información', duracionEstimada: 50, contenidos: [] }
          ]
        },
        {
          numero: 4,
          titulo: 'Seguridad en Redes',
          descripcion: 'Protección de infraestructura de red corporativa',
          temas: [
            { titulo: 'Firewalls y Control de Acceso', descripcion: 'Configuración de barreras de protección de red', duracionEstimada: 50, contenidos: [] },
            { titulo: 'VPN y Conexiones Seguras', descripcion: 'Redes privadas virtuales para trabajo remoto', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Segmentación de Redes', descripcion: 'Dividir la red en zonas de seguridad', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Monitoreo de Tráfico', descripcion: 'Análisis de actividad de red para detectar anomalías', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Wi-Fi Seguro', descripcion: 'Configuración segura de redes inalámbricas', duracionEstimada: 35, contenidos: [] }
          ]
        },
        {
          numero: 5,
          titulo: 'Respuesta a Incidentes',
          descripcion: 'Procedimientos ante eventos de seguridad',
          temas: [
            { titulo: 'Detección de Anomalías', descripcion: 'Identificar comportamientos sospechosos en sistemas', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Plan de Respuesta', descripcion: 'Estrategia estructurada ante incidentes', duracionEstimada: 55, contenidos: [] },
            { titulo: 'Contención y Erradicación', descripcion: 'Aislar y eliminar amenazas activas', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Recuperación de Sistemas', descripcion: 'Restaurar operaciones normales post-incidente', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Análisis Forense Digital', descripcion: 'Investigación técnica de incidentes de seguridad', duracionEstimada: 60, contenidos: [] }
          ]
        },
        {
          numero: 6,
          titulo: 'Cumplimiento Normativo',
          descripcion: 'Regulaciones y estándares de seguridad',
          temas: [
            { titulo: 'Ley de Protección de Datos Personales', descripcion: 'Ley N° 29733 y regulaciones de privacidad', duracionEstimada: 50, contenidos: [] },
            { titulo: 'ISO 27001', descripcion: 'Estándar internacional de gestión de seguridad', duracionEstimada: 55, contenidos: [] },
            { titulo: 'PCI DSS', descripcion: 'Estándar de seguridad para datos de tarjetas', duracionEstimada: 45, contenidos: [] },
            { titulo: 'GDPR y Privacidad', descripcion: 'Reglamento general de protección de datos', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Auditorías de Seguridad', descripcion: 'Evaluaciones periódicas de cumplimiento', duracionEstimada: 40, contenidos: [] }
          ]
        },
        {
          numero: 7,
          titulo: 'Seguridad en el Puesto de Trabajo',
          descripcion: 'Prácticas seguras para usuarios finales',
          temas: [
            { titulo: 'Navegación Segura en Internet', descripcion: 'Evitar sitios maliciosos y descargas peligrosas', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Seguridad en Correo Electrónico', descripcion: 'Identificar phishing y correos sospechosos', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Política de Escritorio Limpio', descripcion: 'Protección física de documentos e información', duracionEstimada: 30, contenidos: [] },
            { titulo: 'Uso Seguro de Dispositivos USB', descripcion: 'Prevenir infecciones por medios externos', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Trabajo Remoto Seguro', descripcion: 'Mejores prácticas para teletrabajo', duracionEstimada: 45, contenidos: [] }
          ]
        }
      ]
    },
    // CURSO 2: CAJERO BANCARIO
    {
      curso: {
        titulo: 'Cajero Bancario Profesional',
        descripcion: 'Formación completa en operaciones de caja, manejo de efectivo y atención en ventanilla',
        instructor: 'Lic. Rosa Villegas',
        nivel: 'Avanzado' as const,
        imagen: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop',
        categoria: 'Operaciones Bancarias',
        estudiantes: 0,
        duracionTotal: 135,
        unidades: [],
        tareas: [
          {
            titulo: 'Simulación de Arqueo de Caja',
            descripcion: 'Realizar un arqueo completo y documentar el proceso',
            fechaEntrega: '2026-02-25',
            puntosPosibles: 120,
            prioridad: 'alta' as const
          }
        ],
        examenes: [
          {
            titulo: 'Examen de Operaciones Bancarias',
            descripcion: 'Evaluación integral de procedimientos de caja',
            fecha: '2026-03-20T09:00:00',
            duracion: 120,
            preguntasLista: [
              {
                texto: '¿Qué significa KYC en el contexto bancario?',
                tipo: 'opcion_multiple' as const,
                opciones: ['Keep Your Cash', 'Know Your Customer', 'Key Year Control', 'Keep Your Card'],
                respuestaCorrecta: 1
              }
            ],
            porcentajeAprobacion: 80,
            intentosPermitidos: 2,
            tipo: 'mixto' as const
          }
        ]
      },
      unidades: [
        {
          numero: 1,
          titulo: 'Introducción a Operaciones de Caja',
          descripcion: 'Fundamentos del rol del cajero bancario',
          temas: [
            { titulo: 'Rol del Cajero en el Banco', descripcion: 'Responsabilidades y funciones principales', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Tipos de Transacciones', descripcion: 'Depósitos, retiros, transferencias y pagos', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Normativa Bancaria Básica', descripcion: 'Regulaciones AML y KYC', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Ética y Confidencialidad', descripcion: 'Principios de integridad profesional', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Organización del Puesto de Trabajo', descripcion: 'Preparación y orden de la estación de caja', duracionEstimada: 30, contenidos: [] }
          ]
        },
        {
          numero: 2,
          titulo: 'Manejo de Efectivo',
          descripcion: 'Técnicas de conteo y custodia de dinero',
          temas: [
            { titulo: 'Conteo Manual de Billetes', descripcion: 'Técnicas rápidas y precisas de conteo', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Conteo de Monedas', descripcion: 'Procedimientos para manejo de cambio', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Uso de Máquinas Contadoras', descripcion: 'Operación de equipos automatizados', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Organización del Cajón', descripcion: 'Distribución eficiente de denominaciones', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Límites de Efectivo', descripcion: 'Gestión de montos máximos permitidos', duracionEstimada: 40, contenidos: [] }
          ]
        },
        {
          numero: 3,
          titulo: 'Detección de Billetes Falsos',
          descripcion: 'Identificación de características de seguridad',
          temas: [
            { titulo: 'Características de Seguridad', descripcion: 'Marcas de agua, hilos y hologramas', duracionEstimada: 55, contenidos: [] },
            { titulo: 'Técnicas de Verificación Manual', descripcion: 'Tacto, vista y luz UV', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Uso de Detectores Automáticos', descripcion: 'Máquinas verificadoras de autenticidad', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Procedimiento ante Billetes Sospechosos', descripcion: 'Protocolo de retención y reporte', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Normativa Legal', descripcion: 'Leyes sobre circulación de moneda falsa', duracionEstimada: 35, contenidos: [] }
          ]
        },
        {
          numero: 4,
          titulo: 'Arqueo de Caja',
          descripcion: 'Procedimientos de cierre y conciliación',
          temas: [
            { titulo: 'Preparación para el Arqueo', descripcion: 'Organización previa al conteo final', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Conteo y Verificación', descripcion: 'Proceso detallado de arqueo', duracionEstimada: 60, contenidos: [] },
            { titulo: 'Conciliación Contable', descripcion: 'Cuadre de operaciones vs efectivo', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Manejo de Diferencias', descripcion: 'Procedimientos ante faltantes o sobrantes', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Documentación y Reportes', descripcion: 'Llenado de formularios de cierre', duracionEstimada: 40, contenidos: [] }
          ]
        },
        {
          numero: 5,
          titulo: 'Seguridad en Caja',
          descripcion: 'Protección personal y del efectivo',
          temas: [
            { titulo: 'Medidas de Seguridad Física', descripcion: 'Mamparas, cámaras y botones de pánico', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Protocolo ante Asaltos', descripcion: 'Procedimientos de seguridad en emergencias', duracionEstimada: 55, contenidos: [] },
            { titulo: 'Prevención de Fraudes Internos', descripcion: 'Controles y auditorías', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Custodia de Valores', descripcion: 'Manejo seguro de grandes sumas', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Uso de Bóvedas y Cajas Fuertes', descripcion: 'Procedimientos de almacenamiento', duracionEstimada: 35, contenidos: [] }
          ]
        },
        {
          numero: 6,
          titulo: 'Sistemas Informáticos Bancarios',
          descripcion: 'Uso de plataformas digitales de caja',
          temas: [
            { titulo: 'Interfaz del Sistema Core', descripcion: 'Navegación en el software bancario', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Registro de Transacciones', descripcion: 'Captura correcta de operaciones', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Consultas y Reportes', descripcion: 'Extracción de información del sistema', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Solución de Problemas Técnicos', descripcion: 'Errores comunes y soluciones', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Seguridad Informática', descripcion: 'Protección de credenciales y datos', duracionEstimada: 35, contenidos: [] }
          ]
        },
        {
          numero: 7,
          titulo: 'Excelencia en Servicio al Cliente',
          descripcion: 'Atención de calidad en ventanilla',
          temas: [
            { titulo: 'Atención Rápida y Eficiente', descripcion: 'Optimización de tiempos de atención', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Comunicación Efectiva', descripcion: 'Claridad y empatía en la atención', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Manejo de Clientes Difíciles', descripcion: 'Técnicas de desescalamiento', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Venta Cruzada Ética', descripcion: 'Ofrecer productos bancarios adicionales', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Gestión de Quejas', descripcion: 'Resolver reclamos en primera instancia', duracionEstimada: 45, contenidos: [] }
          ]
        }
      ]
    },
    // CURSO 3: ATENCIÓN AL CLIENTE
    {
      curso: {
        titulo: 'Atención al Cliente de Excelencia',
        descripcion: 'Dominio completo de técnicas de servicio al cliente, comunicación efectiva y resolución de conflictos',
        instructor: 'Lic. Jorge Mendoza',
        nivel: 'Principiante' as const,
        imagen: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop',
        categoria: 'Atención al Cliente',
        estudiantes: 0,
        duracionTotal: 115,
        unidades: [],
        tareas: [
          {
            titulo: 'Role Play de Atención',
            descripcion: 'Simular atención a diferentes tipos de clientes',
            fechaEntrega: '2026-02-20',
            puntosPosibles: 80,
            prioridad: 'media' as const
          }
        ],
        examenes: [
          {
            titulo: 'Evaluación de Servicio al Cliente',
            descripcion: 'Test integral de técnicas de atención',
            fecha: '2026-03-10T14:00:00',
            duracion: 60,
            preguntasLista: [
              {
                texto: '¿Cuál es la mejor manera de manejar un cliente enojado?',
                tipo: 'opcion_multiple' as const,
                opciones: ['Ignorar sus quejas', 'Escuchar activamente y mostrar empatía', 'Transferir inmediatamente', 'Argumentar'],
                respuestaCorrecta: 1
              }
            ],
            porcentajeAprobacion: 75,
            intentosPermitidos: 3,
            tipo: 'opcion_multiple' as const
          }
        ]
      },
      unidades: [
        {
          numero: 1,
          titulo: 'Fundamentos del Servicio al Cliente',
          descripcion: 'Principios básicos de atención de calidad',
          temas: [
            { titulo: 'Qué es el Servicio al Cliente', descripcion: 'Concepto y importancia en las organizaciones', duracionEstimada: 35, contenidos: [] },
            { titulo: 'El Cliente como Centro', descripcion: 'Cultura organizacional orientada al cliente', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Tipos de Clientes', descripcion: 'Perfiles y características de clientes', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Expectativas del Cliente', descripcion: 'Comprender lo que los clientes esperan', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Ciclo de Vida del Cliente', descripcion: 'Etapas de la relación con el cliente', duracionEstimada: 35, contenidos: [] }
          ]
        },
        {
          numero: 2,
          titulo: 'Comunicación Efectiva',
          descripcion: 'Técnicas de comunicación verbal y no verbal',
          temas: [
            { titulo: 'Comunicación Verbal Clara', descripcion: 'Lenguaje simple y directo', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Lenguaje Corporal', descripcion: 'Gestos, postura y expresiones faciales', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Tono de Voz', descripcion: 'Calidez, seguridad y profesionalismo', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Escucha Activa', descripcion: 'Técnicas para escuchar y comprender', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Empatía y Asertividad', descripcion: 'Balance entre comprensión y firmeza', duracionEstimada: 45, contenidos: [] }
          ]
        },
        {
          numero: 3,
          titulo: 'Manejo de Objeciones y Quejas',
          descripcion: 'Gestión profesional de reclamos',
          temas: [
            { titulo: 'Tipos de Quejas Comunes', descripcion: 'Clasificación de reclamos frecuentes', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Técnicas de Resolución', descripcion: 'Estrategias para resolver conflictos', duracionEstimada: 55, contenidos: [] },
            { titulo: 'Conversión de Quejas en Oportunidades', descripcion: 'Transformar clientes insatisfechos en promotores', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Documentación de Reclamos', descripcion: 'Registro y seguimiento de quejas', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Escalamiento Apropiado', descripcion: 'Cuándo derivar a un supervisor', duracionEstimada: 40, contenidos: [] }
          ]
        },
        {
          numero: 4,
          titulo: 'Atención Telefónica',
          descripcion: 'Servicio de calidad por teléfono',
          temas: [
            { titulo: 'Protocolo de Llamadas', descripcion: 'Saludo, desarrollo y cierre profesional', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Claridad en la Comunicación', descripcion: 'Hablar claro y evitar ruidos', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Manejo de Llamadas Difíciles', descripcion: 'Clientes molestos o confundidos', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Transferencias Efectivas', descripcion: 'Derivar llamadas correctamente', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Seguimiento Post-Llamada', descripcion: 'Confirmar resolución de consultas', duracionEstimada: 30, contenidos: [] }
          ]
        },
        {
          numero: 5,
          titulo: 'Atención Digital',
          descripcion: 'Servicio en canales digitales',
          temas: [
            { titulo: 'Atención por Correo Electrónico', descripcion: 'Redacción profesional y oportuna', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Chat y WhatsApp', descripcion: 'Mensajería instantánea efectiva', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Redes Sociales', descripcion: 'Responder en Facebook, Twitter, Instagram', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Gestión de Reseñas Online', descripcion: 'Responder a comentarios positivos y negativos', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Etiqueta Digital', descripcion: 'Normas de cortesía en medios digitales', duracionEstimada: 30, contenidos: [] }
          ]
        },
        {
          numero: 6,
          titulo: 'Técnicas de Venta y Upselling',
          descripcion: 'Ofrecer valor adicional al cliente',
          temas: [
            { titulo: 'Identificación de Necesidades', descripcion: 'Descubrir qué necesita realmente el cliente', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Presentación de Productos', descripcion: 'Destacar beneficios sobre características', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Cross-Selling Ético', descripcion: 'Ofrecer productos complementarios', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Manejo de Objeciones de Venta', descripcion: 'Responder dudas sobre precios y productos', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Cierre de Ventas', descripcion: 'Técnicas para concretar la compra', duracionEstimada: 35, contenidos: [] }
          ]
        },
        {
          numero: 7,
          titulo: 'Excelencia y Mejora Continua',
          descripcion: 'Cultura de servicio excepcional',
          temas: [
            { titulo: 'Estándares de Calidad', descripcion: 'Definir y medir niveles de servicio', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Indicadores de Satisfacción', descripcion: 'NPS, CSAT y otras métricas', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Feedback del Cliente', descripcion: 'Recoger y usar opiniones para mejorar', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Capacitación Continua', descripcion: 'Actualización constante de habilidades', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Innovación en el Servicio', descripcion: 'Aplicar nuevas tecnologías y metodologías', duracionEstimada: 45, contenidos: [] }
          ]
        }
      ]
    }
  ];

  try {
    for (let i = 0; i < cursosData.length; i++) {
      const { curso, unidades } = cursosData[i];
      
      console.log(`\n📚 Creando curso ${i + 1}/3: ${curso.titulo}`);
      const cursoCreado = await crearCurso(curso);
      console.log(`✅ Curso creado con ID: ${cursoCreado.id}`);

      // Crear unidades
      for (let j = 0; j < unidades.length; j++) {
        const { temas, ...unidadData } = unidades[j];
        
        console.log(`  📖 Creando unidad ${j + 1}/7: ${unidadData.titulo}`);
        const unidadCreada = await crearUnidad(cursoCreado.id, unidadData);
        console.log(`  ✅ Unidad creada con ID: ${unidadCreada.id}`);

        // Crear temas
        if (temas) {
          for (let k = 0; k < temas.length; k++) {
            const tema = temas[k];
            console.log(`    📝 Creando tema ${k + 1}/5: ${tema.titulo}`);
            const temaCreado = await crearTema(cursoCreado.id, unidadCreada.id, tema);
            console.log(`    ✅ Tema creado`);
          }
        }
      }
    }

    console.log('\n\n🎉 ¡BASE DE DATOS POBLADA EXITOSAMENTE!');
    console.log('📊 Resumen:');
    console.log('   - 3 cursos creados');
    console.log('   - 21 unidades creadas (7 por curso)');
    console.log('   - 105 temas creados (5 por unidad, 35 por curso)');
    console.log('\n✅ Datos listos para consumir desde el frontend\n');
    
  } catch (error: any) {
    console.error('\n❌ ERROR al poblar la base de datos:');
    console.error(error.message);
    console.error('\nAsegúrate de que:');
    console.error('1. El backend está corriendo en http://localhost:3001');
    console.error('2. Los endpoints de la API están disponibles');
    console.error('3. La base de datos está conectada\n');
    throw error;
  }
}

// Ejecutar el script
poblarBaseDeDatos();
