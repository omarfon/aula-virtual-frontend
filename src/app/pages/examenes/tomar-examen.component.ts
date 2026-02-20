import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IntentosExamenService, IntentoExamen } from '../../services/intentos-examen.service';
import { ExamenesService } from '../../services/examenes.service';
import { of } from 'rxjs';
import { map, switchMap, tap, take } from 'rxjs/operators';
import Swal from 'sweetalert2';

interface Pregunta {
  id: string;
  textoPregunta: string;
  tipoPregunta: 'multiple-choice' | 'verdadero-falso' | 'respuesta-corta';
  opciones?: string[];
  puntos: number;
}

interface Respuesta {
  preguntaId: string;
  respuesta: string | string[];
}

@Component({
  selector: 'app-tomar-examen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tomar-examen.component.html',
  styleUrls: ['./tomar-examen.component.css']
})
export class TomarExamenComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly intentosService = inject(IntentosExamenService);
  private readonly examenesService = inject(ExamenesService);
  private readonly cdr = inject(ChangeDetectorRef);

  examenAlumnoId: string = '';
  intentoActual: IntentoExamen | null = null;
  examen: any = null;
  preguntas: Pregunta[] = [];
  respuestas: Map<string, string | string[]> = new Map();
  
  cargando = true;
  enviando = false;
  tiempoRestante = 0;
  timerInterval: any = null;
  horaInicio: Date | null = null;

  mediaStream: MediaStream | null = null;
  private modoExamenActivo = false;
  private listenersRegistrados = false;
  private strikes = 0;
  private readonly maxStrikes = 20;
  private advertenciaActiva = false;
  private finalizadoPorDisciplina = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private readonly heartbeatIntervalMs = 5000;
  private heartbeatFallos = 0;
  private readonly heartbeatMaxFallos = 3;
  private ignorarSiguienteSalidaFullscreen = false;
  private ultimoEventoSospechoso: { tipo: string; timestamp: number } | null = null;
  private eventosSospechosos: Array<{ tipo: string; fecha: Date; detalle?: string }> = [];
  private proctoringSuspended = false;
  private salidasFullscreen = 0;
  private duracionExamenSegundos = 0;

  private readonly fullscreenHandler = () => this.onFullscreenChange();
  private readonly visibilityHandler = () => this.onVisibilityChange();
  private readonly blurHandler = () => this.onWindowBlur();
  private readonly focusHandler = () => this.onWindowFocus();
  private proctorVideoEl: ElementRef<HTMLVideoElement> | null = null;

  @ViewChild('proctorVideo')
  set proctorVideoSetter(ref: ElementRef<HTMLVideoElement> | undefined) {
    this.proctorVideoEl = ref ?? null;
    this.actualizarFeedProctoring();
  }

  ngOnInit() {
    console.log('🚀 TomarExamenComponent inicializado');
    this.examenAlumnoId = this.route.snapshot.paramMap.get('examenAlumnoId') || '';
    if (!this.examenAlumnoId) {
      this.router.navigate(['/examenes']);
      return;
    }

    console.log('🎯 ID de examenAlumno recibido desde la ruta:', this.examenAlumnoId);

    this.iniciarExamen();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.limpiarModoExamen();
  }

  async iniciarExamen() {
    this.cargando = true;

    try {
      console.log('🕒 Solicitando confirmación para iniciar intento...');

      const confirmacion = await Swal.fire({
        title: '¿Iniciar nuevo intento?',
        text: 'Se iniciará un nuevo intento de examen. El tiempo comenzará a correr.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Iniciar',
        cancelButtonText: 'Cancelar'
      });

      if (!confirmacion.isConfirmed) {
        console.log('🔴 Usuario canceló el inicio del examen');
        this.cargando = false;
        this.router.navigate(['/examenes']);
        return;
      }

      console.log('✅ Confirmación recibida, preparando modo examen...');

      const permisosOtorgados = await this.solicitarPermisosMedios();
      if (!permisosOtorgados) {
        console.warn('🚫 Permisos de cámara/micrófono denegados. Cancelando inicio de examen.');
        this.cargando = false;
        await Swal.fire({
          icon: 'warning',
          title: 'Permisos requeridos',
          text: 'Debes permitir el uso de la cámara (y opcionalmente micrófono) para iniciar el examen.',
          confirmButtonColor: '#3085d6'
        });
        this.limpiarModoExamen();
        this.router.navigate(['/examenes']);
        return;
      }

      const fullscreenHabilitado = await this.entrarPantallaCompleta();
      if (!fullscreenHabilitado) {
        console.warn('🚫 No se pudo activar el modo pantalla completa.');
        this.cargando = false;
        await Swal.fire({
          icon: 'warning',
          title: 'Pantalla completa obligatoria',
          text: 'Necesitas mantener el examen en pantalla completa para continuar.',
          confirmButtonColor: '#3085d6'
        });
        this.limpiarModoExamen();
        this.router.navigate(['/examenes']);
        return;
      }

      this.activarModoExamen();

      console.log('✅ Requisitos cumplidos. Iniciando intento en backend...');

      this.intentosService.iniciarIntento(this.examenAlumnoId).pipe(
        tap(intento => {
          console.log('🟢 Intento iniciado correctamente:', intento);
          this.intentoActual = intento;
          this.actualizarSalidasPantallaDesdeBackend(intento);
          this.horaInicio = new Date();
          this.iniciarHeartbeat();
        }),
        switchMap(intento => this.cargarExamen(intento))
      ).subscribe({
        next: () => {
          console.log('✅ Examen listo para responder');
          this.finCargando();
        },
        error: (error) => {
          console.error('❌ Error en flujo de preparación del examen:', error);
          this.limpiarModoExamen();
          this.finCargando();

          const mensaje = error?.message === 'SIN_PREGUNTAS'
            ? 'El examen no tiene preguntas configuradas.'
            : (error?.message || 'No se pudo iniciar el intento. Verifica tus intentos disponibles.');

          Swal.fire({
            icon: 'error',
            title: 'Error al cargar examen',
            text: mensaje,
            confirmButtonColor: '#3085d6'
          }).then(() => {
            this.router.navigate(['/examenes']);
          });
        }
      });
    } catch (error) {
      console.error('❌ Error:', error);
      this.cargando = false;
      this.limpiarModoExamen();
      this.router.navigate(['/examenes']);
    }
  }

  private cargarExamen(intento: IntentoExamen) {
    const examenDesdeIntento = intento?.examenAlumno?.examen;
    const examenAlumnoDesdeIntento = intento?.examenAlumno;

    if (examenDesdeIntento && this.configurarExamen(examenDesdeIntento, examenAlumnoDesdeIntento)) {
      return of(true).pipe(tap(() => this.finCargando()));
    }

    console.log('ℹ️ El intento no incluyó preguntas. Solicitando examen asignado al backend...');

    return this.examenesService.getExamenAlumno(this.examenAlumnoId).pipe(
      tap(examenAlumno => {
        console.log('📥 ExamenAlumno cargado desde backend:', examenAlumno);
      }),
      map(examenAlumno => {
        if (!examenAlumno?.examen) {
          console.warn('⚠️ Respuesta sin examen asociado', examenAlumno);
          throw new Error('El examen asignado no está disponible.');
        }

        const configurado = this.configurarExamen(examenAlumno.examen, examenAlumno);
        if (!configurado) {
          throw new Error('SIN_PREGUNTAS');
        }

        this.finCargando();
        return true;
      })
    );
  }

  private mostrarErrorSinPreguntas(mensaje?: string) {
    this.cargando = false;
    Swal.fire({
      icon: 'error',
      title: 'Preguntas no disponibles',
      text: mensaje || 'El backend no devolvió las preguntas del examen. Intenta nuevamente más tarde o contacta al profesor.',
      confirmButtonColor: '#3085d6'
    }).then(() => this.router.navigate(['/examenes']));
  }

  iniciarTemporizador() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      this.tiempoRestante--;
      this.cdr.detectChanges();
      
      if (this.tiempoRestante <= 0) {
        clearInterval(this.timerInterval);
        this.entregarAutomaticamente();
      } else if (this.tiempoRestante === 300) { // 5 minutos
        Swal.fire({
          icon: 'warning',
          title: 'Tiempo restante',
          text: 'Quedan 5 minutos para finalizar el examen',
          timer: 3000,
          showConfirmButton: false
        });
      }
    }, 1000);
  }

  formatearTiempo(segundos: number): string {
    if (!Number.isFinite(segundos) || segundos <= 0) {
      return '00:00';
    }

    const horas = Math.floor(segundos / 3600);
    const minutosTotales = Math.floor(segundos / 60);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    const pad = (valor: number) => valor.toString().padStart(2, '0');

    if (horas > 0) {
      return `${pad(horas)}:${pad(minutos)}:${pad(segs)}`;
    }

    return `${pad(minutosTotales)}:${pad(segs)}`;
  }

  async entregarExamen() {
    this.proctoringSuspended = true;
    let confirmacionFinalizada = false;

    try {
      // Validar que todas las preguntas estén respondidas
      const preguntasSinResponder = this.preguntas.filter(p => {
        const respuesta = this.respuestas.get(p.id);
        return !respuesta || (Array.isArray(respuesta) && respuesta.length === 0);
      });

      if (preguntasSinResponder.length > 0) {
        const confirmacion = await Swal.fire({
          title: 'Preguntas sin responder',
          text: `Tienes ${preguntasSinResponder.length} pregunta(s) sin responder. ¿Deseas entregar de todas formas?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Entregar',
          cancelButtonText: 'Continuar respondiendo'
        });

        if (!confirmacion.isConfirmed) {
          return;
        }
      } else {
        const confirmacion = await Swal.fire({
          title: '¿Entregar examen?',
          text: 'Una vez entregado no podrás modificar tus respuestas',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Entregar',
          cancelButtonText: 'Revisar'
        });

        if (!confirmacion.isConfirmed) {
          return;
        }
      }

      confirmacionFinalizada = true;
      this.enviarRespuestas();
    } finally {
      if (!confirmacionFinalizada) {
        this.proctoringSuspended = false;
      }
    }
  }

  entregarAutomaticamente() {
    Swal.fire({
      icon: 'info',
      title: 'Tiempo agotado',
      text: 'El tiempo ha finalizado. Se enviará tu examen automáticamente.',
      timer: 3000,
      showConfirmButton: false
    });

    setTimeout(() => this.enviarRespuestas(), 3000);
  }

  enviarRespuestas() {
    if (!this.intentoActual) return;

    this.enviando = true;

    // Calcular tiempo empleado
    const tiempoEmpleado = this.horaInicio 
      ? Math.floor((new Date().getTime() - this.horaInicio.getTime()) / 1000)
      : 0;

    // Convertir Map a array de respuestas
    const respuestasArray = Array.from(this.respuestas.entries()).map(([preguntaId, respuesta]) => ({
      preguntaId,
      respuesta
    }));

    const payload = this.construirPayloadEntrega(respuestasArray, tiempoEmpleado);
    console.log('📨 Payload entrega intento', payload);

    this.enviarHeartbeat();

    this.intentosService.entregarIntento(this.intentoActual.id, payload).subscribe({
      next: (intento) => {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }

        this.limpiarModoExamen();

        Swal.fire({
          icon: 'success',
          title: '¡Examen entregado!',
          text: 'Tu examen ha sido entregado exitosamente',
          confirmButtonColor: '#3085d6'
        }).then(() => {
          this.router.navigate(['/examenes']);
        });
      },
      error: (error) => {
        console.error('❌ Error al entregar:', error);
        this.enviando = false;
        this.proctoringSuspended = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'No se pudo entregar el examen'
        });
      }
    });
  }

  async abandonarIntento() {
    if (!this.intentoActual) return;

    this.proctoringSuspended = true;

    const confirmacion = await Swal.fire({
      title: '¿Abandonar intento?',
      text: 'Si abandonas, este intento se marcará como abandonado y contará como intento usado',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Abandonar',
      cancelButtonText: 'Continuar'
    });

    if (!confirmacion.isConfirmed) {
      this.proctoringSuspended = false;
      return;
    }

    this.enviarHeartbeat();

    this.intentosService.abandonarIntento(this.intentoActual.id, {
      salidasPantalla: this.salidasFullscreen
    }).subscribe({
      next: () => {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }

        this.limpiarModoExamen();

        this.proctoringSuspended = false;
        Swal.fire({
          icon: 'info',
          title: 'Intento abandonado',
          text: 'El intento ha sido abandonado',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/examenes']);
        });
      },
      error: (error) => {
        console.error('❌ Error al abandonar:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'No se pudo abandonar el intento'
        });
      }
    });
  }

  get progreso(): number {
    const respondidas = Array.from(this.respuestas.values()).filter(r => 
      r && (typeof r === 'string' ? r.length > 0 : r.length > 0)
    ).length;
    return this.preguntas.length > 0 
      ? Math.round((respondidas / this.preguntas.length) * 100) 
      : 0;
  }

  get salidasPantallaCompleta(): number {
    return this.salidasFullscreen;
  }

  get duracionTotalAsignada(): number {
    return this.duracionExamenSegundos;
  }

  actualizarRespuesta(preguntaId: string, valor: any) {
    this.respuestas.set(preguntaId, valor);
  }

  private actualizarSalidasPantallaDesdeBackend(origen: any): void {
    const conteo = this.extraerSalidasPantalla(origen);
    if (conteo !== null) {
      this.salidasFullscreen = Math.max(0, Math.floor(conteo));
      this.cdr.detectChanges();
    }
  }

  private extraerSalidasPantalla(origen: any): number | null {
    if (!origen || typeof origen !== 'object') {
      return null;
    }

    const candidatos = [
      (origen as any).salidasPantalla,
      (origen as any).salidasFullscreen,
      (origen as any).totalSalidasPantalla,
      (origen as any).totalSalidasFullscreen,
      (origen as any)?.proctoringSession?.salidasPantalla,
      (origen as any)?.proctoringSession?.salidasFullscreen,
      (origen as any)?.proctoring?.salidasPantalla,
      (origen as any)?.proctoring?.salidasFullscreen
    ];

    for (const candidato of candidatos) {
      const numero = this.normalizarNumero(candidato);
      if (numero !== null) {
        return numero;
      }
    }

    return null;
  }

  private normalizarNumero(valor: unknown): number | null {
    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return valor;
    }

    if (typeof valor === 'string') {
      const limpio = valor.trim();
      if (limpio) {
        const numero = Number(limpio.replace(',', '.'));
        if (Number.isFinite(numero)) {
          return numero;
        }
      }
    }

    return null;
  }

  private construirPayloadEntrega(respuestasArray: { preguntaId: string; respuesta: string | string[]; }[], tiempoEmpleado: number): any {
    const datosEntrega = {
      respuestas: respuestasArray.map(item => ({
        preguntaId: item.preguntaId,
        respuesta: Array.isArray(item.respuesta) ? item.respuesta : String(item.respuesta ?? '')
      })),
      tiempoEmpleado,
      salidasPantalla: this.salidasFullscreen
    };

    const json = JSON.stringify(datosEntrega);
    const base64 = this.convertirABase64(json);

    return {
      archivoAdjunto: `data:application/json;base64,${base64}`,
      comentarioAlumno: ''
    };
  }

  private convertirABase64(valor: string): string {
    try {
      return btoa(unescape(encodeURIComponent(valor)));
    } catch (error) {
      console.warn('⚠️ No se pudo convertir usando encodeURIComponent, usando btoa simple.', error);
      return btoa(valor);
    }
  }

  private configurarExamen(examen: any, examenAlumno?: any): boolean {
    console.log('🔍 Configurando examen con datos:', { examen, examenAlumno });

    const preguntasNormalizadas = this.normalizarPreguntas(examen, examenAlumno);
    if (!preguntasNormalizadas.length) {
      return false;
    }

    const examenNormalizado = this.normalizarExamen(examen, preguntasNormalizadas, examenAlumno);

    this.examen = examenNormalizado;
    this.preguntas = preguntasNormalizadas;
    this.respuestas = new Map();

    this.actualizarSalidasPantallaDesdeBackend(examenAlumno);
    this.actualizarSalidasPantallaDesdeBackend(examenNormalizado);

    this.preguntas.forEach(pregunta => {
      if (pregunta.tipoPregunta === 'multiple-choice' || pregunta.tipoPregunta === 'verdadero-falso') {
        this.respuestas.set(pregunta.id, '');
      } else {
        this.respuestas.set(pregunta.id, '');
      }
    });

    const limiteMinutos = this.obtenerLimiteTiempo(examenNormalizado, examenAlumno);
    this.duracionExamenSegundos = limiteMinutos > 0 ? Math.round(limiteMinutos * 60) : 0;

    if (this.duracionExamenSegundos > 0) {
      this.tiempoRestante = this.duracionExamenSegundos;
      this.iniciarTemporizador();
    } else {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.tiempoRestante = 0;
      this.duracionExamenSegundos = 0;
    }

    console.log('✅ Preguntas normalizadas cargadas:', this.preguntas);
    this.actualizarFeedProctoring();
    return true;
  }

  private normalizarPreguntas(examen: any, examenAlumno?: any): Pregunta[] {
    if (!examen && !examenAlumno) {
      return [];
    }

    const fuentes = [examen, examenAlumno].filter(Boolean);
    const colecciones = this.buscarColeccionesPreguntas(fuentes);

    const origen = colecciones.find(lista => lista.length > 0) || [];

    if (!origen.length) {
      console.warn('⚠️ No se encontraron colecciones de preguntas en la respuesta del backend.', { examen, examenAlumno });
    }

    return origen.map((item: any, index: number) => this.mapearPregunta(item, index));
  }

  private mapearPregunta(item: any, index: number): Pregunta {
    const base = item?.pregunta || item;
    const id = String(base?.id || item?.preguntaId || item?.id || `preg-${index}`);
    const texto = base?.textoPregunta || base?.texto || base?.enunciado || 'Pregunta sin texto';
    const tipo = this.mapearTipoPregunta(base?.tipoPregunta || base?.tipo || item?.tipoPregunta || item?.tipo);

    let opciones = base?.opciones || item?.opciones || base?.opcionesRespuesta || item?.opcionesRespuesta || item?.respuestas;
    if (Array.isArray(opciones)) {
      opciones = opciones.map((opcion: any) => String(opcion));
    } else if (opciones && typeof opciones === 'object') {
      opciones = Object.values(opciones).map(opcion => String(opcion));
    } else {
      opciones = [];
    }

    if (tipo === 'verdadero-falso' && (!opciones || opciones.length === 0)) {
      opciones = ['Verdadero', 'Falso'];
    }

    const puntos = Number(base?.puntos || item?.puntos || 1);

    return {
      id,
      textoPregunta: texto,
      tipoPregunta: tipo,
      opciones,
      puntos: Number.isFinite(puntos) && puntos > 0 ? puntos : 1
    };
  }

  private mapearTipoPregunta(tipo?: string): Pregunta['tipoPregunta'] {
    const tipoNormalizado = (tipo || '').toLowerCase();

    if (['verdadero_falso', 'verdadero-falso', 'true_false', 'true-false'].includes(tipoNormalizado)) {
      return 'verdadero-falso';
    }

    if (['respuesta_corta', 'respuesta-corta', 'texto_libre', 'abierta'].includes(tipoNormalizado)) {
      return 'respuesta-corta';
    }

    return 'multiple-choice';
  }

  private normalizarExamen(examen: any, preguntas: Pregunta[], examenAlumno?: any) {
    const puntosTotales = preguntas.reduce((total, pregunta) => total + (pregunta.puntos || 0), 0);

    const titulo = examen?.titulo || examenAlumno?.examenTitulo || examenAlumno?.titulo || 'Examen sin título';
    const descripcion = examen?.descripcion || examenAlumno?.descripcion || '';
    const puntos = examen?.puntosTotales || examenAlumno?.puntosTotales || puntosTotales;

    return {
      ...examen,
      titulo,
      descripcion,
      puntosTotales: puntos
    };
  }

  private obtenerLimiteTiempo(examen: any, examenAlumno?: any): number {
    const posiblesCampos = [
      'tiempoLimite',
      'duracion',
      'duracionMinutos',
      'tiempoEstimado',
      'duracionSegundos',
      'tiempoSegundos',
      'tiempoLimiteSegundos'
    ];

    const normalizarValor = (valor: number, campo: string): number => {
      if (campo.toLowerCase().includes('segundo')) {
        return valor / 60;
      }
      if (valor > 0 && valor <= 480) {
        return valor;
      }
      return valor / 60;
    };

    for (const campo of posiblesCampos) {
      const valor = Number(examen?.[campo]);
      if (!Number.isNaN(valor) && valor > 0) {
        return normalizarValor(valor, campo);
      }
    }

    if (examenAlumno) {
      for (const campo of posiblesCampos) {
        const valor = Number(examenAlumno?.[campo]);
        if (!Number.isNaN(valor) && valor > 0) {
          return normalizarValor(valor, campo);
        }
      }
    }

    return 0;
  }

  private esPosiblePregunta(item: any): boolean {
    if (!item) {
      return false;
    }

    const base = item?.pregunta || item;
    return Boolean(base?.textoPregunta || base?.texto || base?.enunciado);
  }

  private buscarColeccionesPreguntas(fuentes: any[]): any[] {
    const colecciones: any[] = [];
    const visitados = new WeakSet<object>();

    const explorar = (valor: any, profundidad: number) => {
      if (!valor || profundidad > 5) {
        return;
      }

      if (Array.isArray(valor)) {
        if (valor.length > 0 && this.esPosiblePregunta(valor[0])) {
          colecciones.push(valor);
          return;
        }

        valor.forEach(item => explorar(item, profundidad + 1));
        return;
      }

      if (typeof valor === 'object') {
        if (visitados.has(valor)) {
          return;
        }
        visitados.add(valor);

        Object.values(valor).forEach(child => explorar(child, profundidad + 1));
      }
    };

    fuentes.forEach(fuente => explorar(fuente, 0));

    return colecciones;
  }

  private finCargando(): void {
    this.cargando = false;
    if (this.cdr) {
      this.cdr.detectChanges();
    }
  }

  private actualizarFeedProctoring(): void {
    if (!this.proctorVideoEl || !this.mediaStream) {
      return;
    }

    const video = this.proctorVideoEl.nativeElement;
    if (!video) {
      return;
    }

    const videoConStream = video as HTMLVideoElement & { srcObject?: MediaStream };
    if (videoConStream.srcObject !== this.mediaStream) {
      videoConStream.srcObject = this.mediaStream;
    }

    video.muted = true;
    video.playsInline = true;

    void video.play().catch(error => {
      console.warn('⚠️ No se pudo reproducir el feed de monitoreo automáticamente.', error);
    });
  }

  private async solicitarPermisosMedios(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.warn('⚠️ navigator.mediaDevices.getUserMedia no está disponible en este navegador.');
      return false;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.actualizarFeedProctoring();
      return true;
    } catch (error) {
      console.warn('⚠️ Falló la solicitud de cámara y micrófono, intentando solo cámara.', error);
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.actualizarFeedProctoring();
        return true;
      } catch (errorVideo) {
        console.error('❌ El usuario rechazó los permisos de cámara.', errorVideo);
        return false;
      }
    }
  }

  private liberarMediaStream(): void {
    if (!this.mediaStream) {
      return;
    }

    this.mediaStream.getTracks().forEach(track => {
      try {
        track.stop();
      } catch (error) {
        console.warn('⚠️ No se pudo detener track de media.', error);
      }
    });

    this.mediaStream = null;
  }

  private async entrarPantallaCompleta(): Promise<boolean> {
    if (typeof document === 'undefined') {
      return false;
    }

    if (this.estaEnPantallaCompleta()) {
      return true;
    }

    const elemento: any = document.documentElement;

    try {
      if (elemento.requestFullscreen) {
        await elemento.requestFullscreen();
        return true;
      }
      if (elemento.webkitRequestFullscreen) {
        await elemento.webkitRequestFullscreen();
        return true;
      }
      if (elemento.mozRequestFullScreen) {
        await elemento.mozRequestFullScreen();
        return true;
      }
      if (elemento.msRequestFullscreen) {
        await elemento.msRequestFullscreen();
        return true;
      }
    } catch (error) {
      console.error('❌ Error al intentar activar pantalla completa.', error);
      return false;
    }

    console.warn('⚠️ requestFullscreen no está soportado.');
    return false;
  }

  private async salirPantallaCompleta(): Promise<void> {
    if (typeof document === 'undefined' || !this.estaEnPantallaCompleta()) {
      return;
    }

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return;
      }
      const doc: any = document;
      if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
        return;
      }
      if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
        return;
      }
      if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
    } catch (error) {
      console.warn('⚠️ Error al salir de pantalla completa.', error);
    }
  }

  private activarModoExamen(): void {
    this.strikes = 0;
    this.eventosSospechosos = [];
    this.finalizadoPorDisciplina = false;
    this.ultimoEventoSospechoso = null;
    this.modoExamenActivo = true;
    this.proctoringSuspended = false;
    this.salidasFullscreen = 0;
    this.registrarListenersModoExamen();
  }

  private registrarListenersModoExamen(): void {
    if (this.listenersRegistrados || typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    document.addEventListener('fullscreenchange', this.fullscreenHandler);
    document.addEventListener('webkitfullscreenchange', this.fullscreenHandler as any);
    document.addEventListener('mozfullscreenchange', this.fullscreenHandler as any);
    document.addEventListener('MSFullscreenChange', this.fullscreenHandler as any);
    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('blur', this.blurHandler);
    window.addEventListener('focus', this.focusHandler);

    this.listenersRegistrados = true;
  }

  private removerListenersModoExamen(): void {
    if (!this.listenersRegistrados || typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    document.removeEventListener('fullscreenchange', this.fullscreenHandler);
    document.removeEventListener('webkitfullscreenchange', this.fullscreenHandler as any);
    document.removeEventListener('mozfullscreenchange', this.fullscreenHandler as any);
    document.removeEventListener('MSFullscreenChange', this.fullscreenHandler as any);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    window.removeEventListener('blur', this.blurHandler);
    window.removeEventListener('focus', this.focusHandler);

    this.listenersRegistrados = false;
  }

  private onFullscreenChange(): void {
    if (!this.modoExamenActivo) {
      return;
    }

    if (this.ignorarSiguienteSalidaFullscreen) {
      this.ignorarSiguienteSalidaFullscreen = false;
      return;
    }

    if (!this.estaEnPantallaCompleta()) {
      this.registrarEventoSospechoso('fullscreen', 'Saliste de la pantalla completa.', true);
    }
  }

  private onVisibilityChange(): void {
    if (!this.modoExamenActivo) {
      return;
    }

    if (document.visibilityState === 'hidden') {
      this.registrarEventoSospechoso('visibility', 'Detectamos que cambiaste de pestaña o minimizaste la ventana.');
    }
  }

  private onWindowBlur(): void {
    if (!this.modoExamenActivo) {
      return;
    }

    this.registrarEventoSospechoso('blur', 'Detectamos que el foco de la ventana se perdió.');
  }

  private onWindowFocus(): void {
    if (!this.modoExamenActivo) {
      return;
    }

    if (!this.estaEnPantallaCompleta()) {
      void this.entrarPantallaCompleta();
    }
  }

  private registrarEventoSospechoso(tipo: string, detalle?: string, forzarFullscreen = false): void {
    if (!this.modoExamenActivo || this.finalizadoPorDisciplina || this.proctoringSuspended) {
      return;
    }

    const ahora = Date.now();
    if (this.ultimoEventoSospechoso && this.ultimoEventoSospechoso.tipo === tipo && (ahora - this.ultimoEventoSospechoso.timestamp) < 1000) {
      return;
    }

    this.ultimoEventoSospechoso = { tipo, timestamp: ahora };
    this.strikes += 1;
    this.eventosSospechosos.push({ tipo, fecha: new Date(), detalle });

    if (tipo === 'fullscreen') {
      this.salidasFullscreen += 1;
      this.cdr.detectChanges();
      this.enviarHeartbeat();
    }

    const mensaje = [
      detalle || 'Se detectó una actividad fuera de lo permitido.',
      `Advertencia registrada (#${this.strikes}). Mantén el examen en pantalla completa.`
    ].join(' ');

    void this.mostrarAdvertenciaSospechosa(mensaje, forzarFullscreen);
  }

  private async mostrarAdvertenciaSospechosa(mensaje: string, forzarFullscreen: boolean): Promise<void> {
    if (this.advertenciaActiva || this.finalizadoPorDisciplina) {
      return;
    }

    this.advertenciaActiva = true;
    try {
      await Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: mensaje,
        confirmButtonText: forzarFullscreen ? 'Regresar al examen' : 'Entendido',
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonColor: '#d97706'
      });

      if (forzarFullscreen && !this.finalizadoPorDisciplina) {
        await this.entrarPantallaCompleta();
      }
    } finally {
      this.advertenciaActiva = false;
    }
  }

  private finalizarPorSospechas(detalle: string): void {
    if (this.finalizadoPorDisciplina) {
      return;
    }

    this.finalizadoPorDisciplina = true;
    this.limpiarModoExamen(true);

    const mensaje = detalle || 'Se detectaron actividades no permitidas. El intento será finalizado.';

    Swal.fire({
      icon: 'error',
      title: 'Intento finalizado',
      text: mensaje,
      confirmButtonColor: '#d33'
    }).then(() => {
      if (!this.intentoActual) {
        this.router.navigate(['/examenes']);
        return;
      }

      this.intentosService.abandonarIntento(this.intentoActual.id).subscribe({
        next: () => {
          this.router.navigate(['/examenes']);
        },
        error: error => {
          console.error('⚠️ Error al marcar intento como abandonado tras sanción.', error);
          this.router.navigate(['/examenes']);
        }
      });
    });
  }

  private iniciarHeartbeat(): void {
    if (!this.intentoActual) {
      return;
    }

    this.detenerHeartbeat();
    this.heartbeatFallos = 0;

    const enviar = () => this.enviarHeartbeat();
    this.heartbeatTimer = setInterval(enviar, this.heartbeatIntervalMs);
    enviar();
  }

  private detenerHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private enviarHeartbeat(datosExtra: Record<string, unknown> = {}): void {
    if (!this.intentoActual) {
      return;
    }

    const payload: Record<string, unknown> = {
      salidasPantalla: this.salidasFullscreen,
      ...datosExtra
    };

    this.intentosService.enviarHeartbeat(this.intentoActual.id, payload).pipe(take(1)).subscribe({
      next: () => {
        this.heartbeatFallos = 0;
      },
      error: error => {
        console.warn('⚠️ Heartbeat falló.', error);
        this.heartbeatFallos += 1;
        if (this.heartbeatFallos >= this.heartbeatMaxFallos) {
          this.heartbeatFallos = 0;
          this.registrarEventoSospechoso('heartbeat', 'Se perdió la comunicación con el servidor.');
        }
      }
    });
  }

  private limpiarModoExamen(finalizando = false): void {
    this.detenerHeartbeat();
    this.removerListenersModoExamen();
    this.modoExamenActivo = false;
    this.proctoringSuspended = false;
    if (!finalizando) {
      this.finalizadoPorDisciplina = false;
    }
    this.advertenciaActiva = false;
    this.heartbeatFallos = 0;
    this.ultimoEventoSospechoso = null;
    this.strikes = 0;
    this.salidasFullscreen = 0;
    this.duracionExamenSegundos = 0;

    if (this.estaEnPantallaCompleta()) {
      this.ignorarSiguienteSalidaFullscreen = true;
      void this.salirPantallaCompleta();
    }

    if (this.proctorVideoEl?.nativeElement) {
      const video = this.proctorVideoEl.nativeElement;
      try {
        video.pause();
      } catch (error) {
        console.warn('⚠️ No se pudo pausar el video de monitoreo.', error);
      }
      (video as HTMLVideoElement).srcObject = null;
      video.removeAttribute('src');
      video.load();
    }

    this.liberarMediaStream();
  }

  private estaEnPantallaCompleta(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    const doc: any = document;
    return Boolean(
      document.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  }
}
