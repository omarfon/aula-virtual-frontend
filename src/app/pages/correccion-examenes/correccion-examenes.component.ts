import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { IntentosExamenService, EntregaDocenteFiltro } from '../../services/intentos-examen.service';
import { AuthService } from '../../services/auth.service';

interface RespuestaEstudiante {
  preguntaId: string;
  preguntaTexto: string;
  respuestaEstudiante: string;
  respuestaCorrecta: string;
  esCorrecta: boolean;
  puntosObtenidos: number;
  puntosPosibles: number;
}

interface ExamenEstudiante {
  id: string;
  examenAlumnoId: string;
  intentoId?: string;
  estudianteId: string;
  estudianteNombre: string;
  estudianteEmail: string;
  cursoNombre: string;
  examenTitulo: string;
  cursoId?: string;
  examenId?: string;
  fechaEnvio: Date;
  estado: 'pendiente' | 'en-revision' | 'corregido';
  puntajeObtenido: number;
  puntajeTotal: number;
  porcentaje: number;
  tiempoEmpleado: number; // en minutos
  numeroIntento: number;
  respuestas: RespuestaEstudiante[];
  retroalimentacionGeneral: string;
  corregidoPor?: string;
  fechaCorreccion?: Date;
  intentosRegistrados?: number;
}

