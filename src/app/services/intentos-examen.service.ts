import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface IniciarIntentoDto {
  respuestas?: any[];
}

export interface EntregarIntentoDto {
  respuestas: any[];
  tiempoEmpleado?: number;
  salidasPantalla?: number;
}

export interface CalificarIntentoDto {
  calificacion: number;
  retroalimentacion?: string;
}

export interface IntentoExamen {
  id: string;
  examenAlumno: any;
  numeroIntento: number;
  fechaInicio: string;
  fechaEntrega?: string;
  estado: 'en-progreso' | 'entregado' | 'calificado' | 'abandonado';
  respuestas: any[];
  calificacion?: number;
  retroalimentacion?: string;
  tiempoEmpleado?: number;
  createdAt: string;
  updatedAt: string;
  archivoAdjunto?: string;
  comentarioAlumno?: string;
  proctoringSession?: {
    id?: string;
    salidasPantalla?: number;
    [key: string]: unknown;
  };
  salidasPantalla?: number;
}

export interface EntregaDocenteFiltro {
  cursoId?: string;
  examenId?: string;
  estado?: 'pendiente' | 'en-revision' | 'corregido' | 'todos';
  busqueda?: string;
}

export interface EntregaDocenteResumen {
  examenAlumnoId: string;
  intentoId?: string;
  alumnoId?: string;
  alumnoNombre?: string;
  alumnoEmail?: string;
  cursoId?: string;
  cursoNombre?: string;
  examenId?: string;
  examenTitulo?: string;
  estado?: 'pendiente' | 'en-revision' | 'corregido';
  fechaEntrega?: string;
  numeroIntento?: number;
  tiempoEmpleado?: number;
  calificacion?: number;
  puntajeTotal?: number;
  porcentaje?: number;
  retroalimentacionGeneral?: string;
  corregidoPor?: string;
  fechaCorreccion?: string;
  respuestas?: any[];
  [key: string]: unknown;
}

export interface EntregasDocenteResponse {
  entregas?: EntregaDocenteResumen[];
  data?: EntregaDocenteResumen[];
  items?: EntregaDocenteResumen[];
  results?: EntregaDocenteResumen[];
  lista?: EntregaDocenteResumen[];
  records?: EntregaDocenteResumen[];
  estadisticas?: Record<string, unknown>;
  resumen?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  filtros?: Record<string, unknown>;
  opciones?: Record<string, unknown>;
  cursos?: Array<Record<string, unknown>>;
  examenes?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class IntentosExamenService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly entregasDocentePaths = [
    '/examenes/docentes/examenes-alumnos',
    '/examenes/docentes/entregas',
    '/docentes/examenes/entregas',
    '/docentes/entregas',
    '/examenes/docente/entregas'
  ];
  private readonly heartbeatEndpoints: Array<{ prefix: string; method: 'POST' | 'PATCH' }> = [
    { prefix: '/examenes/intentos', method: 'POST' },
    { prefix: '/api/examenes/intentos', method: 'POST' },
    { prefix: '/examenes/intentos', method: 'PATCH' },
    { prefix: '/api/examenes/intentos', method: 'PATCH' }
  ];
  private readonly listarIntentosEndpoints: Array<
    | { type: 'path' | 'detalle'; template: string }
    | { type: 'query'; path: string; param: string }
  > = [
    // Priorizar endpoints con query params para evitar confusión de parámetros
    { type: 'query', path: '/examenes/intentos', param: 'examenAlumnoId' },
    { type: 'query', path: '/api/examenes/intentos', param: 'examenAlumnoId' },
    { type: 'query', path: '/intentos', param: 'examenAlumnoId' },
    { type: 'query', path: '/api/intentos', param: 'examenAlumnoId' },
    // Luego rutas con path params
    { type: 'path', template: '/examenes/examenes-alumno/{id}/intentos' },
    { type: 'path', template: '/api/examenes/examenes-alumno/{id}/intentos' },
    { type: 'path', template: '/examenes/alumnos/{id}/intentos' },
    { type: 'path', template: '/api/examenes/alumnos/{id}/intentos' },
    { type: 'path', template: '/examenes/examenes-alumno/{id}/historial' },
    { type: 'path', template: '/api/examenes/examenes-alumno/{id}/historial' },
    // Finalmente endpoints de detalle que podrían contener intentos
    { type: 'detalle', template: '/examenes/examenes-alumno/{id}' },
    { type: 'detalle', template: '/api/examenes/examenes-alumno/{id}' }
  ];

