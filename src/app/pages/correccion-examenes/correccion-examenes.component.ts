import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { IntentosExamenService, IntentoExamen } from '../../services/intentos-examen.service';
import { CursosService } from '../../services/cursos.service';
import { Curso, Examen } from '../../models';

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
}

@Component({
  selector: 'app-correccion-examenes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './correccion-examenes.component.html',
  styleUrls: ['./correccion-examenes.component.css']
})
export class CorreccionExamenesComponent implements OnInit {
  private readonly intentosService = inject(IntentosExamenService);
  private readonly cursosService = inject(CursosService);

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

  private catalogoCursos: { id: string; nombre: string }[] = [];
  private catalogoExamenes: { id: string; titulo: string; cursoId: string; cursoNombre: string }[] = [];
  private cursosMap = new Map<string, { id: string; nombre: string }>();
  private examenesMap = new Map<string, { id: string; titulo: string; cursoId: string; cursoNombre: string }>();

  ngOnInit(): void {
    void this.cargarIntentosCorreccion();
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
  }

  onFiltroExamenChange(nuevoExamenId: string): void {
    this.filtroExamenId = nuevoExamenId;
  }

  private async cargarIntentosCorreccion(forceReload = false): Promise<void> {
    this.cargando = true;
    this.errorCarga = null;

    if (forceReload) {
      this.catalogoCursos = [];
      this.catalogoExamenes = [];
      this.cursosMap.clear();
      this.examenesMap.clear();
    }

    try {
      await this.cargarCatalogos(forceReload);

      const examenesObjetivo = this.obtenerExamenesObjetivo();

      if (!examenesObjetivo.length) {
        this.examenesOriginal = [];
        this.examenes = [];
        this.actualizarFiltrosDisponibles();
        this.examenSeleccionado = null;
        this.vistaActual = 'lista';
        this.cargando = false;
        return;
      }

      const intentosAcumulados: IntentoExamen[] = [];

      for (const examen of examenesObjetivo) {
        if (!this.esUuid(examen.id)) {
          console.warn(`Saltando examen ${examen.id} por no ser un UUID válido.`);
          continue;
        }

        try {
          const intentos = await firstValueFrom(this.intentosService.listarIntentosCorreccion({ examenId: examen.id }));
          const intentosLista = Array.isArray(intentos) ? intentos : [];
          const intentosEnriquecidos = intentosLista.map(intento => this.enriquecerIntento(intento, examen));
          intentosAcumulados.push(...intentosEnriquecidos);
        } catch (error) {
          console.warn(`No se pudieron obtener intentos para el examen ${examen.id}`, error);
        }
      }

      this.examenesOriginal = this.normalizarIntentos(intentosAcumulados);
      this.examenes = this.examenesOriginal;
      this.actualizarFiltrosDisponibles();
      this.examenSeleccionado = null;
      this.vistaActual = 'lista';

      this.errorCarga = null;
    } catch (error) {
      console.error('Error al obtener intentos para corrección:', error);
      this.examenes = [];
      this.examenesOriginal = [];
      this.cursosFiltro = [];
      this.examenesFiltro = [];
      this.filtroCursoId = '';
      this.filtroExamenId = '';
      this.errorCarga = error instanceof Error
        ? error.message
        : 'No se pudieron cargar los exámenes realizados.';
    } finally {
      this.cargando = false;
    }
  }

  get examenesFiltroVisibles(): { id: string; titulo: string; cursoId?: string }[] {
    if (!this.filtroCursoId) {
      return this.examenesFiltro;
    }
    return this.examenesFiltro.filter(examen => examen.cursoId === this.filtroCursoId);
  }

