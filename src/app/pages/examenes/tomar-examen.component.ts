import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IntentosExamenService, IntentoExamen } from '../../services/intentos-examen.service';
import { ExamenesService } from '../../services/examenes.service';
import { of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
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

      console.log('✅ Confirmación recibida, iniciando intento en backend...');

      this.intentosService.iniciarIntento(this.examenAlumnoId).pipe(
        tap(intento => {
          console.log('🟢 Intento iniciado correctamente:', intento);
          this.intentoActual = intento;
          this.horaInicio = new Date();
        }),
        switchMap(intento => this.cargarExamen(intento))
      ).subscribe({
        next: () => {
          console.log('✅ Examen listo para responder');
          this.finCargando();
        },
        error: (error) => {
          console.error('❌ Error en flujo de preparación del examen:', error);
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
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`;
    } else {
      return `${minutos}m ${segs}s`;
    }
  }

  async entregarExamen() {
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

      if (!confirmacion.isConfirmed) return;
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

      if (!confirmacion.isConfirmed) return;
    }

    this.enviarRespuestas();
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

    this.intentosService.entregarIntento(this.intentoActual.id, payload).subscribe({
      next: (intento) => {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }

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

    if (!confirmacion.isConfirmed) return;

    this.intentosService.abandonarIntento(this.intentoActual.id).subscribe({
      next: () => {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }

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

  actualizarRespuesta(preguntaId: string, valor: any) {
    this.respuestas.set(preguntaId, valor);
  }

  private construirPayloadEntrega(respuestasArray: { preguntaId: string; respuesta: string | string[]; }[], tiempoEmpleado: number): any {
    const datosEntrega = {
      respuestas: respuestasArray.map(item => ({
        preguntaId: item.preguntaId,
        respuesta: Array.isArray(item.respuesta) ? item.respuesta : String(item.respuesta ?? '')
      })),
      tiempoEmpleado
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

    this.preguntas.forEach(pregunta => {
      if (pregunta.tipoPregunta === 'multiple-choice' || pregunta.tipoPregunta === 'verdadero-falso') {
        this.respuestas.set(pregunta.id, '');
      } else {
        this.respuestas.set(pregunta.id, '');
      }
    });

    const limiteMinutos = this.obtenerLimiteTiempo(examenNormalizado, examenAlumno);
    if (limiteMinutos > 0) {
      this.tiempoRestante = limiteMinutos * 60;
      this.iniciarTemporizador();
    } else {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.tiempoRestante = 0;
    }

    console.log('✅ Preguntas normalizadas cargadas:', this.preguntas);
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
    const posiblesCampos = ['tiempoLimite', 'duracion', 'duracionMinutos', 'tiempoEstimado'];

    for (const campo of posiblesCampos) {
      const valor = Number(examen?.[campo]);
      if (!Number.isNaN(valor) && valor > 0) {
        return valor;
      }
    }

    if (examenAlumno) {
      for (const campo of posiblesCampos) {
        const valor = Number(examenAlumno?.[campo]);
        if (!Number.isNaN(valor) && valor > 0) {
          return valor;
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
}