  /**
   * Iniciar un nuevo intento de examen
   * POST /examenes/examenes-alumno/:examenAlumnoId/intentos
   */
  iniciarIntento(examenAlumnoId: string, data?: IniciarIntentoDto): Observable<IntentoExamen> {
    const url = `${this.apiUrl}/examenes/examenes-alumno/${examenAlumnoId}/intentos`;
    return this.http.post<IntentoExamen>(url, data || {}).pipe(
      catchError(error => this.handleError(error, 'iniciar intento'))
    );
  }

  /**
   * Entregar un intento de examen
   * POST /examenes/intentos/:intentoId/entregar
   */
  entregarIntento(intentoId: string, data: EntregarIntentoDto): Observable<IntentoExamen> {
    const url = `${this.apiUrl}/examenes/intentos/${intentoId}/entregar`;
    return this.http.post<IntentoExamen>(url, data).pipe(
      catchError(error => this.handleError(error, 'entregar intento'))
    );
  }

  /**
   * Listar todos los intentos de un examen alumno
   * GET /examenes/examenes-alumno/:examenAlumnoId/intentos
   * Fuerza la recarga desde BD sin cache
   */
  listarIntentos(examenAlumnoId: string): Observable<IntentoExamen[]> {
    console.log('🔄 [listarIntentos] Solicitando intentos para examenAlumnoId:', examenAlumnoId);
    return this.buscarIntentos(examenAlumnoId).pipe(
      tap(respuestaCruda => {
        console.log('[IntentosExamenService] listarIntentos response:', respuestaCruda);
      }),
      map(response => {
        const intentos = this.extraerIntentos(response);
        if (intentos.length === 0 && Array.isArray(response)) {
          return this.extraerIntentos({ intentos: response });
        }
        return intentos;
      }),
      catchError(error => this.handleError(error, 'listar intentos'))
    );
  }

  /**
   * Listar entregas para corrección (vista docente)
  * Prueba rutas docentes conocidas (/examenes/docentes/examenes-alumnos, /examenes/docentes/entregas, ...)
   */
  listarIntentosCorreccion(filtros?: EntregaDocenteFiltro): Observable<EntregasDocenteResponse> {
    let params = new HttpParams();

    if (filtros) {
      Object.entries(filtros).forEach(([clave, valor]) => {
        if (valor !== undefined && valor !== null && `${valor}`.trim() !== '') {
          params = params.set(clave, `${valor}`.trim());
        }
      });
    }

    return this.solicitarEntregasDocente(params);
  }

  /**
   * Calificar un examen completo (ExamenAlumno)
   * PATCH /examenes/examenes-alumno/:examenAlumnoId/calificar
   */
  calificarExamenAlumno(examenAlumnoId: string, data: { calificacion: number; retroalimentacion?: string }): Observable<any> {
    const url = `${this.apiUrl}/examenes/examenes-alumno/${examenAlumnoId}/calificar`;
    console.log('📝 [calificarExamenAlumno] URL:', url);
    console.log('📝 Payload:', data);
    return this.http.patch(url, data).pipe(
      tap(response => console.log('✅ [calificarExamenAlumno] Respuesta:', response)),
      catchError(error => {
        console.error('❌ [calificarExamenAlumno] Error:', error);
        return this.handleError(error, 'calificar examen alumno');
      })
    );
  }

  /**
   * Calificar un intento específico (IntentoExamen)
   * PATCH /examenes/intentos/:intentoId/calificar
   */
  calificarIntento(intentoId: string, data: { calificacion: number; retroalimentacion?: string }): Observable<any> {
    const url = `${this.apiUrl}/examenes/intentos/${intentoId}/calificar`;
    console.log('📝 [calificarIntento] URL:', url);
    console.log('📝 Payload:', data);
    return this.http.patch(url, data).pipe(
      tap(response => console.log('✅ [calificarIntento] Respuesta:', response)),
      catchError(error => {
        console.error('❌ [calificarIntento] Error:', error);
        return this.handleError(error, 'calificar intento');
      })
    );
  }