  private actualizarFiltrosDisponibles(): void {
    const cursosMap = new Map<string, string>();
    const examenesMap = new Map<string, { titulo: string; cursoId?: string }>();

    this.examenesOriginal.forEach((examen) => {
      if (examen.cursoId) {
        cursosMap.set(examen.cursoId, examen.cursoNombre);
      }
      if (examen.examenId) {
        examenesMap.set(examen.examenId, {
          titulo: examen.examenTitulo,
          cursoId: examen.cursoId
        });
      }
    });

    this.cursosFiltro = Array.from(cursosMap.entries()).map(([id, nombre]) => ({ id, nombre }));
    this.examenesFiltro = Array.from(examenesMap.entries()).map(([id, datos]) => ({ id, ...datos }));

    this.cursosFiltro.sort((a, b) => a.nombre.localeCompare(b.nombre));
    this.examenesFiltro.sort((a, b) => a.titulo.localeCompare(b.titulo));

    if (this.filtroCursoId && !cursosMap.has(this.filtroCursoId)) {
      this.filtroCursoId = '';
    }

    if (this.filtroExamenId && !examenesMap.has(this.filtroExamenId)) {
      this.filtroExamenId = '';
    }
  }

  private async cargarCatalogos(forceReload: boolean): Promise<void> {
    if (!forceReload && this.catalogoExamenes.length && this.catalogoCursos.length) {
      return;
    }

    this.catalogoCursos = [];
    this.catalogoExamenes = [];
    this.cursosMap.clear();
    this.examenesMap.clear();

    const cursosRespuesta = await firstValueFrom(this.cursosService.getCursos());
    const cursosLista = Array.isArray(cursosRespuesta) ? cursosRespuesta : [];

    for (const curso of cursosLista as (Curso | any)[]) {
      const cursoId = this.obtenerId(
        (curso as any)?.id,
        (curso as any)?._id,
        (curso as any)?.cursoId,
        (curso as any)?.uuid,
        (curso as any)?.codigo,
        (curso as any)?.slug
      );

      if (!cursoId) {
        continue;
      }

      const cursoNombre = this.obtenerTexto(
        (curso as any)?.titulo,
        (curso as any)?.nombre,
        (curso as any)?.descripcion,
        (curso as any)?.cursoNombre
      ) || 'Curso sin título';

      const cursoRegistro = { id: cursoId, nombre: cursoNombre };
      this.cursosMap.set(cursoId, cursoRegistro);
      let examenesRegistrados = false;

      try {
        const cursoDetallado = await firstValueFrom(this.cursosService.getCursoById(cursoId));
        const examenesLista = this.extraerExamenesDeCurso(cursoDetallado);
        examenesRegistrados = this.registrarExamenes(examenesLista, cursoId, cursoNombre);
      } catch (error) {
        console.warn(`No se pudieron obtener exámenes para el curso ${cursoId}`, error);
      }

      if (!examenesRegistrados) {
        const examenesLista = this.extraerExamenesDeCurso(curso);
        this.registrarExamenes(examenesLista, cursoId, cursoNombre);
      }
    }

    this.catalogoCursos = Array.from(this.cursosMap.values());
    this.catalogoExamenes = Array.from(this.examenesMap.values());
  }

  private registrarExamenes(examenesLista: any[], cursoId: string, cursoNombre: string): boolean {
    if (!Array.isArray(examenesLista) || !examenesLista.length) {
      return false;
    }

    let registrado = false;
    for (const examen of examenesLista as (Examen | any)[]) {
      const examenId = this.obtenerId(
        (examen as any)?.id,
        (examen as any)?._id,
        (examen as any)?.examenId,
        (examen as any)?.uuid,
        (examen as any)?.codigo,
        (examen as any)?.slug
      );

      if (!examenId || !this.esUuid(examenId)) {
        continue;
      }

      const examenTitulo = this.obtenerTexto(
        (examen as any)?.titulo,
        (examen as any)?.nombre,
        (examen as any)?.examenTitulo,
        (examen as any)?.descripcionCorta
      ) || 'Examen sin título';

      const examenRegistro = {
        id: examenId,
        titulo: examenTitulo,
        cursoId,
        cursoNombre
      };

      this.examenesMap.set(examenId, examenRegistro);
      registrado = true;
    }

    return registrado;
  }