@Component({
  selector: 'app-correccion-examenes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './correccion-examenes.component.html',
  styleUrls: ['./correccion-examenes.component.css']
})
export class CorreccionExamenesComponent implements OnInit, OnDestroy {
  private readonly intentosService = inject(IntentosExamenService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  filtroEstado: 'todos' | 'pendiente' | 'en-revision' | 'corregido' = 'todos';
  filtroCursoId = '';
  filtroExamenId = '';
  terminoBusqueda = '';
  examenSeleccionado: ExamenEstudiante | null = null;
  vistaActual: 'lista' | 'detalle' = 'lista';

  cursosFiltro: { id: string; nombre: string }[] = [];
  examenesFiltro: { id: string; titulo: string; cursoId?: string }[] = [];
  examenes: ExamenEstudiante[] = [];
  examenesOriginal: ExamenEstudiante[] = [];
  cargando = true;
  errorCarga: string | null = null;
  guardando = false;
  mensajeGuardado: { tipo: 'exito' | 'error'; texto: string } | null = null;
  private estadisticasRemotas = { total: 0, pendientes: 0, enRevision: 0, corregidos: 0 };
  private busquedaTimeout: ReturnType<typeof setTimeout> | null = null;
  private docenteActualNombre: string | null = null;
  private componenteDestruido = false;

  ngOnInit(): void {
    this.docenteActualNombre = this.obtenerNombreDocenteActual();
    void this.cargarIntentosCorreccion();
  }

  ngOnDestroy(): void {
    if (this.busquedaTimeout) {
      clearTimeout(this.busquedaTimeout);
      this.busquedaTimeout = null;
    }
    this.componenteDestruido = true;
  }

  private construirFiltrosConsulta(): EntregaDocenteFiltro {
    const filtros: EntregaDocenteFiltro = {};

    if (this.filtroCursoId) {
      filtros.cursoId = this.filtroCursoId;
    }

    if (this.filtroExamenId) {
      filtros.examenId = this.filtroExamenId;
    }

    filtros.estado = this.filtroEstado;

    const termino = this.terminoBusqueda.trim();
    if (termino) {
      filtros.busqueda = termino;
    }

    return filtros;
  }

  private extraerEntregasDocente(respuesta: unknown): any[] {
    if (!respuesta) {
      return [];
    }

    if (Array.isArray(respuesta)) {
      return respuesta;
    }

    if (typeof respuesta !== 'object') {
      return [];
    }

    const origen = respuesta as Record<string, unknown>;
    const clavesBusqueda = [
      'entregas',
      'data',
      'items',
      'results',
      'lista',
      'listado',
      'records',
      'content',
      'docs',
      'rows',
      'values',
      'examenesAlumnos',
      'entregasDocente',
      'entregasDocentes',
      'registros',
      'dataset'
    ];

    for (const clave of clavesBusqueda) {
      const valor = origen[clave];
      if (Array.isArray(valor) && valor.length) {
        return valor as any[];
      }
      if (valor && typeof valor === 'object') {
        const posible = this.extraerEntregasDocente(valor);
        if (posible.length) {
          return posible;
        }
      }
    }

    for (const valor of Object.values(origen)) {
      if (Array.isArray(valor)) {
        if (valor.length) {
          return valor as any[];
        }
        continue;
      }
      if (valor && typeof valor === 'object') {
        const posible = this.extraerEntregasDocente(valor);
        if (posible.length) {
          return posible;
        }
      }
    }

    if (this.esPosibleEntrega(origen)) {
      return [origen];
    }

    return [];
  }

  private esPosibleEntrega(objeto: Record<string, unknown>): boolean {
    const clavesIndicativas = ['examenAlumnoId', 'intentoId', 'estado', 'alumno', 'alumnoNombre', 'estudianteNombre', 'curso', 'examen', 'cursoNombre', 'examenTitulo'];
    return clavesIndicativas.some(clave => clave in objeto);
  }

  private extraerFiltrosDocente(respuesta: unknown): { cursos?: any[]; examenes?: any[] } {
    const resultado: { cursos?: any[]; examenes?: any[] } = {};

    const examinar = (fuente: unknown) => {
      if (!fuente || typeof fuente !== 'object') {
        return;
      }

      const objeto = fuente as Record<string, unknown>;
      const clavesCursos = ['cursos', 'cursosDisponibles', 'catalogoCursos', 'opcionesCursos', 'cursosDocente'];
      const clavesExamenes = ['examenes', 'examenesDisponibles', 'catalogoExamenes', 'opcionesExamenes', 'examenesDocente'];

      for (const clave of clavesCursos) {
        if (resultado.cursos?.length) {
          break;
        }
        const valor = objeto[clave];
        if (Array.isArray(valor) && valor.length) {
          resultado.cursos = valor as any[];
        }
      }

      for (const clave of clavesExamenes) {
        if (resultado.examenes?.length) {
          break;
        }
        const valor = objeto[clave];
        if (Array.isArray(valor) && valor.length) {
          resultado.examenes = valor as any[];
        }
      }

      if (!resultado.cursos || !resultado.examenes) {
        Object.values(objeto).forEach((valor) => {
          if (Array.isArray(valor)) {
            if (!resultado.cursos && valor.every(item => typeof item === 'object' && item)) {
              const candidatos = valor as Array<Record<string, unknown>>;
              if (candidatos.some(item => 'cursoId' in item || 'curso' in item || 'cursoNombre' in item)) {
                resultado.cursos = candidatos;
              }
            }
            if (!resultado.examenes && valor.every(item => typeof item === 'object' && item)) {
              const candidatos = valor as Array<Record<string, unknown>>;
              if (candidatos.some(item => 'examenId' in item || 'examen' in item || 'titulo' in item)) {
                resultado.examenes = candidatos;
              }
            }
          } else if (valor && typeof valor === 'object') {
            examinar(valor);
          }
        });
      }

      if ((!resultado.cursos || !resultado.examenes)) {
        const clavesAnidadas = ['filtros', 'opciones', 'meta', 'config', 'settings', 'catalogos', 'data'];
        for (const clave of clavesAnidadas) {
          const valor = objeto[clave];
          if (valor && typeof valor === 'object') {
            examinar(valor);
          }
        }
      }
    };

    examinar(respuesta);

    return resultado;
  }

  private extraerEstadisticasDocente(respuesta: unknown, dataset: ExamenEstudiante[]): { total: number; pendientes: number; enRevision: number; corregidos: number } {
    const base = { total: 0, pendientes: 0, enRevision: 0, corregidos: 0 };

    const mapear = (fuente: unknown): { total: number; pendientes: number; enRevision: number; corregidos: number } | null => {
      if (!fuente || typeof fuente !== 'object') {
        return null;
      }

      const objeto = fuente as Record<string, unknown>;
      const total = this.obtenerNumero(objeto['total'], objeto['cantidad'], objeto['totalEntregas']);
      const pendientes = this.obtenerNumero(objeto['pendientes'], objeto['totalPendientes']);
      const enRevision = this.obtenerNumero(objeto['enRevision'], objeto['en_revision'], objeto['totalEnRevision']);
      const corregidos = this.obtenerNumero(objeto['corregidos'], objeto['totalCorregidos']);

      if (total || pendientes || enRevision || corregidos) {
        return {
          total,
          pendientes,
          enRevision,
          corregidos
        };
      }

      return null;
    };

    const posiblesFuentes = [
      respuesta,
      (respuesta as any)?.estadisticas,
      (respuesta as any)?.resumen,
      (respuesta as any)?.meta,
      (respuesta as any)?.meta?.estadisticas,
      (respuesta as any)?.metricas,
      (respuesta as any)?.metricasDocente,
      (respuesta as any)?.estadisticasDocente,
      (respuesta as any)?.resumenEntregas
    ];
    for (const fuente of posiblesFuentes) {
      const resultado = mapear(fuente);
      if (resultado) {
        return {
          total: resultado.total,
          pendientes: resultado.pendientes,
          enRevision: resultado.enRevision,
          corregidos: resultado.corregidos
        };
      }
    }

    return this.calcularEstadisticasLocales(dataset);
  }

  private aplicarFiltrosDisponibles(filtros: { cursos?: any[]; examenes?: any[] } | null | undefined, dataset: ExamenEstudiante[]): void {
    this.cursosFiltro = [];
    this.examenesFiltro = [];

    const normalizarCursos = (lista?: any[]) => {
      const resultado: { id: string; nombre: string }[] = [];
      (Array.isArray(lista) ? lista : []).forEach((curso) => {
        const id = this.obtenerId(curso?.id, curso?._id, curso?.cursoId, curso?.uuid);
        if (!id) {
          return;
        }
        const nombre = this.obtenerTexto(curso?.nombre, curso?.titulo, curso?.descripcion, curso?.cursoNombre) || 'Curso sin título';
        resultado.push({ id, nombre });
      });
      return resultado;
    };

    const normalizarExamenes = (lista?: any[]) => {
      const resultado: { id: string; titulo: string; cursoId?: string }[] = [];
      (Array.isArray(lista) ? lista : []).forEach((examen) => {
        const id = this.obtenerId(examen?.id, examen?._id, examen?.examenId, examen?.uuid);
        if (!id) {
          return;
        }
        const titulo = this.obtenerTexto(examen?.titulo, examen?.nombre, examen?.examenTitulo, examen?.descripcionCorta) || 'Examen sin título';
        const cursoId = this.obtenerId(examen?.cursoId, examen?.curso?.id, examen?.curso_id) || undefined;
        resultado.push({ id, titulo, cursoId });
      });
      return resultado;
    };

    const cursosRemotos = filtros?.cursos?.length ? normalizarCursos(filtros?.cursos) : [];
    const examenesRemotos = filtros?.examenes?.length ? normalizarExamenes(filtros?.examenes) : [];

    if (cursosRemotos.length) {
      this.cursosFiltro = cursosRemotos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    if (examenesRemotos.length) {
      this.examenesFiltro = examenesRemotos.sort((a, b) => a.titulo.localeCompare(b.titulo));
    }

    if (!cursosRemotos.length || !examenesRemotos.length) {
      const fallback = this.obtenerFiltrosDesdeDataset(dataset);
      if (!cursosRemotos.length) {
        this.cursosFiltro = fallback.cursos;
      }
      if (!examenesRemotos.length) {
        this.examenesFiltro = fallback.examenes;
      }
    }

    if (this.filtroCursoId && !this.cursosFiltro.some(curso => curso.id === this.filtroCursoId)) {
      this.filtroCursoId = '';
    }

    if (this.filtroExamenId && !this.examenesFiltro.some(examen => examen.id === this.filtroExamenId)) {
      this.filtroExamenId = '';
    }
  }

  private obtenerFiltrosDesdeDataset(dataset: ExamenEstudiante[]): { cursos: { id: string; nombre: string }[]; examenes: { id: string; titulo: string; cursoId?: string }[] } {
    const cursosMap = new Map<string, string>();
    const examenesMap = new Map<string, { titulo: string; cursoId?: string }>();

    dataset.forEach((examen) => {
      if (examen.cursoId && examen.cursoNombre) {
        cursosMap.set(examen.cursoId, examen.cursoNombre);
      }
      if (examen.examenId) {
        examenesMap.set(examen.examenId, { titulo: examen.examenTitulo, cursoId: examen.cursoId });
      }
    });

    const cursos = Array.from(cursosMap.entries()).map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
    const examenes = Array.from(examenesMap.entries()).map(([id, datos]) => ({ id, ...datos })).sort((a, b) => a.titulo.localeCompare(b.titulo));

    return { cursos, examenes };
  }

  private normalizarEntregas(entregas: unknown): ExamenEstudiante[] {
    const lista = Array.isArray(entregas) ? entregas : this.extraerEntregasDocente(entregas);
    if (!lista.length) {
      return [];
    }

    return lista
      .map((entrega, index) => this.mapearEntrega(entrega as any, index + 1))
      .filter((examen): examen is ExamenEstudiante => Boolean(examen))
      .filter((examen) => this.tieneIntentoDisponible(examen));
  }

  private calcularEstadisticasLocales(dataset: ExamenEstudiante[]): { total: number; pendientes: number; enRevision: number; corregidos: number } {
    const total = dataset.length;
    const pendientes = dataset.filter(e => e.estado === 'pendiente').length;
    const enRevision = dataset.filter(e => e.estado === 'en-revision').length;
    const corregidos = dataset.filter(e => e.estado === 'corregido').length;

    return { total, pendientes, enRevision, corregidos };
  }

  private tieneIntentoDisponible(examen: ExamenEstudiante | null | undefined): boolean {
    if (!examen) {
      return false;
    }

    if ((examen.respuestas && examen.respuestas.length > 0) || examen.intentoId) {
      return true;
    }

    if (Number.isFinite(examen.numeroIntento) && examen.numeroIntento > 0) {
      return true;
    }

    if (Number.isFinite(examen.intentosRegistrados) && (examen.intentosRegistrados ?? 0) > 0) {
      return true;
    }

    return false;
  }

  private construirPayloadCorreccion(examen: ExamenEstudiante): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      estado: examen.estado,
      calificacion: Math.max(0, examen.puntajeObtenido ?? 0)
    };

    const retroalimentacionOriginal = examen.retroalimentacionGeneral ?? '';
    const retroalimentacionLimpia = retroalimentacionOriginal.trim();
    payload['retroalimentacionGeneral'] = retroalimentacionLimpia;
    if (examen.intentoId) {
      payload['retroalimentacionIntento'] = retroalimentacionLimpia;
    }

    const docente = (examen.corregidoPor ?? this.docenteActualNombre ?? '').trim();
    if (docente) {
      payload['corregidoPor'] = docente;
      examen.corregidoPor = docente;
    }

    if (examen.intentoId) {
      payload['intentoId'] = examen.intentoId;
    }

    return payload;
  }