  /**
   * Actualiza la corrección de una entrega docente
  * Prueba rutas docentes conocidas (/examenes/docentes/examenes-alumnos/:id?, /examenes/docentes/entregas/:id, ...)
   */
  actualizarEntregaDocente(examenAlumnoId: string, data: Record<string, unknown>): Observable<any> {
    return this.enviarCorreccionDocente(examenAlumnoId, data);
  }

  /**
   * Obtener detalle de un intento específico
   * GET /examenes/intentos/:intentoId
   */
  obtenerIntento(intentoId: string): Observable<IntentoExamen> {
    const url = `${this.apiUrl}/examenes/intentos/${intentoId}`;
    return this.http.get<IntentoExamen>(url).pipe(
      catchError(error => this.handleError(error, 'obtener intento'))
    );
  }

  /**
   * Abandonar un intento en progreso
   * PATCH /examenes/intentos/:intentoId/abandonar
   */
  abandonarIntento(intentoId: string, data?: { salidasPantalla?: number }): Observable<IntentoExamen> {
    const url = `${this.apiUrl}/examenes/intentos/${intentoId}/abandonar`;
    const payload = data && Object.keys(data).length > 0 ? data : {};
    return this.http.patch<IntentoExamen>(url, payload).pipe(
      catchError(error => this.handleError(error, 'abandonar intento'))
    );
  }

  enviarHeartbeat(intentoId: string, data?: { salidasPantalla?: number; [key: string]: unknown }): Observable<void> {
    const payload: Record<string, unknown> = { timestamp: new Date().toISOString() };
    if (data) {
      Object.entries(data).forEach(([clave, valor]) => {
        if (valor !== undefined && valor !== null) {
          payload[clave] = valor;
        }
      });
    }
    return this.enviarHeartbeatConFallback(intentoId, payload);
  }