  private extraerExamenesDeCurso(cursoDetallado: any): any[] {
    if (!cursoDetallado || typeof cursoDetallado !== 'object') {
      return [];
    }

    const clavesPreferidas = ['examenes', 'examenesAsignados', 'examenesLista', 'exams', 'examenesCreados'];
    for (const clave of clavesPreferidas) {
      const valor = cursoDetallado?.[clave];
      if (Array.isArray(valor) && valor.length) {
        return valor;
      }
    }

    const candidatos = Object.values(cursoDetallado).filter((valor) => Array.isArray(valor)) as unknown[];
    for (const candidato of candidatos) {
      if (Array.isArray(candidato) && candidato.some(item => this.esObjetoExamen(item))) {
        return candidato;
      }
    }

    return [];
  }

  private esObjetoExamen(valor: unknown): boolean {
    if (!valor || typeof valor !== 'object') {
      return false;
    }

    const examen = valor as Record<string, unknown>;
    const clavesIndicativas = ['preguntas', 'preguntasLista', 'porcentajeAprobacion', 'intentosPermitidos', 'tipo', 'duracion'];
    return clavesIndicativas.some(clave => clave in examen);
  }

  private obtenerExamenesObjetivo(): { id: string; titulo: string; cursoId: string; cursoNombre: string }[] {
    if (this.filtroExamenId) {
      const examen = this.examenesMap.get(this.filtroExamenId);
      return examen ? [examen] : [];
    }

    if (this.filtroCursoId) {
      return this.catalogoExamenes.filter(examen => examen.cursoId === this.filtroCursoId);
    }

    return this.catalogoExamenes;
  }

  private enriquecerIntento(intento: IntentoExamen, examenInfo: { id: string; titulo: string; cursoId: string; cursoNombre: string }): IntentoExamen {
    const examenAlumnoOriginal: any = intento.examenAlumno || {};
    const cursoReferencia = this.cursosMap.get(examenInfo.cursoId);

    const cursoId = examenAlumnoOriginal?.cursoId || examenInfo.cursoId;
    const cursoNombre = examenAlumnoOriginal?.cursoNombre || cursoReferencia?.nombre || examenInfo.cursoNombre;
    const examenTitulo = examenAlumnoOriginal?.examenTitulo || examenInfo.titulo;

    const cursoFallback = examenAlumnoOriginal?.curso || {
      id: cursoId,
      titulo: cursoNombre,
      nombre: cursoNombre
    };

    const examenFallback = examenAlumnoOriginal?.examen || {
      id: examenInfo.id,
      titulo: examenTitulo,
      curso: {
        id: cursoId,
        titulo: cursoNombre,
        nombre: cursoNombre
      }
    };

    return {
      ...intento,
      examenAlumno: {
        ...examenAlumnoOriginal,
        cursoId,
        cursoNombre,
        curso: cursoFallback,
        examenId: examenAlumnoOriginal?.examenId || examenInfo.id,
        examenTitulo,
        examen: examenFallback
      }
    } as IntentoExamen;
  }