  recargar(): void {
    void this.cargarIntentosCorreccion(true);
  }

  onFiltroCursoChange(nuevoCursoId: string): void {
    this.filtroCursoId = nuevoCursoId;
    if (this.filtroExamenId) {
      const examenSeleccionado = this.examenesFiltro.find(examen => examen.id === this.filtroExamenId);
      if (examenSeleccionado && nuevoCursoId && examenSeleccionado.cursoId !== nuevoCursoId) {
        this.filtroExamenId = '';
      }
    }
    void this.cargarIntentosCorreccion();
  }

  onFiltroExamenChange(nuevoExamenId: string): void {
    this.filtroExamenId = nuevoExamenId;
    void this.cargarIntentosCorreccion();
  }

  onFiltroEstadoChange(nuevoEstado: 'todos' | 'pendiente' | 'en-revision' | 'corregido'): void {
    this.filtroEstado = nuevoEstado;
    void this.cargarIntentosCorreccion();
  }

  onBusquedaChange(valor: string): void {
    this.terminoBusqueda = valor;
    if (this.busquedaTimeout) {
      clearTimeout(this.busquedaTimeout);
    }
    this.busquedaTimeout = setTimeout(() => {
      void this.cargarIntentosCorreccion();
    }, 350);
  }

  private async cargarIntentosCorreccion(forceReload = false): Promise<void> {
    this.cargando = true;
    this.errorCarga = null;

    if (forceReload) {
      this.estadisticasRemotas = { total: 0, pendientes: 0, enRevision: 0, corregidos: 0 };
    }

    try {
      const filtrosConsulta = this.construirFiltrosConsulta();
      const respuesta = await firstValueFrom(this.intentosService.listarIntentosCorreccion(filtrosConsulta));
      const entregas = this.extraerEntregasDocente(respuesta);
      const examenesNormalizados = this.normalizarEntregas(entregas);
      const filtrosDisponibles = this.extraerFiltrosDocente(respuesta);
      const estadisticas = this.extraerEstadisticasDocente(respuesta, examenesNormalizados);

      this.estadisticasRemotas = estadisticas;

      this.examenesOriginal = [...examenesNormalizados];
      this.examenes = [...this.examenesOriginal];
      this.aplicarFiltrosDisponibles(filtrosDisponibles, this.examenesOriginal);

      if (!this.examenesOriginal.length) {
        this.examenSeleccionado = null;
        this.vistaActual = 'lista';
      }

      this.errorCarga = null;
    } catch (error) {
      console.error('Error al obtener entregas para corrección:', error);
      this.examenes = [];
      this.examenesOriginal = [];
      this.cursosFiltro = [];
      this.examenesFiltro = [];
      this.filtroCursoId = '';
      this.filtroExamenId = '';
      this.estadisticasRemotas = { total: 0, pendientes: 0, enRevision: 0, corregidos: 0 };
      this.errorCarga = error instanceof Error
        ? error.message
        : 'No se pudieron cargar las entregas de exámenes.';
    } finally {
      this.cargando = false;
      if (!this.componenteDestruido) {
        this.cdr.detectChanges(); // Asegura que el spinner se actualice incluso si el flujo terminó fuera del ciclo normal
      }
    }
  }

