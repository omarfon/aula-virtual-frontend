/**
 * Script simplificado para poblar la BD - Envía cursos completos con unidades y temas anidados
 * Ejecutar con: npx ts-node scripts/poblar-bd-simple.ts
 */

const API_URL = 'http://localhost:3001';

// Función para generar contenido por defecto si no existe
function generarContenidoPorDefecto(tituloTema: string, descripcionTema: string) {
  return [
    {
      tipo: 'texto',
      titulo: `Introducción a ${tituloTema}`,
      contenido: `<p><strong>${tituloTema}</strong> es un tema importante que aborda: ${descripcionTema}.</p>
        <p>En esta sección aprenderás:</p>
        <ul>
          <li>Conceptos fundamentales</li>
          <li>Mejores prácticas</li>
          <li>Casos de uso prácticos</li>
          <li>Ejemplos del mundo real</li>
        </ul>
        <p>Este contenido te proporcionará las bases necesarias para comprender y aplicar estos conocimientos en tu trabajo diario.</p>`
    },
    {
      tipo: 'video',
      titulo: `Tutorial de ${tituloTema}`,
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duracion: 10
    }
  ];
}

async function poblarBD() {
  console.log('🚀 Poblando base de datos...\n');

  const cursos = [
    {
      titulo: 'Seguridad de la Información',
      descripcion: 'Curso completo de ciberseguridad y protección de datos',
      instructor: 'Ing. Patricia Ramírez',
      nivel: 'Intermedio',
      imagen: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400',
      categoria: 'Seguridad',
      estudiantes: 0,
      duracionTotal: 120,
      unidades: [
        {
          numero: 1,
          titulo: 'Introducción a la Ciberseguridad',
          descripcion: 'Fundamentos de seguridad',
          temas: [
            { 
              titulo: 'Conceptos Básicos', 
              descripcion: 'Principios CIA', 
              duracionEstimada: 45, 
              contenidos: [
                {
                  tipo: 'texto',
                  titulo: 'Introducción a la Seguridad de la Información',
                  contenido: '<p>La seguridad de la información se fundamenta en tres pilares conocidos como la <strong>Tríada CIA</strong>: Confidencialidad, Integridad y Disponibilidad.</p><p><strong>Confidencialidad:</strong> Asegura que solo personas autorizadas puedan acceder a la información sensible.</p><p><strong>Integridad:</strong> Garantiza que los datos no sean alterados de forma no autorizada durante su almacenamiento o transmisión.</p><p><strong>Disponibilidad:</strong> Asegura que la información esté accesible cuando los usuarios autorizados la necesiten.</p>'
                },
                {
                  tipo: 'video',
                  titulo: 'Fundamentos de Ciberseguridad',
                  url: 'https://www.youtube.com/embed/inWWhr5tnEA',
                  duracion: 15
                }
              ]
            },
            { 
              titulo: 'Amenazas Cibernéticas', 
              descripcion: 'Malware y phishing', 
              duracionEstimada: 50, 
              contenidos: [
                {
                  tipo: 'texto',
                  titulo: 'Tipos de Amenazas Más Comunes',
                  contenido: '<p>Las amenazas cibernéticas evolucionan constantemente. Las más comunes incluyen:</p><ul><li><strong>Malware:</strong> Software malicioso como virus, troyanos y spyware diseñados para dañar sistemas.</li><li><strong>Phishing:</strong> Técnica de suplantación de identidad para robar credenciales.</li><li><strong>Ransomware:</strong> Secuestra datos y exige rescate para liberarlos.</li><li><strong>Ataques DDoS:</strong> Denegación de servicio distribuido que satura servidores.</li></ul>'
                },
                {
                  tipo: 'imagen',
                  titulo: 'Diagrama de Amenazas Cibernéticas',
                  url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800'
                }
              ]
            },
            { 
              titulo: 'Ingeniería Social', 
              descripcion: 'Manipulación psicológica', 
              duracionEstimada: 40, 
              contenidos: [
                {
                  tipo: 'texto',
                  titulo: 'Técnicas de Ingeniería Social',
                  contenido: '<p>La ingeniería social explota la naturaleza humana para obtener información confidencial. Los atacantes manipulan emociones como:</p><ul><li>Urgencia y presión temporal</li><li>Miedo o amenazas</li><li>Confianza y autoridad</li><li>Curiosidad y codicia</li></ul><p>La mejor defensa es la capacitación continua del personal y la verificación de solicitudes inusuales.</p>'
                }
              ]
            },
            { 
              titulo: 'Historia', 
              descripcion: 'Evolución de amenazas', 
              duracionEstimada: 35, 
              contenidos: [
                {
                  tipo: 'texto',
                  titulo: 'Evolución de la Ciberseguridad',
                  contenido: '<p>Desde los primeros virus en los años 70 hasta las amenazas persistentes avanzadas (APT) actuales, la ciberseguridad ha evolucionado dramáticamente.</p><p>Hitos importantes: Morris Worm (1988), ILOVEYOU (2000), Stuxnet (2010), WannaCry (2017).</p>'
                }
              ]
            },
            { 
              titulo: 'Terminología', 
              descripcion: 'Vocabulario técnico', 
              duracionEstimada: 30, 
              contenidos: [
                {
                  tipo: 'documento',
                  titulo: 'Glosario de Términos de Ciberseguridad',
                  url: 'https://www.example.com/glosario-ciberseguridad.pdf'
                }
              ]
            }
          ]
        },
        {
          numero: 2,
          titulo: 'Gestión de Contraseñas',
          descripcion: 'Creación y administración de credenciales',
          temas: [
            { 
              titulo: 'Contraseñas Robustas', 
              descripcion: 'Técnicas de generación', 
              duracionEstimada: 40, 
              contenidos: [
                {
                  tipo: 'texto',
                  titulo: 'Creación de Contraseñas Seguras',
                  contenido: '<p>Una contraseña robusta debe tener:</p><ul><li>Mínimo 12 caracteres</li><li>Combinación de mayúsculas, minúsculas, números y símbolos</li><li>No usar información personal</li><li>Evitar palabras del diccionario</li><li>Ser única para cada cuenta</li></ul>'
                },
                {
                  tipo: 'video',
                  titulo: 'Gestión de Contraseñas',
                  url: 'https://www.youtube.com/embed/NmM9HA2MQGI',
                  duracion: 12
                }
              ]
            },
            { titulo: 'Gestores', descripcion: 'Herramientas de administración', duracionEstimada: 45, contenidos: [] },
            { titulo: 'MFA', descripcion: 'Autenticación multifactor', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Biometría', descripcion: 'Métodos modernos', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Políticas', descripcion: 'Reglas organizacionales', duracionEstimada: 35, contenidos: [] }
          ]
        },
        {
          numero: 3,
          titulo: 'Protección de Datos',
          descripcion: 'Salvaguarda de información empresarial',
          temas: [
            { titulo: 'Clasificación', descripcion: 'Categorización por sensibilidad', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Cifrado', descripcion: 'Técnicas de encriptación', duracionEstimada: 55, contenidos: [] },
            { titulo: 'Backups', descripcion: 'Estrategia 3-2-1', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Control de Acceso', descripcion: 'Gestión de permisos', duracionEstimada: 40, contenidos: [] },
            { titulo: 'DLP', descripcion: 'Prevención de fugas', duracionEstimada: 50, contenidos: [] }
          ]
        },
        {
          numero: 4,
          titulo: 'Seguridad en Redes',
          descripcion: 'Protección de infraestructura',
          temas: [
            { titulo: 'Firewalls', descripcion: 'Barreras de protección', duracionEstimada: 50, contenidos: [] },
            { titulo: 'VPN', descripcion: 'Conexiones seguras', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Segmentación', descripcion: 'Zonas de seguridad', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Monitoreo', descripcion: 'Análisis de tráfico', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Wi-Fi Seguro', descripcion: 'Redes inalámbricas', duracionEstimada: 35, contenidos: [] }
          ]
        },
        {
          numero: 5,
          titulo: 'Respuesta a Incidentes',
          descripcion: 'Procedimientos de emergencia',
          temas: [
            { titulo: 'Detección', descripcion: 'Identificar anomalías', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Plan de Respuesta', descripcion: 'Estrategia estructurada', duracionEstimada: 55, contenidos: [] },
            { titulo: 'Contención', descripcion: 'Aislar amenazas', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Recuperación', descripcion: 'Restaurar operaciones', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Forense Digital', descripcion: 'Investigación técnica', duracionEstimada: 60, contenidos: [] }
          ]
        },
        {
          numero: 6,
          titulo: 'Cumplimiento Normativo',
          descripcion: 'Regulaciones y estándares',
          temas: [
            { titulo: 'Ley 29733', descripcion: 'Protección de datos Perú', duracionEstimada: 50, contenidos: [] },
            { titulo: 'ISO 27001', descripcion: 'Estándar internacional', duracionEstimada: 55, contenidos: [] },
            { titulo: 'PCI DSS', descripcion: 'Seguridad de tarjetas', duracionEstimada: 45, contenidos: [] },
            { titulo: 'GDPR', descripcion: 'Protección datos EU', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Auditorías', descripcion: 'Evaluaciones periódicas', duracionEstimada: 40, contenidos: [] }
          ]
        },
        {
          numero: 7,
          titulo: 'Seguridad del Usuario',
          descripcion: 'Prácticas seguras diarias',
          temas: [
            { titulo: 'Navegación Segura', descripcion: 'Evitar sitios maliciosos', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Email Seguro', descripcion: 'Identificar phishing', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Escritorio Limpio', descripcion: 'Protección física', duracionEstimada: 30, contenidos: [] },
            { titulo: 'USB Seguro', descripcion: 'Prevenir infecciones', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Teletrabajo', descripcion: 'Mejores prácticas', duracionEstimada: 45, contenidos: [] }
          ]
        }
      ],
      tareas: [],
      examenes: []
    },
    {
      titulo: 'Cajero Bancario Profesional',
      descripcion: 'Operaciones de caja y manejo de efectivo',
      instructor: 'Lic. Rosa Villegas',
      nivel: 'Avanzado',
      imagen: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
      categoria: 'Operaciones Bancarias',
      estudiantes: 0,
      duracionTotal: 135,
      unidades: [
        {
          numero: 1,
          titulo: 'Operaciones de Caja',
          descripcion: 'Fundamentos del cajero bancario',
          temas: [
            { 
              titulo: 'Rol del Cajero', 
              descripcion: 'Responsabilidades', 
              duracionEstimada: 40, 
              contenidos: [
                {
                  tipo: 'texto',
                  titulo: 'Funciones del Cajero Bancario',
                  contenido: '<p>El cajero bancario es la primera línea de contacto con el cliente. Sus responsabilidades incluyen:</p><ul><li>Procesamiento de transacciones en efectivo</li><li>Verificación de identidad del cliente</li><li>Custodia de valores</li><li>Atención al cliente profesional</li><li>Cumplimiento de normativas AML/KYC</li></ul>'
                }
              ]
            },
            { 
              titulo: 'Transacciones', 
              descripcion: 'Tipos de operaciones', 
              duracionEstimada: 45, 
              contenidos: [
                {
                  tipo: 'texto',
                  titulo: 'Operaciones Básicas de Caja',
                  contenido: '<p>Las transacciones más comunes incluyen:</p><ul><li><strong>Depósitos:</strong> En efectivo y cheques</li><li><strong>Retiros:</strong> Con y sin tarjeta</li><li><strong>Cambio de moneda:</strong> Conversiones</li><li><strong>Pagos:</strong> Servicios y préstamos</li><li><strong>Transferencias:</strong> Entre cuentas</li></ul>'
                },
                {
                  tipo: 'imagen',
                  titulo: 'Flujo de Operaciones',
                  url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800'
                }
              ]
            },
            { titulo: 'Normativa Bancaria', descripcion: 'AML y KYC', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Ética', descripcion: 'Integridad profesional', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Organización', descripcion: 'Puesto de trabajo', duracionEstimada: 30, contenidos: [] }
          ]
        },
        {
          numero: 2,
          titulo: 'Manejo de Efectivo',
          descripcion: 'Conteo y custodia',
          temas: [
            { titulo: 'Conteo de Billetes', descripcion: 'Técnicas rápidas', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Conteo de Monedas', descripcion: 'Manejo de cambio', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Máquinas Contadoras', descripcion: 'Equipos automatizados', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Organización', descripcion: 'Distribución eficiente', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Límites', descripcion: 'Montos máximos', duracionEstimada: 40, contenidos: [] }
          ]
        },
        {
          numero: 3,
          titulo: 'Billetes Falsos',
          descripcion: 'Detección de fraude',
          temas: [
            { titulo: 'Características', descripcion: 'Marcas de seguridad', duracionEstimada: 55, contenidos: [] },
            { titulo: 'Verificación Manual', descripcion: 'Tacto y luz UV', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Detectores Automáticos', descripcion: 'Máquinas verificadoras', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Protocolo', descripcion: 'Retención y reporte', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Normativa Legal', descripcion: 'Leyes de circulación', duracionEstimada: 35, contenidos: [] }
          ]
        },
        {
          numero: 4,
          titulo: 'Arqueo de Caja',
          descripcion: 'Cierre y conciliación',
          temas: [
            { titulo: 'Preparación', descripcion: 'Organización previa', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Conteo', descripcion: 'Proceso detallado', duracionEstimada: 60, contenidos: [] },
            { titulo: 'Conciliación', descripcion: 'Cuadre contable', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Diferencias', descripcion: 'Faltantes y sobrantes', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Documentación', descripcion: 'Formularios de cierre', duracionEstimada: 40, contenidos: [] }
          ]
        },
        {
          numero: 5,
          titulo: 'Seguridad en Caja',
          descripcion: 'Protección personal',
          temas: [
            { titulo: 'Seguridad Física', descripcion: 'Mamparas y cámaras', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Protocolo Asaltos', descripcion: 'Emergencias', duracionEstimada: 55, contenidos: [] },
            { titulo: 'Fraudes Internos', descripcion: 'Controles', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Custodia', descripcion: 'Grandes sumas', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Bóvedas', descripcion: 'Almacenamiento', duracionEstimada: 35, contenidos: [] }
          ]
        },
        {
          numero: 6,
          titulo: 'Sistemas Bancarios',
          descripcion: 'Plataformas digitales',
          temas: [
            { titulo: 'Sistema Core', descripcion: 'Navegación', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Registro', descripcion: 'Captura de operaciones', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Reportes', descripcion: 'Extracción de información', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Problemas Técnicos', descripcion: 'Soluciones', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Seguridad IT', descripcion: 'Protección de credenciales', duracionEstimada: 35, contenidos: [] }
          ]
        },
        {
          numero: 7,
          titulo: 'Servicio al Cliente',
          descripcion: 'Atención en ventanilla',
          temas: [
            { titulo: 'Atención Rápida', descripcion: 'Optimización de tiempos', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Comunicación', descripcion: 'Claridad y empatía', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Clientes Difíciles', descripcion: 'Desescalamiento', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Venta Cruzada', descripcion: 'Productos bancarios', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Quejas', descripcion: 'Resolución en primera línea', duracionEstimada: 45, contenidos: [] }
          ]
        }
      ],
      tareas: [],
      examenes: []
    },
    {
      titulo: 'Atención al Cliente de Excelencia',
      descripcion: 'Servicio al cliente y comunicación efectiva',
      instructor: 'Lic. Jorge Mendoza',
      nivel: 'Principiante',
      imagen: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
      categoria: 'Atención al Cliente',
      estudiantes: 0,
      duracionTotal: 115,
      unidades: [
        {
          numero: 1,
          titulo: 'Fundamentos del Servicio',
          descripcion: 'Principios básicos',
          temas: [
            { titulo: 'Qué es el Servicio', descripcion: 'Concepto e importancia', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Cliente al Centro', descripcion: 'Cultura organizacional', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Tipos de Clientes', descripcion: 'Perfiles y características', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Expectativas', descripcion: 'Comprender necesidades', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Ciclo de Vida', descripcion: 'Etapas de relación', duracionEstimada: 35, contenidos: [] }
          ]
        },
        {
          numero: 2,
          titulo: 'Comunicación Efectiva',
          descripcion: 'Verbal y no verbal',
          temas: [
            { titulo: 'Comunicación Verbal', descripcion: 'Lenguaje claro', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Lenguaje Corporal', descripcion: 'Gestos y postura', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Tono de Voz', descripcion: 'Calidez profesional', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Escucha Activa', descripcion: 'Técnicas de comprensión', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Empatía', descripcion: 'Balance y firmeza', duracionEstimada: 45, contenidos: [] }
          ]
        },
        {
          numero: 3,
          titulo: 'Manejo de Quejas',
          descripcion: 'Gestión de reclamos',
          temas: [
            { titulo: 'Tipos de Quejas', descripcion: 'Clasificación', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Resolución', descripcion: 'Estrategias', duracionEstimada: 55, contenidos: [] },
            { titulo: 'Oportunidades', descripcion: 'Transformar insatisfacción', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Documentación', descripcion: 'Registro y seguimiento', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Escalamiento', descripcion: 'Derivar a supervisor', duracionEstimada: 40, contenidos: [] }
          ]
        },
        {
          numero: 4,
          titulo: 'Atención Telefónica',
          descripcion: 'Servicio por teléfono',
          temas: [
            { titulo: 'Protocolo', descripcion: 'Saludo y cierre', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Claridad', descripcion: 'Hablar claro', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Llamadas Difíciles', descripcion: 'Clientes molestos', duracionEstimada: 50, contenidos: [] },
            { titulo: 'Transferencias', descripcion: 'Derivar correctamente', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Seguimiento', descripcion: 'Post-llamada', duracionEstimada: 30, contenidos: [] }
          ]
        },
        {
          numero: 5,
          titulo: 'Atención Digital',
          descripcion: 'Canales digitales',
          temas: [
            { titulo: 'Email', descripcion: 'Redacción profesional', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Chat y WhatsApp', descripcion: 'Mensajería instantánea', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Redes Sociales', descripcion: 'Respuestas públicas', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Reseñas Online', descripcion: 'Comentarios', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Etiqueta Digital', descripcion: 'Normas de cortesía', duracionEstimada: 30, contenidos: [] }
          ]
        },
        {
          numero: 6,
          titulo: 'Venta y Upselling',
          descripcion: 'Valor adicional',
          temas: [
            { titulo: 'Necesidades', descripcion: 'Descubrir requerimientos', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Presentación', descripcion: 'Destacar beneficios', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Cross-Selling', descripcion: 'Productos complementarios', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Objeciones', descripcion: 'Responder dudas', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Cierre', descripcion: 'Concretar venta', duracionEstimada: 35, contenidos: [] }
          ]
        },
        {
          numero: 7,
          titulo: 'Mejora Continua',
          descripcion: 'Excelencia en servicio',
          temas: [
            { titulo: 'Estándares', descripcion: 'Niveles de calidad', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Indicadores', descripcion: 'NPS y CSAT', duracionEstimada: 45, contenidos: [] },
            { titulo: 'Feedback', descripcion: 'Opiniones del cliente', duracionEstimada: 40, contenidos: [] },
            { titulo: 'Capacitación', descripcion: 'Actualización constante', duracionEstimada: 35, contenidos: [] },
            { titulo: 'Innovación', descripcion: 'Nuevas tecnologías', duracionEstimada: 45, contenidos: [] }
          ]
        }
      ],
      tareas: [],
      examenes: []
    }
  ];

  try {
    // Procesar todos los cursos para asegurar que todos los temas tengan contenido
    for (const curso of cursos) {
      for (const unidad of curso.unidades) {
        for (const tema of unidad.temas) {
          if (!tema.contenidos || tema.contenidos.length === 0) {
            tema.contenidos = generarContenidoPorDefecto(tema.titulo, tema.descripcion);
          }
        }
      }
    }

    for (let i = 0; i < cursos.length; i++) {
      const curso = cursos[i];
      console.log(`📚 Creando curso ${i + 1}/3: ${curso.titulo}`);
      
      const response = await fetch(`${API_URL}/cursos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(curso)
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const created = await response.json();
      const totalTemas = curso.unidades.reduce((sum, u) => sum + u.temas.length, 0);
      console.log(`✅ Curso creado con ${curso.unidades.length} unidades y ${totalTemas} temas (todos con contenidos)\n`);
    }

    console.log('\n🎉 ¡BASE DE DATOS POBLADA EXITOSAMENTE!');
    console.log('📊 Total: 3 cursos, 21 unidades, 105 temas - TODOS CON CONTENIDOS\n');
  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  }
}

poblarBD();
