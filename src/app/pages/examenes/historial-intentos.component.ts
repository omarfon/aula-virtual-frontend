import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IntentosExamenService, IntentoExamen } from '../../services/intentos-examen.service';
import { ExamenesService } from '../../services/examenes.service';
import Swal from 'sweetalert2';

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

  examenAlumnoId: string = '';
  intentos: IntentoExamen[] = [];
  intentoSeleccionado: IntentoExamen | null = null;
  examen: any = null;
  
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
    this.cargando = true;
    this.intentosService.listarIntentos(this.examenAlumnoId).subscribe({
      next: (intentos) => {
        const intentosNormalizados = this.normalizarIntentos(intentos);

        this.intentos = intentosNormalizados.sort((a, b) => 
          new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
        );
        
        const examenEncontrado = this.intentos.find(i => i.examenAlumno?.examen)?.examenAlumno?.examen;
        if (examenEncontrado) {
          this.examen = examenEncontrado;
        } else {
          this.cargarDatosExamenAsignado();
        }
        
        this.cargando = false;
        console.log('📋 Intentos cargados:', this.intentos);
      },
      error: (error) => {
        console.error('❌ Error al cargar intentos:', error);
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'No se pudieron cargar los intentos'
        });
      }
    });
  }

  verDetalleIntento(intento: IntentoExamen) {
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

  get mejorIntento(): IntentoExamen | null {
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

  private normalizarIntentos(intentos: IntentoExamen[]): IntentoExamen[] {
    if (!Array.isArray(intentos)) {
      return [];
    }

    return intentos.map((intento, index) => {
      const datosAdjunto = this.decodificarArchivoAdjunto((intento as any)?.archivoAdjunto);
      const respuestasNormalizadas = this.normalizarRespuestas(
        intento.respuestas && intento.respuestas.length > 0
          ? intento.respuestas
          : datosAdjunto?.respuestas
      );

      const tiempo = intento.tiempoEmpleado ?? datosAdjunto?.tiempoEmpleado ?? 0;
      const examenAlumno = intento.examenAlumno || datosAdjunto?.examenAlumno || null;

      if (!intento.respuestas && datosAdjunto?.respuestas) {
        console.log('ℹ️ Respuestas reconstruidas desde archivo adjunto para intento', intento.id);
      }

      return {
        ...intento,
        examenAlumno,
        respuestas: respuestasNormalizadas,
        tiempoEmpleado: tiempo,
        numeroIntento: intento.numeroIntento || index + 1
      } as IntentoExamen;
    });
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

  private normalizarRespuestas(respuestas: any): any[] {
    if (!Array.isArray(respuestas)) {
      return [];
    }

    return respuestas.map((respuesta, index) => {
      const preguntaId = respuesta?.preguntaId || respuesta?.pregunta || `Pregunta ${index + 1}`;
      let valor = respuesta?.respuesta ?? respuesta?.valor ?? '';

      if (Array.isArray(valor)) {
        valor = valor.join(', ');
      }

      return {
        preguntaId,
        respuesta: String(valor)
      };
    });
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

        this.examen = examenAlumno.examen || examenAlumno;
        this.intentos = this.intentos.map(intento => ({
          ...intento,
          examenAlumno: intento.examenAlumno || examenAlumno
        }));
      },
      error: error => {
        console.warn('⚠️ No se pudo cargar el examen asignado para el historial', error);
      }
    });
  }
}