  get examenesFiltroVisibles(): { id: string; titulo: string; cursoId?: string }[] {
    if (!this.filtroCursoId) {
      return this.examenesFiltro;
    }
    return this.examenesFiltro.filter(examen => examen.cursoId === this.filtroCursoId);
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
      console.warn('No se pudo decodificar archivo adjunto del intento.', error);
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

  private obtenerPreguntas(examen: any): any[] {
    if (!examen || typeof examen !== 'object') {
      return [];
    }

    const claves = ['preguntas', 'preguntasLista', 'preguntasCreadas', 'items', 'questions'];
    for (const clave of claves) {
      const valor = examen?.[clave];
      if (Array.isArray(valor) && valor.length) {
        return valor;
      }
    }

    const valores = Object.values(examen);
    for (const valor of valores) {
      if (Array.isArray(valor) && valor.length && typeof valor[0] === 'object') {
        return valor;
      }
    }

    return [];
  }

  private calcularPuntosTotales(preguntas: any[]): number {
    if (!Array.isArray(preguntas)) {
      return 0;
    }

    return preguntas.reduce((total, pregunta) => {
      const puntos = this.obtenerNumero(
        pregunta?.puntos,
        pregunta?.puntaje,
        pregunta?.valor,
        pregunta?.puntosPosibles,
        pregunta?.puntuacionMaxima,
        pregunta?.puntosPregunta
      );
      return total + Math.max(0, puntos);
    }, 0);
  }

  private normalizarRespuestas(respuestas: any[], preguntas: any[]): RespuestaEstudiante[] {
    if (!Array.isArray(respuestas)) {
      return [];
    }

    const preguntasPorId = new Map<string, { data: any; index: number }>();
    preguntas.forEach((pregunta, index) => {
      const id = this.obtenerTexto(pregunta?.id, pregunta?.preguntaId, pregunta?.clave) || `preg-${index + 1}`;
      preguntasPorId.set(id, { data: pregunta, index });
    });

    return respuestas.map((respuesta, index) => {
      const idRespuesta = this.obtenerTexto(respuesta?.preguntaId, respuesta?.pregunta, respuesta?.id) || `preg-${index + 1}`;
      const pregunta = preguntasPorId.get(idRespuesta) || (preguntas[index] ? { data: preguntas[index], index } : undefined);
      const preguntaData = pregunta?.data || {};
      const preguntaIndex = pregunta?.index ?? index;

      let opciones = this.obtenerOpcionesPregunta(preguntaData);
      if ((!opciones || !opciones.length) && Array.isArray(respuesta?.opciones)) {
        opciones = respuesta.opciones.map((opcion: any) => this.formatearValorRespuesta(opcion));
      }

      const candidatosValor = [
        respuesta?.respuesta,
        respuesta?.respuestaAlumno,
        respuesta?.valor,
        respuesta?.seleccion,
        respuesta?.seleccionIndice,
        respuesta?.indiceSeleccionado,
        respuesta?.seleccionado,
        respuesta?.respuestaTexto,
        respuesta?.textoRespuesta,
        respuesta?.contenido,
        respuesta?.valorSeleccionado
      ];

      let valorOriginal: any = null;
      for (const candidato of candidatosValor) {
        if (candidato === null || candidato === undefined) {
          continue;
        }
        if (typeof candidato === 'string' && !candidato.trim()) {
          continue;
        }
        valorOriginal = candidato;
        break;
      }

      let respuestaEstudiante: string;
      if (valorOriginal === null || valorOriginal === undefined) {
        respuestaEstudiante = 'Sin respuesta';
      } else if (Array.isArray(valorOriginal)) {
        const valores = valorOriginal
          .map((item: any) => this.formatearValorRespuesta(item))
          .filter(Boolean);
        respuestaEstudiante = valores.length ? valores.join(', ') : 'Sin respuesta';
      } else if (valorOriginal instanceof Date) {
        respuestaEstudiante = valorOriginal.toLocaleString();
      } else if (typeof valorOriginal === 'boolean') {
        if (opciones.length >= 2) {
          respuestaEstudiante = valorOriginal ? opciones[1] : opciones[0];
        } else {
          respuestaEstudiante = valorOriginal ? 'Verdadero' : 'Falso';
        }
      } else if (typeof valorOriginal === 'number' && Number.isFinite(valorOriginal)) {
        respuestaEstudiante = opciones[valorOriginal] ?? String(valorOriginal);
      } else if (typeof valorOriginal === 'string') {
        const texto = valorOriginal.trim();
        if (texto.length && opciones.length) {
          const indice = Number(texto);
          if (!Number.isNaN(indice) && opciones[indice]) {
            respuestaEstudiante = opciones[indice];
          } else {
            respuestaEstudiante = texto;
          }
        } else {
          respuestaEstudiante = texto || 'Sin respuesta';
        }
      } else if (typeof valorOriginal === 'object') {
        const texto = this.obtenerTexto(
          valorOriginal?.texto,
          valorOriginal?.label,
          valorOriginal?.value,
          valorOriginal?.valor,
          valorOriginal?.descripcion,
          valorOriginal?.respuesta
        );
        respuestaEstudiante = texto || JSON.stringify(valorOriginal);
      } else {
        respuestaEstudiante = this.formatearValorRespuesta(valorOriginal);
      }

      let indiceCorrecto = this.obtenerIndiceCorrecto(preguntaData);
      if (indiceCorrecto === null && respuesta?.respuestaCorrecta !== undefined && respuesta?.respuestaCorrecta !== null) {
        const indiceRespuesta = Number(respuesta.respuestaCorrecta);
        if (!Number.isNaN(indiceRespuesta)) {
          indiceCorrecto = indiceRespuesta;
        }
      }

      let respuestaCorrecta = this.obtenerTextoCorrecto(preguntaData, opciones, indiceCorrecto);
      if (!respuestaCorrecta && typeof respuesta?.respuestaCorrectaTexto === 'string') {
        respuestaCorrecta = respuesta.respuestaCorrectaTexto.trim();
      }
      if (!respuestaCorrecta && typeof respuesta?.respuestaCorrectaLabel === 'string') {
        respuestaCorrecta = respuesta.respuestaCorrectaLabel.trim();
      }
      if (!respuestaCorrecta && typeof respuesta?.respuestaCorrectaDescripcion === 'string') {
        respuestaCorrecta = respuesta.respuestaCorrectaDescripcion.trim();
      }
      if (!respuestaCorrecta && typeof respuesta?.respuestaCorrecta === 'string' && opciones.length) {
        const indiceTexto = Number(respuesta.respuestaCorrecta);
        if (!Number.isNaN(indiceTexto) && opciones[indiceTexto]) {
          respuestaCorrecta = opciones[indiceTexto];
        }
      }

      const esCorrecta = this.compararRespuestas(respuestaEstudiante, respuestaCorrecta, opciones, indiceCorrecto);

      const puntosPosibles = this.obtenerNumero(
        preguntaData?.puntos,
        preguntaData?.puntaje,
        preguntaData?.valor,
        preguntaData?.puntosPosibles,
        preguntaData?.puntosPregunta,
        respuesta?.puntosPregunta
      );
      const puntosObtenidos = this.obtenerNumero(
        respuesta?.puntosObtenidos,
        respuesta?.puntaje,
        esCorrecta ? puntosPosibles : 0
      );

      return {
        preguntaId: idRespuesta,
        preguntaTexto: this.obtenerTexto(
          preguntaData?.textoPregunta,
          preguntaData?.texto,
          preguntaData?.enunciado,
          preguntaData?.pregunta,
          respuesta?.pregunta,
          respuesta?.titulo
        ) || `Pregunta ${preguntaIndex + 1}`,
        respuestaEstudiante,
        respuestaCorrecta: respuestaCorrecta || 'Sin respuesta correcta registrada',
        esCorrecta,
        puntosObtenidos: Math.max(0, Math.min(puntosPosibles || puntosObtenidos, puntosObtenidos)),
        puntosPosibles: puntosPosibles || 0
      };
    });
  }

  private obtenerOpcionesPregunta(pregunta: any): string[] {
    if (!pregunta) {
      return [];
    }

    const posibles = [
      pregunta?.opciones,
      pregunta?.opcionesRespuesta,
      pregunta?.respuestas,
      pregunta?.alternativas
    ];

    for (const candidato of posibles) {
      if (Array.isArray(candidato)) {
        return candidato.map(opcion => String(opcion));
      }
      if (candidato && typeof candidato === 'object') {
        return Object.values(candidato).map(opcion => String(opcion));
      }
    }

    return [];
  }

  private obtenerIndiceCorrecto(pregunta: any): number | null {
    if (!pregunta) {
      return null;
    }

    const candidatos = [
      pregunta?.respuestaCorrecta,
      pregunta?.respuestaCorrectaIndice,
      pregunta?.correcta,
      pregunta?.indiceCorrecto
    ];

    for (const candidato of candidatos) {
      if (typeof candidato === 'number' && Number.isFinite(candidato)) {
        return candidato;
      }
      if (typeof candidato === 'string' && candidato.trim()) {
        const indice = Number(candidato);
        if (!Number.isNaN(indice)) {
          return indice;
        }
      }
    }

    return null;
  }

  private obtenerTextoCorrecto(pregunta: any, opciones: string[], indiceCorrecto: number | null): string {
    const candidatos = [
      pregunta?.respuestaCorrectaTexto,
      pregunta?.respuestaCorrecta,
      pregunta?.respuesta,
      pregunta?.respuestaEsperada
    ];

    for (const candidato of candidatos) {
      if (typeof candidato === 'string' && candidato.trim()) {
        return candidato.trim();
      }
    }

    if (indiceCorrecto !== null && indiceCorrecto >= 0 && indiceCorrecto < opciones.length) {
      return opciones[indiceCorrecto];
    }

    return '';
  }

  private compararRespuestas(valorAlumno: string, respuestaCorrecta: string, opciones: string[], indiceCorrecto: number | null): boolean {
    if (!valorAlumno) {
      return false;
    }

    const alumnoNormalizado = valorAlumno.trim().toLowerCase();

    if (respuestaCorrecta && alumnoNormalizado === respuestaCorrecta.trim().toLowerCase()) {
      return true;
    }

    if (indiceCorrecto !== null && indiceCorrecto >= 0 && indiceCorrecto < opciones.length) {
      const opcionCorrecta = opciones[indiceCorrecto];
      if (opcionCorrecta && alumnoNormalizado === opcionCorrecta.trim().toLowerCase()) {
        return true;
      }
    }

    return false;
  }

  private mapearEntrega(origen: any, fallbackNumero: number): ExamenEstudiante | null {
    if (!origen) {
      return null;
    }

    const intento = this.obtenerIntentoNormalizado(origen);
    const datosAdjunto = this.decodificarArchivoAdjunto((intento as any)?.archivoAdjunto || origen?.archivoAdjunto);
    const examenAlumno = intento?.examenAlumno || origen?.examenAlumno || datosAdjunto?.examenAlumno || this.construirExamenAlumnoDesdeEntrega(origen);
    const examen = origen?.examen || examenAlumno?.examen || datosAdjunto?.examen || datosAdjunto?.examenAlumno?.examen || {};
    const alumno = origen?.alumno || examenAlumno?.alumno || examenAlumno?.student || datosAdjunto?.alumno || {};
    const curso = origen?.curso || examenAlumno?.curso || examenAlumno?.cursoAsignado || datosAdjunto?.curso || examen?.curso || {};

    const examenAlumnoId = this.obtenerId(
      origen?.examenAlumnoId,
      examenAlumno?.id,
      datosAdjunto?.examenAlumnoId,
      intento?.examenAlumnoId,
      origen?.id
    );

    const intentoId = this.obtenerId(
      origen?.intentoId,
      intento?.id,
      examenAlumno?.mejorIntentoId,
      origen?.mejorIntentoId,
      origen?.ultimoIntentoId
    );

    const estudianteId = this.obtenerTexto(
      origen?.alumnoId,
      alumno?.id,
      alumno?.alumnoId,
      examenAlumno?.alumnoId,
      datosAdjunto?.alumnoId
    ) || examenAlumnoId || intentoId || `entrega-${fallbackNumero}`;

    const estudianteNombre = this.obtenerTexto(
      origen?.alumnoNombre,
      origen?.estudianteNombre,
      alumno?.nombreCompleto,
      alumno?.nombre,
      alumno?.nombres,
      alumno?.displayName
    );

    const estudianteEmail = this.obtenerTexto(
      origen?.alumnoEmail,
      origen?.estudianteEmail,
      alumno?.email,
      alumno?.correo,
      alumno?.correoElectronico,
      alumno?.username
    );

    const cursoNombre = this.obtenerTexto(
      origen?.cursoNombre,
      curso?.titulo,
      curso?.nombre,
      examenAlumno?.cursoNombre,
      examen?.cursoNombre
    ) || 'Curso sin nombre';

    const examenTitulo = this.obtenerTexto(
      origen?.examenTitulo,
      examen?.titulo,
      examenAlumno?.examenTitulo,
      examenAlumno?.titulo,
      datosAdjunto?.examenTitulo
    ) || 'Examen sin título';

    const cursoId = this.obtenerId(
      origen?.cursoId,
      curso?.id,
      curso?.cursoId,
      examenAlumno?.cursoId,
      datosAdjunto?.cursoId
    );

    const examenId = this.obtenerId(
      origen?.examenId,
      examen?.id,
      examenAlumno?.examenId,
      datosAdjunto?.examenId,
      intento?.examenId
    );

    const respuestasBrutas = Array.isArray(origen?.respuestas) && origen.respuestas.length
      ? origen.respuestas
      : Array.isArray(intento?.respuestas) && intento.respuestas.length
        ? intento.respuestas
        : Array.isArray(origen?.ultimoIntentoRespuestas) && origen.ultimoIntentoRespuestas.length
          ? origen.ultimoIntentoRespuestas
          : Array.isArray(datosAdjunto?.respuestas) && datosAdjunto.respuestas.length
            ? datosAdjunto.respuestas
            : [];

    const preguntas = Array.isArray(origen?.preguntas)
      ? origen.preguntas
      : Array.isArray(datosAdjunto?.preguntas)
        ? datosAdjunto.preguntas
        : Array.isArray(origen?.ultimoIntentoRespuestas) && origen.ultimoIntentoRespuestas.length
          ? origen.ultimoIntentoRespuestas
          : this.obtenerPreguntas(examen);
    const respuestas = this.normalizarRespuestas(respuestasBrutas, preguntas);

    const puntajeTotalRaw = this.obtenerNumero(
      origen?.puntajeTotal,
      origen?.totalPuntos,
      examen?.puntosTotales,
      examenAlumno?.puntosTotales,
      datosAdjunto?.puntosTotales,
      this.calcularPuntosTotales(preguntas)
    );
    const puntajeTotal = puntajeTotalRaw > 0 ? puntajeTotalRaw : 0;

    const calificacionRaw = this.obtenerNumero(
      origen?.puntajeObtenido,
      origen?.calificacion,
      origen?.calificacionFinal,
      intento?.calificacion,
      examenAlumno?.calificacion,
      datosAdjunto?.calificacion
    );
    const puntajeObtenido = calificacionRaw > 0 ? calificacionRaw : 0;

    const porcentajeCalculado = puntajeTotal > 0 ? Math.round((puntajeObtenido / puntajeTotal) * 100) : 0;
    const porcentaje = this.obtenerNumero(origen?.porcentaje, origen?.porcentajeObtenido, porcentajeCalculado) || porcentajeCalculado;

    const fechaEntrega = origen?.fechaEntrega || origen?.ultimoIntentoFechaEntrega || intento?.fechaEntrega || examenAlumno?.fechaEntrega || datosAdjunto?.fechaEntrega || intento?.updatedAt || intento?.createdAt || origen?.creadoEn;

    const tiempoEmpleado = Math.max(0, this.normalizarTiempoEmpleado(
      this.obtenerNumero(
        origen?.tiempoEmpleado,
        intento?.tiempoEmpleado,
        datosAdjunto?.tiempoEmpleado,
        examenAlumno?.tiempoEmpleado
      )
    ));

    const intentosRegistrados = this.obtenerNumero(
      origen?.intentosRealizados,
      origen?.totalIntentos,
      origen?.cantidadIntentos,
      intento?.intentosRegistrados,
      intento?.numeroIntento,
      examenAlumno?.numeroIntento,
      datosAdjunto?.numeroIntento
    );

    const numeroIntento = this.obtenerNumero(
      origen?.numeroIntento,
      intento?.numeroIntento,
      examenAlumno?.numeroIntento,
      datosAdjunto?.numeroIntento,
      intentosRegistrados
    ) || fallbackNumero;

    const estadoDocente = this.traducirEstado(this.obtenerTexto(origen?.estado, examenAlumno?.estado, intento?.estado));

    const retroalimentacion = this.obtenerTexto(
      origen?.retroalimentacionGeneral,
      origen?.retroalimentacion,
      examenAlumno?.retroalimentacion,
      intento?.retroalimentacion,
      datosAdjunto?.retroalimentacion
    ) || '';

    const corregidoPor = this.obtenerTexto(
      origen?.corregidoPor,
      examenAlumno?.corregidoPor,
      (intento as any)?.calificadoPor,
      datosAdjunto?.corregidoPor
    ) || undefined;

    const fechaCorreccion = estadoDocente === 'corregido'
      ? this.parseFecha(
          origen?.fechaCorreccion ||
          examenAlumno?.fechaCorreccion ||
          datosAdjunto?.fechaCorreccion ||
          intento?.updatedAt
        )
      : undefined;

    if (!estudianteNombre && !estudianteEmail && !cursoNombre && !examenTitulo) {
      return null;
    }

    const identificador = examenAlumnoId || intentoId || this.obtenerId(origen?.id) || `entrega-${fallbackNumero}`;

    return {
      id: identificador,
      examenAlumnoId: identificador,
      intentoId: intentoId || undefined,
      estudianteId,
      estudianteNombre: estudianteNombre || 'Alumno sin nombre',
      estudianteEmail: estudianteEmail || 'sin-email',
      cursoNombre,
      examenTitulo,
      cursoId: cursoId || undefined,
      examenId: examenId || undefined,
      fechaEnvio: this.parseFecha(fechaEntrega),
      estado: estadoDocente,
      puntajeObtenido,
      puntajeTotal,
      porcentaje,
      tiempoEmpleado,
      numeroIntento,
      respuestas,
      retroalimentacionGeneral: retroalimentacion,
      corregidoPor,
      fechaCorreccion,
      intentosRegistrados: intentosRegistrados > 0 ? intentosRegistrados : undefined
    };
  }

  private obtenerIntentoNormalizado(origen: any): any {
    if (!origen || typeof origen !== 'object') {
      return {};
    }

    if (origen.examenAlumno && (Array.isArray(origen.respuestas) || origen.calificacion !== undefined)) {
      return origen;
    }

    const candidatos = [
      origen.intentoSeleccionado,
      origen.intento,
      origen.mejorIntento,
      origen.ultimoIntento,
      Array.isArray(origen.intentos) ? origen.intentos.find((item: any) => item?.estado === 'calificado' || item?.estado === 'entregado') : undefined,
      Array.isArray(origen.intentos) ? origen.intentos[0] : undefined
    ];

    const intento = candidatos.find(item => item) || origen;

    return {
      ...intento,
      examenAlumno: intento?.examenAlumno || origen.examenAlumno || this.construirExamenAlumnoDesdeEntrega(origen)
    };
  }

  private construirExamenAlumnoDesdeEntrega(origen: any): any {
    if (!origen || typeof origen !== 'object') {
      return {};
    }

    return {
      id: this.obtenerId(origen?.examenAlumnoId, origen?.id),
      alumnoId: this.obtenerTexto(origen?.alumnoId, origen?.estudianteId),
      examenId: this.obtenerId(origen?.examenId),
      cursoId: this.obtenerId(origen?.cursoId),
      cursoNombre: this.obtenerTexto(origen?.cursoNombre),
      examenTitulo: this.obtenerTexto(origen?.examenTitulo),
      retroalimentacion: this.obtenerTexto(origen?.retroalimentacionGeneral, origen?.retroalimentacion),
      calificacion: this.obtenerNumero(origen?.calificacion, origen?.puntajeObtenido),
      numeroIntento: this.obtenerNumero(origen?.numeroIntento),
      tiempoEmpleado: this.obtenerNumero(origen?.tiempoEmpleado),
      estado: this.obtenerTexto(origen?.estado),
      curso: {
        id: this.obtenerId(origen?.cursoId),
        titulo: this.obtenerTexto(origen?.cursoNombre),
        nombre: this.obtenerTexto(origen?.cursoNombre)
      },
      examen: {
        id: this.obtenerId(origen?.examenId),
        titulo: this.obtenerTexto(origen?.examenTitulo),
        curso: {
          id: this.obtenerId(origen?.cursoId),
          titulo: this.obtenerTexto(origen?.cursoNombre),
          nombre: this.obtenerTexto(origen?.cursoNombre)
        },
        preguntas: Array.isArray(origen?.preguntas) ? origen.preguntas : undefined
      },
      alumno: {
        id: this.obtenerTexto(origen?.alumnoId, origen?.estudianteId),
        nombreCompleto: this.obtenerTexto(origen?.alumnoNombre, origen?.estudianteNombre),
        email: this.obtenerTexto(origen?.alumnoEmail, origen?.estudianteEmail)
      }
    };
  }

  private obtenerTexto(...valores: any[]): string {
    for (const valor of valores) {
      if (valor === null || valor === undefined) {
        continue;
      }

      if (typeof valor === 'string') {
        const texto = valor.trim();
        if (texto.length) {
          return texto;
        }
        continue;
      }

      if (typeof valor === 'number' && Number.isFinite(valor)) {
        return String(valor);
      }

      if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
        return valor.toISOString();
      }

      if (Array.isArray(valor)) {
        const texto = valor
          .map(item => (typeof item === 'string' ? item.trim() : this.obtenerTexto(item)))
          .filter(Boolean)
          .join(', ');
        if (texto.length) {
          return texto;
        }
        continue;
      }

      if (typeof valor === 'object') {
        const combinaciones = [
          [valor?.nombres, valor?.apellidos],
          [valor?.nombre, valor?.apellido],
          [valor?.primerNombre, valor?.apellidoPaterno, valor?.apellidoMaterno]
        ];

        for (const partes of combinaciones) {
          if (!Array.isArray(partes)) {
            continue;
          }
          const texto = partes.filter(Boolean).join(' ').trim();
          if (texto.length) {
            return texto;
          }
        }

        const posibles = [
          valor?.texto,
          valor?.valor,
          valor?.value,
          valor?.nombre,
          valor?.titulo,
          valor?.descripcion,
          valor?.nombreCompleto,
          valor?.displayName,
          valor?.fullName,
          valor?.fullname,
          valor?.docente,
          valor?.docenteNombre,
          valor?.responsable,
          valor?.usuario,
          valor?.username,
          valor?.correo,
          valor?.correoElectronico,
          valor?.email
        ];
        const candidato = this.obtenerTexto(...posibles);
        if (candidato) {
          return candidato;
        }
      }
    }

    return '';
  }