  private extraerIntentos(respuesta: any): IntentoExamen[] {
    console.log('🔍 [extraerIntentos] Iniciando extracción. Tipo de respuesta:', typeof respuesta);
    console.log('🔍 [extraerIntentos] Es array?:', Array.isArray(respuesta));
    console.log('🔍 [extraerIntentos] Claves del objeto:', respuesta && typeof respuesta === 'object' ? Object.keys(respuesta) : 'N/A');
    console.log('🔍 [extraerIntentos] Respuesta completa:', JSON.stringify(respuesta, null, 2));
    
    const visitados = new Set<any>();

    const normalizarElemento = (elemento: any): IntentoExamen | null => {
      if (!elemento || typeof elemento !== 'object') {
        return null;
      }

      const intentoBase = elemento.intento || elemento.examenIntento || elemento.detalle || elemento.data || elemento;
      if (!intentoBase || typeof intentoBase !== 'object') {
        return null;
      }

      const merge = { ...intentoBase } as IntentoExamen & Record<string, unknown>;

      const leer = (campo: string): any => (
        (intentoBase as Record<string, unknown>)[campo] ??
        (elemento as Record<string, unknown>)[campo]
      );

      merge.respuestas = (leer('respuestas') as any[]) || [];
      merge.calificacion = leer('calificacion') ?? leer('puntaje') ?? leer('nota') ?? merge.calificacion;
      merge.retroalimentacion = leer('retroalimentacion') ?? leer('retroalimentacionGeneral') ?? leer('feedback') ?? merge.retroalimentacion;
      merge.tiempoEmpleado = leer('tiempoEmpleado') ?? leer('tiempo') ?? leer('duracion') ?? merge.tiempoEmpleado;
      merge.estado = leer('estado') ?? leer('status') ?? leer('estadoIntento') ?? merge.estado;
      merge.fechaInicio = leer('fechaInicio') ?? leer('inicio') ?? merge.fechaInicio;
      merge.fechaEntrega = leer('fechaEntrega') ?? leer('fin') ?? merge.fechaEntrega;
      merge.archivoAdjunto = leer('archivoAdjunto') ?? merge.archivoAdjunto;
      merge.proctoringSession = leer('proctoringSession') ?? merge.proctoringSession;
      (merge as any).salidasPantalla = (merge as any).salidasPantalla ?? leer('salidasPantalla') ?? leer('salidasFullscreen');

      merge.examenAlumno = leer('examenAlumno') ?? leer('asignacion') ?? merge.examenAlumno;
      if (!merge.examenAlumno && leer('examen')) {
        merge.examenAlumno = { examen: leer('examen') };
      }

      if (!merge.id) {
        merge.id = leer('id') ?? leer('intentoId');
      }

      if (!merge.numeroIntento) {
        merge.numeroIntento = leer('numeroIntento') ?? leer('intentoNumero');
      }

      return merge as IntentoExamen;
    };

    const mapearIntentos = (lista: any[]): IntentoExamen[] => {
      if (!Array.isArray(lista)) {
        return [];
      }

      return lista
        .map(elemento => normalizarElemento(elemento))
        .filter((item): item is IntentoExamen => Boolean(item));
    };

    const explorar = (valor: any): IntentoExamen[] => {
      if (!valor || visitados.has(valor)) {
        return [];
      }

      visitados.add(valor);

      if (Array.isArray(valor)) {
        return mapearIntentos(valor);
      }

      if (typeof valor !== 'object') {
        return [];
      }

      const posiblesListas = [
        valor.intentos,
        valor.intentosExamen,
        valor.intentosAlumno,
        valor.listaIntentos,
        valor.items,
        valor.data,
        valor.results,
        valor.lista,
        valor.records,
        valor.content,
        valor.elements,
        valor.registros,
        valor.detalle,
        valor.detalles
      ];

      for (const lista of posiblesListas) {
        if (Array.isArray(lista)) {
          const intentos = mapearIntentos(lista);
          if (intentos.length) {
            return intentos;
          }
        }
      }

      for (const lista of posiblesListas) {
        if (lista && typeof lista === 'object') {
          const extraidos = explorar(lista);
          if (extraidos.length) {
            return extraidos;
          }
        }
      }

      const claves = Object.keys(valor);
      for (const clave of claves) {
        const siguiente = (valor as Record<string, unknown>)[clave];
        if (Array.isArray(siguiente)) {
          const intentos = mapearIntentos(siguiente);
          if (intentos.length) {
            return intentos;
          }
        }
      }

      for (const clave of claves) {
        const siguiente = (valor as Record<string, unknown>)[clave];
        if (siguiente && typeof siguiente === 'object') {
          const extraidos = explorar(siguiente);
          if (extraidos.length) {
            return extraidos;
          }
        }
      }

      if ((valor as IntentoExamen)?.id && (valor as IntentoExamen)?.estado) {
        return [valor as IntentoExamen];
      }

      return [];
    };

    const intentos = explorar(respuesta);
    console.log(`🎯 [extraerIntentos] Total de intentos extraídos: ${intentos.length}`);
    if (intentos.length > 0) {
      console.log('✅ [extraerIntentos] Primer intento encontrado:', intentos[0]);
    } else {
      console.warn('⚠️ [extraerIntentos] NO se encontraron intentos en la respuesta');
    }
    return Array.isArray(intentos) ? intentos : [];
  }

  private buscarIntentos(examenAlumnoId: string, indice = 0, ultimoError?: any): Observable<any> {
    if (indice >= this.listarIntentosEndpoints.length) {
      return throwError(() => ultimoError ?? new Error('No se encontraron endpoints disponibles para listar intentos.'));
    }

    const candidato = this.listarIntentosEndpoints[indice];
    const solicitud = this.construirSolicitudIntentos(candidato, examenAlumnoId);

    console.log(`🌐 [buscarIntentos] Intentando endpoint [${indice + 1}/${this.listarIntentosEndpoints.length}]: ${solicitud.descripcion}`);
    
    return this.http.get<any>(solicitud.url, solicitud.options).pipe(
      tap(respuesta => {
        console.log(`✅ [buscarIntentos] Respuesta de ${solicitud.descripcion}:`, respuesta);
        console.log(`📊 [buscarIntentos] Tipo de respuesta:`, typeof respuesta, 'Es array:', Array.isArray(respuesta));
      }),
      switchMap(respuesta => {
        const intentosDetectados = this.extraerIntentos(respuesta);
        const intentosFallback = intentosDetectados.length === 0 && Array.isArray(respuesta)
          ? this.extraerIntentos({ intentos: respuesta })
          : intentosDetectados;

        const hayIntentos = intentosFallback.length > 0;
        if (!hayIntentos && indice < this.listarIntentosEndpoints.length - 1) {
          console.warn(`[IntentosExamenService] Endpoint ${solicitud.descripcion} no devolvió intentos. Probando alternativa...`);
          return this.buscarIntentos(examenAlumnoId, indice + 1, ultimoError);
        }
        return of(respuesta);
      }),
      catchError(error => {
        const esReintentable = this.esErrorListarIntentosReintentable(error);
        const mensaje = error?.error?.message || error?.message;
        
        if (esReintentable && indice < this.listarIntentosEndpoints.length - 1) {
          console.warn(`[IntentosExamenService] Endpoint ${solicitud.descripcion} no disponible (${error.status ?? 'sin status'}). Error: ${mensaje}. Probando ruta alternativa...`);
          return this.buscarIntentos(examenAlumnoId, indice + 1, error);
        }
        return throwError(() => error);
      })
    );
  }

