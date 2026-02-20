import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IntentosExamenService, IntentoExamen } from '../../services/intentos-examen.service';
import { ExamenesService } from '../../services/examenes.service';
import Swal from 'sweetalert2';

type RespuestaIntentoDetallada = {
  preguntaId: string;
  preguntaTexto: string;
  tipo?: string | null;
  respuesta: string;
  respuestaCorrecta?: string | null;
  puntosObtenidos?: number | null;
  puntosPregunta?: number | null;
  esCorrecta?: boolean;
  comentarios?: string | null;
};

type PreguntaNormalizada = {
  id: string;
  texto: string;
  tipo?: string | null;
  puntos?: number | null;
  respuestaCorrecta?: string | null;
  opciones?: any[] | null;
};

type IntentoConDetalle = IntentoExamen & {
  respuestas: RespuestaIntentoDetallada[];
  examen?: {
    id?: string;
    titulo?: string;
    descripcion?: string;
    puntosTotales?: number;
    intentosPermitidos?: number;
    preguntas?: PreguntaNormalizada[];
  } | null;
};

@Component({
  selector: 'app-historial-intentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-intentos.component.html',
  styleUrls: ['./historial-intentos.component.css']
})
export class HistorialIntentosComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly intentosService = inject(IntentosExamenService);
  private readonly examenesService = inject(ExamenesService);
  private readonly cdr = inject(ChangeDetectorRef);

  examenAlumnoId: string = '';
  intentos: IntentoConDetalle[] = [];
  intentoSeleccionado: IntentoConDetalle | null = null;
  examen: any = null;
  preguntasConRespuestas: any[] = []; // Preguntas del examen con respuestas correctas
  intentosRealizadosTotal: number = 0; // Total de intentos realizados desde el backend
  
  cargando = true;
  mostrarModal = false;

  ngOnInit() {
    this.examenAlumnoId = this.route.snapshot.paramMap.get('examenAlumnoId') || '';
    if (!this.examenAlumnoId) {
      this.router.navigate(['/examenes']);
      return;
    }

    this.cargarIntentos();
  }

  cargarIntentos() {
    console.log('📥 [HistorialIntentos] Cargando intentos para examenAlumnoId:', this.examenAlumnoId);
    this.intentos = []; // Limpiar intentos previos
    this.examen = null; // Limpiar examen previo
    this.preguntasConRespuestas = []; // Limpiar preguntas previas
    this.intentosRealizadosTotal = 0; // Limpiar contador
    this.cargando = true;
    
    // Primero cargar el examenAlumno para obtener intentosRealizados y el examenId
    this.examenesService.getExamenAlumno(this.examenAlumnoId).subscribe({
      next: (examenAlumno) => {
        console.log('📋 [HistorialIntentos] ExamenAlumno obtenido:', examenAlumno);
        
        // Extraer intentosRealizados del objeto examenAlumno
        if (examenAlumno) {
          this.intentosRealizadosTotal = 
            examenAlumno.intentosRealizados ||
            examenAlumno.totalIntentos ||
            examenAlumno.cantidadIntentos ||
            0;
          console.log('📊 [HistorialIntentos] intentosRealizados del backend:', this.intentosRealizadosTotal);
          
          // Guardar el examen completo con sus preguntas
          const examenOrigen = examenAlumno.examen || examenAlumno;
          const examenNormalizado = this.normalizarExamen(examenOrigen);
          if (examenNormalizado) {
            this.examen = examenNormalizado;
            console.log('✅ [HistorialIntentos] Examen normalizado con preguntas:', {
              titulo: this.examen.titulo,
              totalPreguntas: this.examen.preguntas?.length || 0,
              puntosTotales: this.examen.puntosTotales
            });
          }
          
          // Intentar cargar preguntas con respuestas correctas
          const examenId = examenAlumno.examen?.id || examenAlumno.examenId;
          if (examenId) {
            console.log('📚 [HistorialIntentos] Intentando cargar preguntas con respuestas correctas del examen:', examenId);
            this.examenesService.getPreguntasExamen(examenId).subscribe({
              next: (preguntas) => {
                console.log('✅ [HistorialIntentos] Preguntas obtenidas:', preguntas?.length);
                this.preguntasConRespuestas = preguntas || [];
                if (this.preguntasConRespuestas.length > 0) {
                  const tieneRespCorrecta = 'respuestaCorrecta' in this.preguntasConRespuestas[0];
                  console.log('🔍 [HistorialIntentos] Primera pregunta tiene respuestaCorrecta?', tieneRespCorrecta);
                  if (tieneRespCorrecta) {
                    console.log('✅ [HistorialIntentos] ¡Respuestas correctas disponibles para comparación!');
                  } else {
                    console.warn('⚠️ [HistorialIntentos] El endpoint NO incluye respuestaCorrecta (protección para alumnos)');
                  }
                }
              },
              error: (error) => {
                console.warn('⚠️ [HistorialIntentos] No se pudieron cargar preguntas del examen:', error);
                this.preguntasConRespuestas = [];
              }
            });
          }
        }
        
        // Ahora cargar los intentos
        this.cargarListaIntentos();
      },
      error: (error) => {
        console.warn('⚠️ [HistorialIntentos] Error al cargar examenAlumno, continuando con intentos:', error);
        // Continuar cargando intentos aunque falle el examenAlumno
        this.cargarListaIntentos();
      }
    });
  }
  
  private cargarListaIntentos() {
    this.intentosService.listarIntentos(this.examenAlumnoId).subscribe({
      next: (intentos) => {
        console.log('📦 [HistorialIntentos] Intentos recibidos del servicio:', intentos);
        console.log('📦 [HistorialIntentos] Cantidad de intentos:', intentos?.length || 0);
        
        // Validación estricta: solo procesar si es un array válido del backend
        if (!intentos || !Array.isArray(intentos)) {
          console.warn('⚠️ [HistorialIntentos] Respuesta inválida del backend - no es un array');
          this.intentos = [];
          this.intentosRealizadosTotal = 0;
          this.cargando = false;
          this.cdr.detectChanges();
          return;
        }
        
        // Si el array está vacío, no hay intentos en la BD
        if (intentos.length === 0) {
          console.log('ℹ️ [HistorialIntentos] No hay intentos registrados en la BD para este examen');
          this.intentos = [];
          this.intentosRealizadosTotal = 0;
          this.cargando = false;
          this.cdr.detectChanges();
          return;
        }
        
        const intentosNormalizados = this.normalizarIntentos(intentos);
        console.log('✨ [HistorialIntentos] Intentos normalizados:', intentosNormalizados);
        console.log('✨ [HistorialIntentos] Total normalizados:', intentosNormalizados.length);

        // Forzar que TODOS los intentos usen el examen principal con sus preguntas
        this.intentos = intentosNormalizados.map(intento => {
          console.log(`🔄 [HistorialIntentos] Asignando examen a intento #${intento.numeroIntento}`);
          return {
            ...intento,
            examen: this.examen, // Usar el examen principal con todas sus preguntas
            examenAlumno: {
              ...intento.examenAlumno,
              examen: this.examen // También asignar al examenAlumno
            }
          };
        }).sort((a, b) =>
          new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
        );

        this.establecerExamenDesdeIntentos(this.intentos);

        this.cargando = false;
        this.cdr.detectChanges();
        console.log('📋 Intentos cargados:', this.intentos);
        console.log('📊 Total intentos realizados:', this.intentosRealizadosTotal);
        console.log('📖 Examen con preguntas:', {
          titulo: this.examen?.titulo,
          preguntas: this.examen?.preguntas?.length || 0,
          puntos: this.examen?.puntosTotales
        });
        // Verificar que cada intento tenga las preguntas
        this.intentos.forEach((intento, idx) => {
          console.log(`📖 Intento #${idx + 1} preguntas:`, intento.examen?.preguntas?.length || 0);
        });
      },
      error: (error) => {
        console.error('❌ Error al cargar intentos:', error);
        this.intentos = []; // Limpiar en caso de error
        this.intentosRealizadosTotal = 0; // Limpiar contador
        this.cargando = false;
        this.cdr.detectChanges();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'No se pudieron cargar los intentos'
        });
      }
    });
  }

  verDetalleIntento(intento: IntentoConDetalle) {
    this.intentoSeleccionado = intento;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.intentoSeleccionado = null;
    this.mostrarModal = false;
  }

  nuevoIntento() {
    this.router.navigate(['/examenes/tomar', this.examenAlumnoId]);
  }

  volverAExamenes() {
    this.router.navigate(['/examenes']);
  }

  get puedeIniciarNuevoIntento(): boolean {
    const limite = this.examen?.intentosPermitidos;
    if (limite === undefined || limite === null) {
      return true;
    }
    return this.intentos.length < limite;
  }

  get intentosRestantes(): number | null {
    const limite = this.examen?.intentosPermitidos;
    if (limite === undefined || limite === null) {
      return null;
    }
    return Math.max(limite - this.intentos.length, 0);
  }

  get mejorIntento(): IntentoConDetalle | null {
    const calificados = this.intentos.filter(i => i.calificacion !== undefined && i.calificacion !== null);
    if (calificados.length === 0) return null;
    
    return calificados.reduce((mejor, actual) => 
      (actual.calificacion || 0) > (mejor.calificacion || 0) ? actual : mejor
    );
  }

  get promedioIntentos(): number {
    const calificados = this.intentos.filter(i => i.calificacion !== undefined && i.calificacion !== null);
    if (calificados.length === 0) return 0;
    
    const suma = calificados.reduce((acc, i) => acc + (i.calificacion || 0), 0);
    return Math.round(suma / calificados.length);
  }

  get intentosCompletados(): number {
    // Usar el valor del backend si está disponible
    if (this.intentosRealizadosTotal > 0) {
      return this.intentosRealizadosTotal;
    }
    // Fallback: contar intentos completados manualmente
    return this.intentos.filter(i => i.estado === 'entregado' || i.estado === 'calificado').length;
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'en-progreso': return 'bg-blue-100 text-blue-800';
      case 'entregado': return 'bg-yellow-100 text-yellow-800';
      case 'calificado': return 'bg-green-100 text-green-800';
      case 'abandonado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getTextoEstado(estado: string): string {
    switch (estado) {
      case 'en-progreso': return 'En Progreso';
      case 'entregado': return 'Entregado';
      case 'calificado': return 'Calificado';
      case 'abandonado': return 'Abandonado';
      default: return estado;
    }
  }

  getIconoEstado(estado: string): string {
    switch (estado) {
      case 'en-progreso': return '⏳';
      case 'entregado': return '📤';
      case 'calificado': return '✅';
      case 'abandonado': return '❌';
      default: return '📝';
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearTiempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`;
    } else {
      return `${minutos}m ${segs}s`;
    }
  }

  getColorCalificacion(calificacion: number, puntosTotales: number): string {
    const porcentaje = (calificacion / puntosTotales) * 100;
    if (porcentaje >= 90) return 'text-green-600';
    if (porcentaje >= 70) return 'text-blue-600';
    if (porcentaje >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  /**
   * Obtiene la respuesta correcta de una pregunta si está disponible
   * Retorna el texto de la opción correcta con su letra o null si no está disponible
   */
  getRespuestaCorrectaPregunta(preguntaId: string): string | null {
    const pregunta = this.preguntasConRespuestas.find(p => p.id === preguntaId);
    if (!pregunta || pregunta.respuestaCorrecta === undefined || pregunta.respuestaCorrecta === null) {
      return null;
    }

    // La respuesta correcta es un índice, obtener el texto de la opción
    const opciones = pregunta.opciones || [];
    const indice = pregunta.respuestaCorrecta;
    
    if (indice >= 0 && indice < opciones.length) {
      const letra = ['A', 'B', 'C', 'D', 'E', 'F'][indice];
      return `${letra}. ${opciones[indice]}`;
    }
    
    return null;
  }

  /**
   * Verifica si hay respuestas correctas disponibles para mostrar
   */
  tieneRespuestasCorrectas(): boolean {
    return this.preguntasConRespuestas.length > 0 && 
           this.preguntasConRespuestas.some(p => p.respuestaCorrecta !== undefined);
  }

  getRespuestasAlumnoPorPregunta(preguntaId: string): any[] {
    // Retorna todas las respuestas del alumno para esta pregunta en todos los intentos
    // Compara con la respuesta correcta si está disponible desde preguntasConRespuestas
    const respuestas: any[] = [];
    
    // Buscar la pregunta con su respuesta correcta
    const preguntaCorrecta = this.preguntasConRespuestas.find(p => p.id === preguntaId);
    const respuestaCorrectaIndice = preguntaCorrecta?.respuestaCorrecta;
    
    console.log(`🔍 [getRespuestasAlumnoPorPregunta] Buscando respuestas para pregunta: ${preguntaId}`);
    if (respuestaCorrectaIndice !== undefined) {
      console.log(`✅ [getRespuestasAlumnoPorPregunta] Respuesta correcta encontrada (índice): ${respuestaCorrectaIndice}`);
    } else {
      console.log(`⚠️ [getRespuestasAlumnoPorPregunta] Respuesta correcta NO disponible`);
    }
    
    this.intentos.forEach(intento => {
      const respuesta = intento.respuestas?.find(
        r => r.preguntaId === preguntaId || 
             r.preguntaId.toLowerCase() === preguntaId.toLowerCase() ||
             r.preguntaId.includes(preguntaId) ||
             preguntaId.includes(r.preguntaId)
      );
      
      if (respuesta) {
        let esCorrecta = respuesta.esCorrecta; // Valor del backend si ya está calificado
        
        // Si tenemos respuestaCorrecta y la respuesta del usuario, comparar
        if (respuestaCorrectaIndice !== undefined && respuestaCorrectaIndice !== null) {
          const respuestaUsuario = respuesta.respuesta;
          // La respuesta puede ser índice numérico o letra (A, B, C, D)
          let respuestaUsuarioIndice: number | undefined;
          
          if (typeof respuestaUsuario === 'number') {
            respuestaUsuarioIndice = respuestaUsuario;
          } else if (typeof respuestaUsuario === 'string') {
            // Convertir letra a índice: A=0, B=1, C=2, D=3
            const match = respuestaUsuario.match(/^([A-F])/i);
            if (match) {
              respuestaUsuarioIndice = match[1].toUpperCase().charCodeAt(0) - 65; // A=65 en ASCII
            } else {
              respuestaUsuarioIndice = parseInt(respuestaUsuario);
            }
          }
          
          if (respuestaUsuarioIndice !== undefined && !isNaN(respuestaUsuarioIndice)) {
            esCorrecta = respuestaUsuarioIndice === respuestaCorrectaIndice;
            console.log(`🔍 [getRespuestasAlumnoPorPregunta] Comparación:`, {
              preguntaId,
              usuario: respuestaUsuarioIndice,
              correcta: respuestaCorrectaIndice,
              resultado: esCorrecta ? '✅ Correcta' : '❌ Incorrecta'
            });
          }
        }
        
        respuestas.push({
          numeroIntento: intento.numeroIntento,
          respuesta: respuesta.respuesta,
          esCorrecta: esCorrecta,
          puntosObtenidos: respuesta.puntosObtenidos,
          estado: intento.estado,
          fechaInicio: intento.fechaInicio
        });
      }
    });
    
    console.log(`📊 [getRespuestasAlumnoPorPregunta] Total respuestas encontradas: ${respuestas.length}`);
    return respuestas;
  }

  private normalizarIntentos(intentos: IntentoExamen[]): IntentoConDetalle[] {
    console.log('🔄 [normalizarIntentos] Iniciando normalización. Recibidos:', intentos);
    console.log('🔄 [normalizarIntentos] Es array?:', Array.isArray(intentos));
    console.log('🔄 [normalizarIntentos] Cantidad:', intentos?.length);
    
    if (!Array.isArray(intentos)) {
      console.warn('⚠️ [normalizarIntentos] No es un array, retornando vacío');
      return [];
    }

    if (intentos.length === 0) {
      console.warn('⚠️ [normalizarIntentos] Array vacío recibido del backend');
      return [];
    }

    console.log('🔄 [normalizarIntentos] Procesando', intentos.length, 'intentos...');
    const intentosNormalizados = intentos.map((intento, index) => {
      console.log(`  ➡️ [normalizarIntentos] Procesando intento ${index + 1}:`, intento);
      const datosAdjunto = this.decodificarArchivoAdjunto((intento as any)?.archivoAdjunto);
      const examenAlumno = intento.examenAlumno || datosAdjunto?.examenAlumno || null;
      const examenOrigen = (intento as any)?.examen || examenAlumno?.examen || datosAdjunto?.examen || null;
      const examenNormalizado = this.normalizarExamen(examenOrigen);
      const indicePreguntas = this.construirIndicePreguntas(examenNormalizado?.preguntas);

      const respuestasNormalizadas = this.normalizarRespuestas(
        intento.respuestas && intento.respuestas.length > 0
          ? intento.respuestas
          : datosAdjunto?.respuestas,
        indicePreguntas
      );

      const tiempo = this.toNumber(
        intento.tiempoEmpleado ??
        (intento as any)?.duracion ??
        (intento as any)?.tiempo ??
        datosAdjunto?.tiempoEmpleado ??
        datosAdjunto?.tiempo ??
        datosAdjunto?.duracion ??
        0
      ) ?? 0;

      const calificacion = this.toNumber(
        intento.calificacion ??
        (intento as any)?.puntaje ??
        (intento as any)?.nota ??
        (intento as any)?.porcentaje ??
        datosAdjunto?.calificacion ??
        datosAdjunto?.puntaje ??
        datosAdjunto?.nota ??
        null
      );

      const fechaInicio = this.normalizarFecha(
        intento.fechaInicio ??
        (intento as any)?.inicio ??
        (intento as any)?.fechaInicio ??
        datosAdjunto?.fechaInicio ??
        datosAdjunto?.inicio ??
        intento.createdAt ??
        intento.updatedAt ??
        null
      );

      const fechaEntrega = this.normalizarFecha(
        intento.fechaEntrega ??
        (intento as any)?.fin ??
        (intento as any)?.fechaEntrega ??
        datosAdjunto?.fechaEntrega ??
        datosAdjunto?.fin ??
        null
      );

      const estadoNormalizado = this.normalizarEstadoIntento(intento);

      const salidasPantalla = this.toNumber(
        (intento as any)?.salidasPantalla ??
        (intento as any)?.salidasFullscreen ??
        (intento as any)?.proctoringSession?.salidasPantalla ??
        datosAdjunto?.salidasPantalla ??
        datosAdjunto?.proctoringSession?.salidasPantalla ??
        null
      );

      if (!intento.respuestas && datosAdjunto?.respuestas) {
        console.log('ℹ️ Respuestas reconstruidas desde archivo adjunto para intento', intento.id);
      }

      const intentoEnriquecido: IntentoConDetalle = {
        ...intento,
        examenAlumno: examenAlumno
          ? {
              ...examenAlumno,
              examen: examenNormalizado || examenAlumno?.examen || null
            }
          : examenAlumno,
        examen: examenNormalizado,
        respuestas: respuestasNormalizadas,
        tiempoEmpleado: tiempo,
        numeroIntento: intento.numeroIntento || index + 1,
        calificacion: calificacion ?? intento.calificacion,
        estado: estadoNormalizado,
        fechaInicio: fechaInicio || intento.fechaInicio,
        fechaEntrega: fechaEntrega || intento.fechaEntrega,
        salidasPantalla: salidasPantalla ?? (intento as any)?.salidasPantalla
      };

      if (examenNormalizado) {
        this.establecerExamenSiNoExiste(examenNormalizado);
      }

      return intentoEnriquecido;
    });

    return intentosNormalizados;
  }

  private decodificarArchivoAdjunto(archivo?: string): any {
    if (!archivo || typeof archivo !== 'string') {
      return {};
    }

    try {
      const base64 = archivo.includes('base64,')
        ? archivo.substring(archivo.indexOf('base64,') + 7)
        : archivo;

      const binario = atob(base64);
      const bytes = Uint8Array.from(binario, char => char.charCodeAt(0));
      const texto = new TextDecoder().decode(bytes);

      return JSON.parse(texto);
    } catch (error) {
      console.warn('⚠️ No se pudo decodificar archivo adjunto de intento', error);
      try {
        const base64 = archivo.includes('base64,')
          ? archivo.substring(archivo.indexOf('base64,') + 7)
          : archivo;
        return JSON.parse(atob(base64));
      } catch {
        return {};
      }
    }
  }

  private normalizarRespuestas(respuestas: any, indicePreguntas?: Map<string, PreguntaNormalizada>): RespuestaIntentoDetallada[] {
    if (!Array.isArray(respuestas)) {
      return [];
    }

    return respuestas.map((respuesta, index) => {
      const preguntaId = this.extraerIdPregunta(respuesta, index);
      const claveIndice = preguntaId.toLowerCase();
      const infoPregunta = indicePreguntas?.get(claveIndice);

      const valor = respuesta?.respuesta ?? respuesta?.valor ?? respuesta?.respuestaAlumno ?? respuesta?.seleccion ?? null;
      const respuestaCorrecta = respuesta?.respuestaCorrecta ?? respuesta?.correcta ?? infoPregunta?.respuestaCorrecta ?? null;
      const puntosPregunta = this.toNumber(
        respuesta?.puntosPregunta ?? respuesta?.valorPregunta ?? infoPregunta?.puntos ?? (infoPregunta?.puntos === 0 ? 0 : undefined)
      );
      const puntosObtenidos = this.toNumber(
        respuesta?.puntosObtenidos ?? respuesta?.calificacion ?? respuesta?.puntaje ?? respuesta?.score ?? null
      );
      const esCorrecta = typeof respuesta?.esCorrecta === 'boolean'
        ? respuesta.esCorrecta
        : undefined;
      const comentarios = respuesta?.comentarios || respuesta?.retroalimentacion || respuesta?.feedback || null;

      return {
        preguntaId,
        preguntaTexto: infoPregunta?.texto || `Pregunta ${index + 1}`,
        tipo: infoPregunta?.tipo ?? respuesta?.tipo ?? respuesta?.tipoPregunta ?? null,
        respuesta: this.formatearValorRespuesta(valor),
        respuestaCorrecta: this.formatearValorRespuesta(respuestaCorrecta),
        puntosPregunta: puntosPregunta ?? (infoPregunta?.puntos ?? null),
        puntosObtenidos: puntosObtenidos,
        esCorrecta,
        comentarios: comentarios ? this.formatearValorRespuesta(comentarios) : null
      };
    });
  }

  private normalizarEstadoIntento(origen: any): IntentoExamen['estado'] {
    const bruto = (origen?.estado ?? origen?.status ?? origen?.estadoIntento ?? origen?.resultado?.estado ?? '').toString().trim().toLowerCase();

    switch (bruto) {
      case 'calificado':
      case 'calificad':
      case 'calificadas':
      case 'evaluado':
      case 'evaluada':
      case 'aprobado':
      case 'reprobado':
      case 'corregido':
        return 'calificado';
      case 'entregado':
      case 'enviado':
      case 'presentado':
      case 'finalizado':
      case 'finalizada':
        return (this.toNumber(origen?.calificacion ?? origen?.puntaje ?? origen?.nota ?? null) ?? null) !== null
          ? 'calificado'
          : 'entregado';
      case 'abandonado':
      case 'cancelado':
      case 'anulado':
        return 'abandonado';
      case 'en progreso':
      case 'en-progreso':
      case 'progreso':
      case 'iniciado':
      case 'activo':
      case 'iniciada':
        return 'en-progreso';
      default:
        return 'en-progreso';
    }
  }

  private normalizarFecha(valor: any): string | null {
    if (!valor && valor !== 0) {
      return null;
    }

    if (valor instanceof Date) {
      return valor.toISOString();
    }

    if (typeof valor === 'number' && Number.isFinite(valor)) {
      const desdeNumero = new Date(valor);
      return Number.isNaN(desdeNumero.getTime()) ? null : desdeNumero.toISOString();
    }

    if (typeof valor === 'string') {
      const limpio = valor.trim();
      if (!limpio) {
        return null;
      }

      const iso = Date.parse(limpio);
      if (!Number.isNaN(iso)) {
        return new Date(iso).toISOString();
      }

      const numero = Number(limpio);
      if (!Number.isNaN(numero)) {
        const desdeNumero = new Date(numero);
        if (!Number.isNaN(desdeNumero.getTime())) {
          return desdeNumero.toISOString();
        }
      }
    }

    return null;
  }

  private cargarDatosExamenAsignado(): void {
    if (!this.examenAlumnoId) {
      return;
    }

    this.examenesService.getExamenAlumno(this.examenAlumnoId).subscribe({
      next: examenAlumno => {
        if (!examenAlumno) {
          return;
        }

        const examenNormalizado = this.normalizarExamen(examenAlumno.examen || examenAlumno);
        this.examen = examenNormalizado || examenAlumno;
        this.intentos = this.intentos.map(intento => ({
          ...intento,
          examen: intento.examen || examenNormalizado,
          examenAlumno: intento.examenAlumno || examenAlumno
        }));
        this.cdr.detectChanges();
      },
      error: error => {
        console.warn('⚠️ No se pudo cargar el examen asignado para el historial', error);
      }
    });
  }

  private normalizarExamen(examen: any): IntentoConDetalle['examen'] {
    console.log('📚 [normalizarExamen] Normalizando examen:', examen);
    
    if (!examen || typeof examen !== 'object') {
      console.warn('⚠️ [normalizarExamen] Examen inválido o nulo');
      return null;
    }

    const preguntasOriginales = examen.preguntas || examen.preguntasExamen || examen.items || examen.enunciados || [];
    console.log('📖 [normalizarExamen] Preguntas encontradas:', preguntasOriginales.length);
    
    const preguntasNormalizadas = this.normalizarPreguntas(preguntasOriginales);
    console.log('✅ [normalizarExamen] Preguntas normalizadas:', preguntasNormalizadas.length);

    const puntosTotales = this.toNumber(
      examen.puntosTotales ?? examen.puntajeTotal ?? examen.totalPuntos ?? examen.total ?? null
    );

    const examenNormalizado = {
      id: examen.id || examen.examenId || examen.uuid || examen._id,
      titulo: examen.titulo || examen.nombre || examen.descripcion || examen.tema,
      descripcion: examen.descripcion || examen.detalle || examen.instrucciones || '',
      puntosTotales: puntosTotales ?? this.sumarPuntosPreguntas(preguntasNormalizadas),
      intentosPermitidos: examen.intentosPermitidos ?? examen.intentos ?? examen.maxIntentos,
      preguntas: preguntasNormalizadas
    };
    
    console.log('✅ [normalizarExamen] Examen normalizado:', {
      id: examenNormalizado.id,
      titulo: examenNormalizado.titulo,
      preguntas: examenNormalizado.preguntas?.length || 0,
      puntos: examenNormalizado.puntosTotales
    });
    
    return examenNormalizado;
  }

  private normalizarPreguntas(preguntas: any): PreguntaNormalizada[] {
    console.log('📝 [normalizarPreguntas] Normalizando preguntas:', preguntas?.length || 0);
    
    if (!Array.isArray(preguntas)) {
      console.warn('⚠️ [normalizarPreguntas] No es un array');
      return [];
    }

    const normalizadas = preguntas.map((pregunta: any, index: number) => {
      const id = this.extraerIdPregunta(pregunta, index);
      const opciones = Array.isArray(pregunta?.opciones)
        ? pregunta.opciones
        : Array.isArray(pregunta?.alternativas)
        ? pregunta.alternativas
        : Array.isArray(pregunta?.respuestas)
        ? pregunta.respuestas
        : null;

      return {
        id,
        texto: this.formatearValorRespuesta(
          pregunta?.textoPregunta ?? pregunta?.texto ?? pregunta?.enunciado ?? pregunta?.pregunta ?? pregunta?.titulo ?? `Pregunta ${index + 1}`
        ),
        tipo: pregunta?.tipoPregunta ?? pregunta?.tipo ?? pregunta?.categoria ?? null,
        puntos: this.toNumber(pregunta?.puntos ?? pregunta?.valor ?? pregunta?.puntaje ?? pregunta?.puntuacion ?? pregunta?.puntosPosibles ?? null),
        respuestaCorrecta: this.formatearValorRespuesta(
          pregunta?.respuestaCorrecta ?? pregunta?.opcionCorrecta ?? pregunta?.respuesta ?? pregunta?.solucion ?? null
        ) || null,
        opciones
      };
    });
    
    console.log('✅ [normalizarPreguntas] Preguntas normalizadas:', normalizadas.length);
    if (normalizadas.length > 0) {
      console.log('📝 [normalizarPreguntas] Primera pregunta:', normalizadas[0]);
    }
    
    return normalizadas;
  }

  private construirIndicePreguntas(preguntas?: PreguntaNormalizada[] | null): Map<string, PreguntaNormalizada> {
    const indice = new Map<string, PreguntaNormalizada>();
    if (!preguntas || preguntas.length === 0) {
      return indice;
    }

    preguntas.forEach((pregunta, index) => {
      const claves = this.obtenerClavesPregunta(pregunta, index);
      claves.forEach(clave => {
        if (clave) {
          indice.set(clave.toLowerCase(), pregunta);
        }
      });
    });

    return indice;
  }

  private obtenerClavesPregunta(pregunta: PreguntaNormalizada, index: number): string[] {
    const claves = new Set<string>();
    if (pregunta.id) {
      claves.add(pregunta.id.toString());
    }
    claves.add(`index-${index}`);
    claves.add(`pregunta-${index + 1}`);
    return Array.from(claves);
  }

  private extraerIdPregunta(data: any, index: number): string {
    const candidato = data?.preguntaId
      ?? data?.pregunta_id
      ?? data?.pregunta
      ?? data?.questionId
      ?? data?.question_id
      ?? data?.id
      ?? data?.idPregunta
      ?? data?.uuid
      ?? data?.codigo;

    if (typeof candidato === 'string' && candidato.trim() !== '') {
      return candidato.trim();
    }
    if (typeof candidato === 'number') {
      return candidato.toString();
    }
    return `index-${index}`;
  }

  private formatearValorRespuesta(valor: any): string {
    if (valor === undefined || valor === null) {
      return '';
    }

    if (typeof valor === 'string') {
      return valor.trim();
    }

    if (typeof valor === 'number' || typeof valor === 'boolean') {
      return `${valor}`;
    }

    if (Array.isArray(valor)) {
      return valor
        .map(item => this.formatearValorRespuesta(item))
        .filter(Boolean)
        .join(', ');
    }

    if (typeof valor === 'object') {
      if ('texto' in valor) {
        return this.formatearValorRespuesta((valor as any).texto);
      }
      if ('titulo' in valor) {
        return this.formatearValorRespuesta((valor as any).titulo);
      }
      if ('nombre' in valor) {
        return this.formatearValorRespuesta((valor as any).nombre);
      }
      return JSON.stringify(valor);
    }

    return String(valor);
  }

  private toNumber(valor: any): number | null {
    if (valor === undefined || valor === null || valor === '') {
      return null;
    }

    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return valor;
    }

    if (typeof valor === 'string') {
      const normalizado = valor.replace(',', '.').trim();
      const numero = Number(normalizado);
      return Number.isFinite(numero) ? numero : null;
    }

    return null;
  }

  private sumarPuntosPreguntas(preguntas: PreguntaNormalizada[]): number | undefined {
    if (!preguntas.length) {
      return undefined;
    }

    const suma = preguntas.reduce((total, pregunta) => {
      const puntos = pregunta.puntos ?? 0;
      return total + puntos;
    }, 0);

    return suma || undefined;
  }

  private establecerExamenDesdeIntentos(intentos: IntentoConDetalle[]): void {
    const examenDesdeIntentos = intentos.find(intento => intento.examen)?.examen
      || intentos.find(intento => intento.examenAlumno?.examen)?.examenAlumno?.examen
      || null;

    if (examenDesdeIntentos) {
      this.establecerExamenSiNoExiste(examenDesdeIntentos);
    }
  }

  private establecerExamenSiNoExiste(examen: IntentoConDetalle['examen'] | null): void {
    if (!examen) {
      return;
    }

    if (!this.examen) {
      this.examen = examen;
      this.cdr.detectChanges();
      return;
    }

    if (!this.examen.preguntas?.length && examen.preguntas?.length) {
      this.examen = {
        ...this.examen,
        preguntas: examen.preguntas
      };
      this.cdr.detectChanges();
    }

    if (!this.examen.puntosTotales && examen.puntosTotales) {
      this.examen = {
        ...this.examen,
        puntosTotales: examen.puntosTotales
      };
      this.cdr.detectChanges();
    }
  }
}