  private obtenerNombreDocenteActual(): string | null {
    try {
      const usuario = this.authService.currentUserValue;
      if (!usuario) {
        return null;
      }

      const candidatos = [
        usuario?.nombreCompleto,
        usuario?.displayName,
        usuario?.fullName,
        usuario?.fullname,
        [usuario?.nombres, usuario?.apellidos],
        [usuario?.nombre, usuario?.apellido],
        [usuario?.primerNombre, usuario?.apellidoPaterno, usuario?.apellidoMaterno],
        usuario?.nombre,
        usuario?.apellido,
        usuario?.email,
        usuario?.correo,
        usuario?.correoElectronico,
        usuario?.usuario,
        usuario?.username
      ];

      const texto = this.obtenerTexto(...candidatos);
      return texto || null;
    } catch {
      return null;
    }
  }

  private obtenerNumero(...valores: any[]): number {
    for (const valor of valores) {
      if (valor === null || valor === undefined) {
        continue;
      }

      if (typeof valor === 'number' && Number.isFinite(valor)) {
        return valor;
      }

      if (typeof valor === 'string') {
        const limpio = valor.replace(/,/g, '.').replace(/[^0-9.+-]/g, '');
        if (!limpio.trim()) {
          continue;
        }
        const numero = Number(limpio);
        if (!Number.isNaN(numero)) {
          return numero;
        }
      }

      if (typeof valor === 'object') {
        const posibles = [valor?.valor, valor?.value, valor?.cantidad, valor?.total, valor?.puntaje];
        const numero = this.obtenerNumero(...posibles);
        if (Number.isFinite(numero)) {
          return numero;
        }
      }
    }

    return 0;
  }