  private esUuid(valor: string | undefined | null): boolean {
    if (!valor) {
      return false;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(valor);
  }

  private normalizarIntentos(intentos: unknown): ExamenEstudiante[] {
    const listaIntentos = this.extraerIntentos(intentos);
    if (!listaIntentos.length) {
      return [];
    }

    return listaIntentos
      .map((intento, index) => this.mapearIntento(intento as IntentoExamen, index + 1))
      .filter((examen): examen is ExamenEstudiante => Boolean(examen));
  }

  private extraerIntentos(respuesta: unknown): any[] {
    if (Array.isArray(respuesta)) {
      return respuesta;
    }

    if (respuesta && typeof respuesta === 'object') {
      const clavesPosibles = ['data', 'items', 'results', 'content', 'records'];
      for (const clave of clavesPosibles) {
        const valor = (respuesta as Record<string, unknown>)[clave];
        const lista = this.extraerIntentos(valor);
        if (lista.length) {
          return lista;
        }
      }

      const valores = Object.values(respuesta as Record<string, unknown>);
      for (const valor of valores) {
        const lista = this.extraerIntentos(valor);
        if (lista.length) {
          return lista;
        }
      }
    }

    return [];
  }

  private mapearIntento(intento: IntentoExamen, fallbackNumero: number): ExamenEstudiante | null {
    const datosAdjunto = this.decodificarArchivoAdjunto((intento as any)?.archivoAdjunto);
    const examenAlumno = intento.examenAlumno || datosAdjunto?.examenAlumno || {};
    const examen = examenAlumno?.examen || datosAdjunto?.examen || datosAdjunto?.examenAlumno?.examen || {};
    const alumno = examenAlumno?.alumno || examenAlumno?.student || datosAdjunto?.alumno || {};
    const curso = examenAlumno?.curso || examenAlumno?.cursoAsignado || datosAdjunto?.curso || examen?.curso || {};

    const estudianteId = this.obtenerTexto(alumno?.id, alumno?.alumnoId, examenAlumno?.alumnoId, datosAdjunto?.alumnoId) || intento.id;
    const estudianteNombre = this.obtenerTexto(alumno?.nombreCompleto, alumno?.nombre, alumno?.nombres, alumno?.displayName);
    const estudianteEmail = this.obtenerTexto(alumno?.email, alumno?.correo, alumno?.correoElectronico, alumno?.username);
    const cursoNombre = this.obtenerTexto(curso?.titulo, curso?.nombre, examenAlumno?.cursoNombre, examen?.cursoNombre) || 'Curso sin nombre';
    const examenTitulo = this.obtenerTexto(examen?.titulo, examenAlumno?.examenTitulo, examenAlumno?.titulo, datosAdjunto?.examenTitulo) || 'Examen sin título';
    const cursoId = this.obtenerId(curso?.id, curso?.cursoId, examenAlumno?.cursoId, datosAdjunto?.cursoId);
    const examenId = this.obtenerId(examen?.id, examenAlumno?.examenId, datosAdjunto?.examenId, (intento as any)?.examenId);

    const respuestasBrutas = Array.isArray(intento.respuestas) && intento.respuestas.length
      ? intento.respuestas
      : Array.isArray(datosAdjunto?.respuestas) ? datosAdjunto.respuestas : [];
    const preguntas = this.obtenerPreguntas(examen);
    const respuestas = this.normalizarRespuestas(respuestasBrutas, preguntas);

    const puntajeTotalRaw = this.obtenerNumero(
      examen?.puntosTotales,
      examenAlumno?.puntosTotales,
      datosAdjunto?.puntosTotales,
      this.calcularPuntosTotales(preguntas)
    );
    const puntajeTotal = puntajeTotalRaw > 0 ? puntajeTotalRaw : 0;

    const puntajeObtenidoRaw = this.obtenerNumero(
      intento.calificacion,
      examenAlumno?.calificacion,
      datosAdjunto?.calificacion
    );
    const puntajeObtenido = puntajeObtenidoRaw > 0 ? puntajeObtenidoRaw : 0;
    const porcentaje = puntajeTotal > 0 ? Math.round((puntajeObtenido / puntajeTotal) * 100) : 0;

    const fechaEntrega = intento.fechaEntrega || datosAdjunto?.fechaEntrega || intento.updatedAt || intento.createdAt;
    const tiempoEmpleado = Math.max(0, this.normalizarTiempoEmpleado(
      this.obtenerNumero(intento.tiempoEmpleado, datosAdjunto?.tiempoEmpleado, examenAlumno?.tiempoEmpleado)
    ));

    const numeroIntento = this.obtenerNumero(intento.numeroIntento, examenAlumno?.numeroIntento, datosAdjunto?.numeroIntento) || fallbackNumero;
    const estadoDocente = this.traducirEstado(intento.estado);
    const retroalimentacion = this.obtenerTexto(intento.retroalimentacion, datosAdjunto?.retroalimentacion, examenAlumno?.retroalimentacion) || '';
    const corregidoPor = this.obtenerTexto((intento as any)?.calificadoPor, datosAdjunto?.corregidoPor, examenAlumno?.corregidoPor) || undefined;
    const fechaCorreccion = estadoDocente === 'corregido'
      ? this.parseFecha(intento.updatedAt || datosAdjunto?.fechaCorreccion)
      : undefined;

    if (!estudianteNombre && !estudianteEmail && !cursoNombre && !examenTitulo) {
      return null;
    }

    return {
      id: intento.id,
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
      fechaCorreccion
    };
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

      const opciones = this.obtenerOpcionesPregunta(preguntaData);
      const valorOriginal = respuesta?.respuesta ?? respuesta?.valor ?? respuesta;
      let respuestaEstudiante = this.formatearValorRespuesta(valorOriginal);

      if (typeof valorOriginal === 'number' && opciones[valorOriginal]) {
        respuestaEstudiante = opciones[valorOriginal];
      } else if (typeof valorOriginal === 'string' && opciones.length) {
        const numIndice = Number(valorOriginal);
        if (!Number.isNaN(numIndice) && opciones[numIndice]) {
          respuestaEstudiante = opciones[numIndice];
        }
      }

      const indiceCorrecto = this.obtenerIndiceCorrecto(preguntaData);
      const respuestaCorrecta = this.obtenerTextoCorrecto(preguntaData, opciones, indiceCorrecto);
      const esCorrecta = this.compararRespuestas(respuestaEstudiante, respuestaCorrecta, opciones, indiceCorrecto);

      const puntosPosibles = this.obtenerNumero(
        preguntaData?.puntos,
        preguntaData?.puntaje,
        preguntaData?.valor,
        preguntaData?.puntosPosibles
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
          preguntaData?.pregunta
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

  private obtenerNumero(...valores: unknown[]): number {
    for (const valor of valores) {
      if (valor === null || valor === undefined || valor === '') {
        continue;
      }
      const numero = Number(valor);
      if (!Number.isNaN(numero)) {
        return numero;
      }
    }
    return 0;
  }

  private obtenerTexto(...valores: unknown[]): string {
    for (const valor of valores) {
      if (typeof valor === 'string' && valor.trim()) {
        return valor.trim();
      }
    }
    return '';
  }

  private obtenerId(...valores: unknown[]): string {
    for (const valor of valores) {
      if (typeof valor === 'string' && valor.trim()) {
        return valor.trim();
      }
      if (typeof valor === 'number' && Number.isFinite(valor)) {
        return String(valor);
      }
    }
    return '';
  }

  private formatearValorRespuesta(valor: any): string {
    if (Array.isArray(valor)) {
      return valor.map(item => String(item)).join(', ');
    }
    if (valor === null || valor === undefined) {
      return '';
    }
    return String(valor);
  }

  private traducirEstado(estado?: string): 'pendiente' | 'en-revision' | 'corregido' {
    switch ((estado || '').toLowerCase()) {
      case 'calificado':
      case 'corregido':
        return 'corregido';
      case 'en-progreso':
      case 'en_revision':
      case 'en-revision':
        return 'en-revision';
      default:
        return 'pendiente';
    }
  }

  private parseFecha(valor?: string | Date): Date {
    if (!valor) {
      return new Date();
    }
    if (valor instanceof Date) {
      return valor;
    }
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? new Date() : fecha;
  }

  private normalizarTiempoEmpleado(valor?: number): number {
    if (!valor || Number.isNaN(valor)) {
      return 0;
    }

    if (valor > 300) {
      return Math.max(1, Math.round(valor / 60));
    }

    return Math.round(valor);
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
        pregunta?.puntosPosibles
      );
      return total + (puntos || 0);
    }, 0);
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
    return {
      total: dataset.length,
      pendientes: dataset.filter(e => e.estado === 'pendiente').length,
      enRevision: dataset.filter(e => e.estado === 'en-revision').length,
      corregidos: dataset.filter(e => e.estado === 'corregido').length
    };
  }

  seleccionarExamen(examen: ExamenEstudiante) {
    this.examenSeleccionado = examen;
    this.vistaActual = 'detalle';
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
        this.examenSeleccionado.corregidoPor = 'Instructor Actual'; // Aquí iría el usuario logueado
        this.calcularPuntaje();
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

  guardarCorreccion() {
    if (this.examenSeleccionado) {
      this.cambiarEstado('corregido');
      alert(`✅ Examen de ${this.examenSeleccionado.estudianteNombre} corregido exitosamente\n📊 Puntaje: ${this.examenSeleccionado.puntajeObtenido}/${this.examenSeleccionado.puntajeTotal} (${this.examenSeleccionado.porcentaje}%)`);
      this.volverALista();
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