  private construirSolicitudIntentos(
    candidato: (typeof this.listarIntentosEndpoints)[number],
    examenAlumnoId: string
  ): { url: string; options?: { params?: HttpParams }; descripcion: string } {
    const idCodificado = encodeURIComponent(examenAlumnoId);
    const timestamp = new Date().getTime(); // Agregar timestamp para evitar cache

    if (candidato.type === 'query') {
      return {
        url: `${this.apiUrl}${candidato.path}`,
        options: { 
          params: new HttpParams()
            .set(candidato.param, examenAlumnoId)
            .set('_t', timestamp.toString()) // Anti-cache
        },
        descripcion: `${candidato.path}?${candidato.param}=${examenAlumnoId}`
      };
    }

    const ruta = candidato.template.replace('{id}', idCodificado);
    return {
      url: `${this.apiUrl}${ruta}?_t=${timestamp}`, // Anti-cache en URL
      descripcion: ruta
    };
  }

  private esErrorListarIntentosReintentable(error: any): boolean {
    const status = error?.status ?? error?.response?.status;
    const mensaje = error?.error?.message || error?.message || '';
    
    // Reintentar si es 400 con mensaje de UUID inválido (endpoint equivocado)
    if (status === 400 && typeof mensaje === 'string' && /uuid|examenId/i.test(mensaje)) {
      return true;
    }
    
    return status === 0 || status === 404 || status === 405;
  }

  private enviarHeartbeatConFallback(intentoId: string, payload: Record<string, unknown>, indice = 0, ultimoError?: any): Observable<void> {
    if (indice >= this.heartbeatEndpoints.length) {
      return this.handleError(
        ultimoError ?? {
          status: 404,
          message: 'No se encontró un endpoint válido para registrar el heartbeat del examen.',
          url: `${this.apiUrl}${this.heartbeatEndpoints[this.heartbeatEndpoints.length - 1]?.prefix ?? ''}/${encodeURIComponent(intentoId)}/heartbeat`
        },
        'enviar heartbeat'
      );
    }

    const { prefix, method } = this.heartbeatEndpoints[indice];
    const url = `${this.apiUrl}${prefix}/${encodeURIComponent(intentoId)}/heartbeat`;

    return this.http.request<void>(method, url, { body: payload }).pipe(
      catchError(error => {
        const puedeReintentar =
          indice < this.heartbeatEndpoints.length - 1 && this.esErrorHeartbeatReintentable(error);
        if (puedeReintentar) {
          console.warn(`[IntentosExamenService] Heartbeat ${method} ${url} no disponible (${error.status}). Probando alternativa...`);
          return this.enviarHeartbeatConFallback(intentoId, payload, indice + 1, error);
        }
        return this.handleError(error, 'enviar heartbeat');
      })
    );
  }