  private obtenerId(...valores: any[]): string | null {
    for (const valor of valores) {
      if (valor === null || valor === undefined) {
        continue;
      }

      if (typeof valor === 'string') {
        const texto = valor.trim();
        if (texto.length) {
          return texto;
        }
      } else if (typeof valor === 'number' && Number.isFinite(valor)) {
        return String(valor);
      } else if (typeof valor === 'object' && !(valor instanceof Date)) {
        const posibles = [valor?.id, valor?._id, valor?.uuid, valor?.uid, valor?.value, valor?.valor];
        const candidato = this.obtenerId(...posibles);
        if (candidato) {
          return candidato;
        }
      }
    }

    return null;
  }

  private formatearValorRespuesta(valor: any): string {
    if (valor === null || valor === undefined) {
      return 'Sin respuesta';
    }

    if (typeof valor === 'string') {
      const texto = valor.trim();
      return texto.length ? texto : 'Sin respuesta';
    }

    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return String(valor);
    }

    if (Array.isArray(valor)) {
      const texto = valor
        .map(item => this.formatearValorRespuesta(item))
        .filter(item => item && item !== 'Sin respuesta')
        .join(', ');
      return texto.length ? texto : 'Sin respuesta';
    }

    if (typeof valor === 'object') {
      const posibles = [valor?.texto, valor?.label, valor?.value, valor?.valor, valor?.respuesta];
      const texto = this.obtenerTexto(...posibles);
      return texto.length ? texto : JSON.stringify(valor);
    }