  private esErrorHeartbeatReintentable(error: any): boolean {
    const status = error?.status ?? error?.response?.status;
    if (status === 404 || status === 405) {
      return true;
    }

    const mensaje =
      (error as any)?.friendlyMessage ||
      error?.error?.friendlyMessage ||
      error?.message ||
      '';

    return /404|405|no encontrado|not found|cannot (post|patch)/i.test(mensaje);
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: any, action: string): Observable<never> {
    const status = error?.status ?? error?.response?.status;
    const friendlyMessage = (error as any)?.friendlyMessage ?? error?.error?.friendlyMessage;
    let errorMessage = friendlyMessage ?? `Error al ${action}`;
    
    // Mensaje específico para 404
    if (status === 404) {
      errorMessage = '⚠️ Asignación de examen no encontrada. El examen no está asignado al alumno en la base de datos. Contacta al profesor.';
    } else if (error.error?.message) {
      errorMessage = Array.isArray(error.error.message)
        ? error.error.message.join(', ')
        : error.error.message;
    } else if (Array.isArray(error.error)) {
      errorMessage = error.error.join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error(`❌ ${action}:`, error);
    console.error('📊 Estado HTTP:', status);
    console.error('📋 URL solicitada:', error?.url ?? error?.error?.url);
    return throwError(() => new Error(errorMessage));
  }

  private solicitarEntregasDocente(params: HttpParams, indice = 0, ultimoError?: any): Observable<EntregasDocenteResponse> {
    if (indice >= this.entregasDocentePaths.length) {
      console.error('🔴 [IntentosExamenService] NO SE ENCONTRÓ NINGÚN ENDPOINT VÁLIDO');
      console.error('🔴 Endpoints probados:', this.entregasDocentePaths);
      console.error('🔴 Último error:', ultimoError);
      return this.handleError(
        ultimoError ?? {
          status: 404,
          message: 'No se encontraron endpoints disponibles para listar entregas de exámenes.',
          url: `${this.apiUrl}${this.entregasDocentePaths[this.entregasDocentePaths.length - 1]}`
        },
        'listar entregas para corrección'
      );
    }

    const url = `${this.apiUrl}${this.entregasDocentePaths[indice]}`;
    console.log(`🔍 [IntentosExamenService] Intentando endpoint ${indice + 1}/${this.entregasDocentePaths.length}:`, url);
    console.log(`🔍 Query params:`, params.toString());

    return this.http.get<EntregasDocenteResponse>(url, { params }).pipe(
      tap((response) => {
        console.log(`✅ [IntentosExamenService] Respuesta exitosa de:`, url);
        console.log(`✅ Estructura de respuesta:`, {
          keys: Object.keys(response || {}),
          isArray: Array.isArray(response),
          dataType: typeof response
        });
        console.log(`✅ Respuesta completa:`, response);
      }),
      map((response) => response ?? {}),
      catchError(error => {
        console.error(`❌ [IntentosExamenService] Error en ${url}:`, {
          status: error.status,
          statusText: error.statusText,
          message: error.message
        });
        if (error.status === 404 && indice < this.entregasDocentePaths.length - 1) {
          console.warn(`⚠️ [IntentosExamenService] Endpoint ${url} no encontrado (404). Probando ruta alternativa...`);
          return this.solicitarEntregasDocente(params, indice + 1, error);
        }
        return this.handleError(error, 'listar entregas para corrección');
      })
    );
  }

  private enviarCorreccionDocente(examenAlumnoId: string, data: Record<string, unknown>, indice = 0, ultimoError?: any): Observable<any> {
    if (indice >= this.entregasDocentePaths.length) {
      return this.handleError(
        ultimoError ?? {
          status: 404,
          message: 'No se encontraron endpoints disponibles para actualizar la corrección del examen.',
          url: `${this.apiUrl}${this.entregasDocentePaths[this.entregasDocentePaths.length - 1]}/${encodeURIComponent(examenAlumnoId)}`
        },
        'actualizar entrega docente'
      );
    }

    const basePath = this.entregasDocentePaths[indice];
    if (basePath.includes('examenes-alumnos')) {
      return this.enviarCorreccionDocente(examenAlumnoId, data, indice + 1, ultimoError);
    }

    const url = `${this.apiUrl}${basePath}/${encodeURIComponent(examenAlumnoId)}`;

    return this.http.patch<any>(url, data).pipe(
      catchError(error => {
        if (error.status === 404 && indice < this.entregasDocentePaths.length - 1) {
          console.warn(`[IntentosExamenService] Endpoint ${url} no encontrado (404). Probando ruta alternativa...`);
          return this.enviarCorreccionDocente(examenAlumnoId, data, indice + 1, error);
        }
        return this.handleError(error, 'actualizar entrega docente');
      })
    );
  }
}