    return String(valor);
  }

  private parseFecha(valor: Date | string | number | null | undefined): Date {
    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
      return valor;
    }

    if (typeof valor === 'number' && Number.isFinite(valor)) {
      const esSegundo = valor > 1_000_000_000 && valor < 1_000_000_000_000;
      const timestamp = esSegundo ? valor * 1000 : valor;
      const fecha = new Date(timestamp);
      if (!Number.isNaN(fecha.getTime())) {
        return fecha;
      }
    }

    if (typeof valor === 'string' && valor.trim().length) {
      const fecha = new Date(valor);
      if (!Number.isNaN(fecha.getTime())) {
        return fecha;
      }
    }

    return new Date();
  }

  private normalizarTiempoEmpleado(valor: number | string | null | undefined): number {
    if (valor === null || valor === undefined) {
      return 0;
    }

    if (typeof valor === 'string') {
      if (valor.includes(':')) {
        const partes = valor.split(':').map(parte => Number(parte));
        if (partes.every(parte => !Number.isNaN(parte))) {
          const [horas, minutos, segundos] = [partes[0] || 0, partes[1] || 0, partes[2] || 0];
          return Math.round(horas * 60 + minutos + segundos / 60);
        }
      }

      const numero = Number(valor);
      if (!Number.isNaN(numero)) {
        return this.normalizarTiempoEmpleado(numero);
      }
      return 0;
    }

    if (typeof valor === 'number' && Number.isFinite(valor)) {
      const absoluto = Math.abs(valor);
      if (absoluto > 1000 && absoluto < 100000) {
        return Math.round(absoluto / 60);
      }
      if (absoluto >= 100000) {
        return Math.round(absoluto / 60000);
      }
      return Math.round(absoluto);
    }

    return 0;
  }

  private traducirEstado(estado?: string | null): 'pendiente' | 'en-revision' | 'corregido' {
    const normalizado = (estado || '').toString().trim().toLowerCase();

    if (['pendiente', 'pending', 'sin-calificar', 'sin_calificar', 'entregado', 'submitted'].includes(normalizado)) {
      return 'pendiente';
    }

    if (['en revision', 'en-revision', 'revision', 'en_revision', 'review'].includes(normalizado)) {
      return 'en-revision';
    }

    if (['corregido', 'calificado', 'evaluado', 'graded', 'completado', 'finalizado'].includes(normalizado)) {
      return 'corregido';
    }

    return 'pendiente';
  }

  get examenesFiltrados(): ExamenEstudiante[] {
    return this.examenes.filter(examen => {
      const coincideEstado = this.filtroEstado === 'todos' || examen.estado === this.filtroEstado;
      const coincideCurso = !this.filtroCursoId || examen.cursoId === this.filtroCursoId;
      const coincideExamen = !this.filtroExamenId || examen.examenId === this.filtroExamenId;
      const termino = this.terminoBusqueda.toLowerCase();
      const coincideBusqueda = !this.terminoBusqueda ||
        examen.estudianteNombre.toLowerCase().includes(termino) ||
        examen.estudianteEmail.toLowerCase().includes(termino) ||
        examen.examenTitulo.toLowerCase().includes(termino);

      return coincideEstado && coincideCurso && coincideExamen && coincideBusqueda;
    });
  }

  get estadisticas() {
    const dataset = this.examenesFiltrados;
    const stats = this.estadisticasRemotas;

    if (stats.total || stats.pendientes || stats.enRevision || stats.corregidos) {
      return stats;
    }

    return this.calcularEstadisticasLocales(dataset);
  }

  seleccionarExamen(examen: ExamenEstudiante) {
    this.mensajeGuardado = null;
    this.examenSeleccionado = examen;
    this.vistaActual = 'detalle';
    if (this.examenSeleccionado && !this.examenSeleccionado.corregidoPor && this.docenteActualNombre) {
      this.examenSeleccionado.corregidoPor = this.docenteActualNombre;
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  volverALista() {
    this.vistaActual = 'lista';
    this.examenSeleccionado = null;
  }

  cambiarEstado(estado: 'pendiente' | 'en-revision' | 'corregido') {
    if (this.examenSeleccionado) {
      this.examenSeleccionado.estado = estado;
      if (estado === 'corregido') {
        this.examenSeleccionado.fechaCorreccion = new Date();
        if (!this.examenSeleccionado.corregidoPor) {
          this.examenSeleccionado.corregidoPor = this.docenteActualNombre || 'Docente responsable';
        }
        this.calcularPuntaje();
      } else {
        this.examenSeleccionado.fechaCorreccion = undefined;
        this.examenSeleccionado.corregidoPor = undefined;
      }
    }
  }

  calcularPuntaje() {
    if (this.examenSeleccionado) {
      const totalObtenido = this.examenSeleccionado.respuestas.reduce((sum, r) => sum + r.puntosObtenidos, 0);
      this.examenSeleccionado.puntajeObtenido = totalObtenido;
      const divisor = this.examenSeleccionado.puntajeTotal || 0;
      this.examenSeleccionado.porcentaje = divisor > 0
        ? Math.round((totalObtenido / divisor) * 100)
        : 0;
    }
  }

  actualizarPuntos(respuesta: RespuestaEstudiante) {
    if (respuesta.puntosObtenidos > respuesta.puntosPosibles) {
      respuesta.puntosObtenidos = respuesta.puntosPosibles;
    }
    if (respuesta.puntosObtenidos < 0) {
      respuesta.puntosObtenidos = 0;
    }
    this.calcularPuntaje();
  }

  async guardarCorreccion(): Promise<void> {
    if (!this.examenSeleccionado || this.guardando) {
      return;
    }

    this.docenteActualNombre = this.obtenerNombreDocenteActual() || this.docenteActualNombre;
    this.mensajeGuardado = null;
    this.cambiarEstado('corregido');
    this.calcularPuntaje();

    const resumen = {
      estudiante: this.examenSeleccionado.estudianteNombre,
      puntaje: this.examenSeleccionado.puntajeObtenido,
      total: this.examenSeleccionado.puntajeTotal,
      porcentaje: this.examenSeleccionado.porcentaje
    };

    const payload = this.construirPayloadCorreccion(this.examenSeleccionado);
    this.guardando = true;

    try {
      await firstValueFrom(this.intentosService.actualizarEntregaDocente(this.examenSeleccionado.examenAlumnoId, payload));
      this.mensajeGuardado = {
        tipo: 'exito',
        texto: `Corrección guardada para ${resumen.estudiante}. Puntaje ${resumen.puntaje}/${resumen.total} (${resumen.porcentaje}%).`
      };
      await this.cargarIntentosCorreccion();
      this.volverALista();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo guardar la corrección.';
      this.mensajeGuardado = {
        tipo: 'error',
        texto: mensaje
      };
    } finally {
      this.guardando = false;
    }
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en-revision':
        return 'bg-blue-100 text-blue-800';
      case 'corregido':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getEstadoIcono(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return '⏳';
      case 'en-revision':
        return '👁️';
      case 'corregido':
        return '✅';
      default:
        return '📝';
    }
  }

  getTiempoTranscurrido(fecha: Date | string): string {
    const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
    if (Number.isNaN(fechaObj.getTime())) {
      return 'Hace un momento';
    }
    const ahora = new Date();
    const diferencia = ahora.getTime() - fechaObj.getTime();
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (dias > 0) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (minutos > 0) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    return 'Hace un momento';
  }

  getPorcentajeColor(porcentaje: number): string {
    if (porcentaje >= 90) return 'text-green-600';
    if (porcentaje >= 70) return 'text-blue-600';
    if (porcentaje >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }
}
