import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, take, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TareasService } from '../../services/tareas.service';
import { CursosService } from '../../services/cursos.service';
import { AuthService } from '../../services/auth.service';
import { AsignacionesService } from '../../services/asignaciones.service';
import { Curso, AsignacionCurso } from '../../models';
import Swal from 'sweetalert2';

interface Tarea {
  id: string;
  tareaId?: string;
  tareaAlumnoId?: string;
  asignada?: boolean;
  titulo: string;
  descripcion: string;
  curso: string;
  cursoId?: string;
  profesor?: string;
  fechaEntrega: Date;
  fechaAsignacion: Date;
  estado: 'pendiente' | 'en-progreso' | 'completada' | 'vencida';
  calificacion?: number;
  archivoEntregado?: string;
  comentarioProfesor?: string;
  puntosPosibles: number;
  prioridad: 'alta' | 'media' | 'baja';
}

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tareas.component.html',
  styleUrls: ['./tareas.component.css']
})
export class TareasComponent implements OnInit {
  private readonly tareasService = inject(TareasService);
  private readonly cursosService = inject(CursosService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly asignacionesService = inject(AsignacionesService);
  private readonly destroyRef = inject(DestroyRef);

  tareas: Tarea[] = [];
  cargandoTareas = true;
  errorCarga = false;
  alumnoId: string | null = null;
  private asignaciones: AsignacionCurso[] = [];
  private cursosAsignados = new Map<string, Curso>();

  ngOnInit() {
    this.cargarTareas();
  }

  cargarTareas() {
    this.cargandoTareas = true;
    this.errorCarga = false;

    try {
      this.alumnoId = this.authService.getCurrentUserId();
    } catch (error) {
      console.warn('No se pudo determinar el alumno autenticado.', error);
      this.errorCarga = true;
      this.cargandoTareas = false;
      this.cdr.detectChanges();
      return;
    }

    this.asignacionesService
      .getAsignacionesPorAlumno(this.alumnoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: asignaciones => {
          this.asignaciones = asignaciones;
          this.procesarAsignaciones();
        },
        error: error => {
          console.error('Error al obtener asignaciones del alumno:', error);
          this.errorCarga = true;
          this.cargandoTareas = false;
          this.cdr.detectChanges();
        }
      });
  }

  filtroActivo: 'todas' | 'pendiente' | 'en-progreso' | 'completada' | 'vencida' = 'todas';
  tareaSeleccionada: Tarea | null = null;
  archivoSubir: File | null = null;
  nombreArchivo: string = '';
  modoModal: 'entregar' | 'ver' = 'entregar';
  detalleEntrega: any = null;

  get tareasFiltradas(): Tarea[] {
    if (this.filtroActivo === 'todas') {
      return this.tareas;
    }
    return this.tareas.filter(t => t.estado === this.filtroActivo);
  }

  get tareasPendientes(): number {
    return this.tareas.filter(t => t.estado === 'pendiente').length;
  }

  get tareasEntregadas(): number {
    return this.tareas.filter(t => t.estado === 'en-progreso' || t.estado === 'completada').length;
  }

  get tareasRetrasadas(): number {
    return this.tareas.filter(t => t.estado === 'vencida').length;
  }

  get promedioCalificaciones(): number {
    const calificadas = this.tareas.filter(t => t.calificacion !== undefined);
    if (calificadas.length === 0) return 0;
    const suma = calificadas.reduce((acc, t) => acc + (t.calificacion || 0), 0);
    return Math.round(suma / calificadas.length);
  }

  filtrar(filtro: 'todas' | 'pendiente' | 'en-progreso' | 'completada' | 'vencida') {
    this.filtroActivo = filtro;
  }

  abrirTarea(tarea: Tarea) {
    this.modoModal = 'entregar';
    this.tareaSeleccionada = tarea;
    this.archivoSubir = null;
    this.nombreArchivo = '';
    this.detalleEntrega = null;
  }

  verDetalle(tarea: Tarea) {
    console.log('🚀 [verDetalle] INICIANDO - Abriendo modal en modo VER');
    
    this.modoModal = 'ver';
    this.tareaSeleccionada = tarea;
    this.archivoSubir = null;
    this.nombreArchivo = '';
    
    console.log('🔍 [verDetalle] Estado inicial:', {
      modoModal: this.modoModal,
      tareaSeleccionada: this.tareaSeleccionada?.titulo
    });
    
    // Intentar obtener el tareaAlumnoId de diferentes fuentes
    const tareaAlumnoId = tarea.tareaAlumnoId || tarea.id;
    
    console.log('🔍 [verDetalle] Intentando cargar entrega:', {
      tareaAlumnoId,
      asignada: tarea.asignada,
      titulo: tarea.titulo
    });
    
    if (!tareaAlumnoId) {
      console.warn('⚠️ [verDetalle] No hay tareaAlumnoId disponible');
      Swal.fire({
        icon: 'info',
        title: 'Entrega no disponible',
        text: 'Aún no existe un registro de entrega para esta tarea.'
      });
      return;
    }

    // Obtener detalles completos de la entrega desde el backend
    // Intentamos cargar sin importar el flag 'asignada' porque puede estar mal seteado
    this.tareasService.getDetalleEntrega(tareaAlumnoId).subscribe({
      next: (detalle) => {
        console.log('✅ [verDetalle] Detalle de entrega cargado:', detalle);
        this.detalleEntrega = detalle;
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        
        console.log('🔍 [verDetalle] Estado después de asignar:', {
          detalleEntrega: this.detalleEntrega,
          modoModal: this.modoModal,
          tareaSeleccionada: this.tareaSeleccionada
        });
        
        // Si se cargó correctamente, actualizar el flag asignada
        if (detalle) {
          tarea.asignada = true;
        }
      },
      error: (error) => {
        console.error('❌ [verDetalle] Error al cargar detalle:', error);
        console.log('🔍 [verDetalle] Detalles del error:', {
          status: error.status,
          message: error.message,
          url: error.url
        });
        
        // Si el error es 404, significa que no hay entrega aún
        if (error.status === 404) {
          Swal.fire({
            icon: 'info',
            title: 'Sin entrega',
            text: 'Aún no has entregado esta tarea. Haz clic en "Entregar" para subir tu trabajo.'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al cargar entrega',
            html: `No se pudo cargar el detalle de la entrega.<br><br><small>Error: ${error.status || 'desconocido'} - ${error.message || 'Sin detalles'}</small>`,
            confirmButtonText: 'Entendido'
          });
        }
      }
    });
  }

  cerrarModal() {
    this.tareaSeleccionada = null;
    this.archivoSubir = null;
    this.nombreArchivo = '';
    this.detalleEntrega = null;
    this.modoModal = 'entregar';
  }

  descargarArchivo() {
    if (!this.detalleEntrega?.archivoAdjunto) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin archivo',
        text: 'No hay archivo adjunto para descargar'
      });
      return;
    }

    try {
      // Crear link de descarga desde Base64
      const link = document.createElement('a');
      link.href = this.detalleEntrega.archivoAdjunto;
      
      // Extraer extensión del MIME type
      const mimeMatch = this.detalleEntrega.archivoAdjunto.match(/^data:(.+?);base64,/);
      let extension = 'bin';
      if (mimeMatch && mimeMatch[1]) {
        const mimeType = mimeMatch[1];
        const extensiones: { [key: string]: string } = {
          'application/pdf': 'pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/gif': 'gif',
          'text/plain': 'txt',
          'application/zip': 'zip'
        };
        extension = extensiones[mimeType] || 'bin';
      }
      
      link.download = `${this.tareaSeleccionada?.titulo.replace(/\s+/g, '_')}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      Swal.fire({
        icon: 'success',
        title: 'Descargando...',
        text: 'El archivo se está descargando',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('❌ Error al descargar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo descargar el archivo'
      });
    }
  }

  reenviarTarea() {
    // Cambiar al modo de entrega para permitir subir un nuevo archivo
    this.modoModal = 'entregar';
    this.archivoSubir = null;
    this.nombreArchivo = '';
    
    console.log('🔄 [reenviarTarea] Cambiando a modo entrega para actualizar archivo');
    console.log('🔄 [reenviarTarea] Tarea:', {
      id: this.tareaSeleccionada?.id,
      tareaAlumnoId: this.tareaSeleccionada?.tareaAlumnoId,
      archivoActual: this.tareaSeleccionada?.archivoEntregado
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSubir = file;
      this.nombreArchivo = file.name;
    }
  }

  entregarTarea() {
    if (this.tareaSeleccionada && this.archivoSubir) {
      // Validar tamaño del archivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (this.archivoSubir.size > maxSize) {
        Swal.fire({
          icon: 'warning',
          title: 'Archivo muy grande',
          text: `El archivo no debe superar los 5MB. Tu archivo tiene ${(this.archivoSubir.size / 1024 / 1024).toFixed(2)}MB.`,
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      this.cargandoTareas = true; // Mostrar loading durante el proceso
      
      this.asegurarAsignacionTarea(this.tareaSeleccionada)
        .pipe(take(1))
        .subscribe({
          next: tareaAlumnoId => {
            this.tareasService.uploadArchivo(this.archivoSubir!).subscribe({
              next: (uploadResponse) => {
                this.tareasService.entregarTarea(
                  tareaAlumnoId,
                  uploadResponse.url,
                  ''
                ).subscribe({
                  next: (response) => {
                    console.log('✅ Tarea entregada:', response);
                    this.tareaSeleccionada!.tareaAlumnoId = tareaAlumnoId;
                    this.tareaSeleccionada!.id = tareaAlumnoId;
                    this.tareaSeleccionada!.asignada = true;
                    this.cerrarModal();
                    Swal.fire({
                      icon: 'success',
                      title: '¡Tarea entregada!',
                      text: 'Tu tarea ha sido entregada exitosamente.',
                      timer: 2000,
                      showConfirmButton: false
                    });
                    this.cargarTareas();
                  },
                  error: (error) => {
                    console.error('❌ Error al entregar tarea:', error);
                    this.cargandoTareas = false;

                    let errorMsg = 'No se pudo entregar la tarea. Por favor, intenta nuevamente.';
                    if (error.message?.includes('too large')) {
                      errorMsg = 'El archivo es demasiado grande. Por favor, usa un archivo más pequeño (máximo 5MB).';
                    }

                    Swal.fire({
                      icon: 'error',
                      title: 'Error al entregar',
                      text: errorMsg,
                      confirmButtonColor: '#3085d6'
                    });
                  }
                });
              },
              error: (error) => {
                console.error('❌ Error al procesar archivo:', error);
                this.cargandoTareas = false;
                Swal.fire({
                  icon: 'error',
                  title: 'Error al procesar archivo',
                  text: 'No se pudo procesar el archivo. Intenta con un archivo más pequeño.',
                  confirmButtonColor: '#3085d6'
                });
              }
            });
          },
          error: error => {
            console.error('❌ Error al preparar la asignación de la tarea:', error);
            this.cargandoTareas = false;
            Swal.fire({
              icon: 'error',
              title: 'No se pudo preparar la entrega',
              text: error?.message || 'No se pudo crear la asignación de la tarea para este alumno.',
              confirmButtonColor: '#3085d6'
            });
          }
        });
    }
  }

  getDiasRestantes(fecha: Date): number {
    const hoy = new Date();
    const diferencia = fecha.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
  }
  /**
   * Extrae información del archivo Base64 sin guardar todo el contenido
   */
  extraerInfoArchivo(base64: string): string {
    if (!base64 || base64.length === 0) return '';
    
    // Extraer el tipo MIME del Base64
    const match = base64.match(/^data:(.+?);base64,/);
    if (match && match[1]) {
      const mimeType = match[1];
      
      // Mapear tipos MIME a nombres legibles
      const tiposArchivo: { [key: string]: string } = {
        'application/pdf': 'Archivo PDF',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Documento Word',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Hoja de Excel',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Presentación PowerPoint',
        'application/msword': 'Documento Word',
        'application/vnd.ms-excel': 'Hoja de Excel',
        'application/vnd.ms-powerpoint': 'Presentación PowerPoint',
        'image/jpeg': 'Imagen JPEG',
        'image/jpg': 'Imagen JPG',
        'image/png': 'Imagen PNG',
        'image/gif': 'Imagen GIF',
        'text/plain': 'Archivo de texto',
        'application/zip': 'Archivo ZIP',
        'application/x-rar-compressed': 'Archivo RAR'
      };
      
      return tiposArchivo[mimeType] || 'Archivo adjunto';
    }
    
    return 'Archivo adjunto';
  }
  getColorEstado(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'en-progreso': return 'bg-blue-100 text-blue-800';
      case 'completada': return 'bg-green-100 text-green-800';
      case 'vencida': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getColorPrioridad(prioridad: string): string {
    switch (prioridad) {
      case 'alta': return 'border-red-500 bg-red-50';
      case 'media': return 'border-yellow-500 bg-yellow-50';
      case 'baja': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  }

  getTextoEstado(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'en-progreso': return 'En Progreso';
      case 'completada': return 'Completada';
      case 'vencida': return 'Vencida';
      default: return estado;
    }
  }

  private procesarAsignaciones(): void {
    const cursoIds = Array.from(new Set(
      this.asignaciones
        .map(asignacion => asignacion.cursoId)
        .filter((id): id is string => Boolean(id))
        .map(id => String(id))
    ));

    console.log('🧾 Cursos asignados detectados', {
      totalAsignaciones: this.asignaciones.length,
      cursoIds
    });

    if (!cursoIds.length) {
      this.tareas = [];
      this.cursosAsignados.clear();
      this.cargandoTareas = false;
      this.cdr.detectChanges();
      return;
    }

    this.cursosService
      .getCursos()
      .pipe(take(1))
      .subscribe({
        next: cursos => {
          this.actualizarCursosAsignados(cursos, cursoIds);
          this.cargarTareasPorCursos(cursoIds);
        },
        error: error => {
          console.error('Error al obtener cursos desde el backend:', error);
          this.actualizarCursosFallback(cursoIds);
          this.cargarTareasPorCursos(cursoIds);
        }
      });
  }

  private actualizarCursosAsignados(cursos: Curso[], cursoIds: string[]): void {
    this.cursosAsignados.clear();
    const idsRequeridos = new Set(cursoIds);

    cursos.forEach(curso => {
      const id = curso?.id ? String(curso.id) : null;
      if (id && idsRequeridos.has(id)) {
        this.cursosAsignados.set(id, curso);
      }
    });

    this.completarCursosConMetadatos(cursoIds);
  }

  private actualizarCursosFallback(cursoIds: string[]): void {
    this.cursosAsignados.clear();
    this.completarCursosConMetadatos(cursoIds);
  }

  private completarCursosConMetadatos(cursoIds: string[]): void {
    cursoIds.forEach(id => {
      if (this.cursosAsignados.has(id)) {
        return;
      }
      const asignacion = this.asignaciones.find(item => item.cursoId === id);
      const curso = this.crearCursoDesdeAsignacion(asignacion);
      this.cursosAsignados.set(id, curso);
    });
  }

  private crearCursoDesdeAsignacion(asignacion?: AsignacionCurso): Curso {
    const cursoMetadata = asignacion?.curso ?? {};
    const id = asignacion?.cursoId ?? cursoMetadata?.id ?? this.generarIdLocal('curso');
    return {
      id: String(id),
      titulo: cursoMetadata.titulo || `Curso ${id}`,
      descripcion: '',
      instructor: cursoMetadata.instructor || 'Docente',
      nivel: 'Intermedio',
      imagen: cursoMetadata.imagen || '',
      categoria: cursoMetadata.categoria || 'General',
      estudiantes: undefined,
      duracionTotal: undefined,
      unidades: [],
      tareas: [],
      examenes: []
    };
  }

  private cargarTareasPorCursos(cursoIds: string[]): void {
    if (!this.alumnoId) {
      this.tareas = [];
      this.cargandoTareas = false;
      this.cdr.detectChanges();
      return;
    }

    console.log('📚 Cargando tareas por curso', {
      alumnoId: this.alumnoId,
      cursos: cursoIds
    });

    const tareasObservables = cursoIds.map(cursoId =>
      forkJoin({
        catalogo: this.tareasService.getTareasByCurso(cursoId).pipe(
          catchError(error => {
            const curso = this.cursosAsignados.get(cursoId);
            console.error(`Error al cargar catálogo de tareas del curso ${curso?.titulo || cursoId}:`, error);
            return of([]);
          })
        ),
        asignaciones: this.tareasService.getTareasAlumnoByCurso(cursoId, this.alumnoId!).pipe(
          catchError(error => {
            const curso = this.cursosAsignados.get(cursoId);
            console.error(`Error al cargar asignaciones de tareas del curso ${curso?.titulo || cursoId}:`, error);
            return of([]);
          })
        )
      })
    );

    forkJoin(tareasObservables).subscribe({
      next: tareasPorCurso => {
        const tareasCompiladas: Tarea[] = [];

        tareasPorCurso.forEach((resultadoCurso, index) => {
          const cursoId = cursoIds[index];
          const curso = this.cursosAsignados.get(cursoId);
          const tituloCurso = curso?.titulo || `Curso ${cursoId}`;
          const instructor = curso?.instructor || 'Docente';

          const catalogo = Array.isArray(resultadoCurso?.catalogo) ? resultadoCurso.catalogo : [];
          const asignaciones = Array.isArray(resultadoCurso?.asignaciones) ? resultadoCurso.asignaciones : [];

          console.log('📄 Resultado de tareas recibidas', {
            cursoId,
            tituloCurso,
            totalCatalogo: catalogo.length,
            totalAsignaciones: asignaciones.length
          });

          const mapaAsignaciones = this.crearMapaAsignaciones(asignaciones);

          catalogo.forEach((tareaBackend: any) => {
            const claveCatalogo = this.extraerIdTareaCatalogo(tareaBackend);
            const asignacionAlumno = claveCatalogo ? mapaAsignaciones.get(claveCatalogo) : undefined;

            const tareaNormalizada = this.normalizarTareaCatalogo(
              tareaBackend,
              {
                cursoId,
                tituloCurso,
                instructor
              },
              asignacionAlumno
            );

            if (tareaNormalizada) {
              tareasCompiladas.push(tareaNormalizada);
            }
          });

          // Incluir asignaciones huérfanas que no estén en el catálogo actual
          asignaciones.forEach((registro: any) => {
            const claveAsignacion = this.extraerIdTareaAsignacion(registro);
            if (!claveAsignacion) {
              return;
            }

            const yaIncluida = catalogo.some(tareaCatalogo => this.extraerIdTareaCatalogo(tareaCatalogo) === claveAsignacion);
            if (!yaIncluida) {
              const tareaNormalizada = this.normalizarAsignacionSinCatalogo(
                registro,
                {
                  cursoId,
                  tituloCurso,
                  instructor
                }
              );
              if (tareaNormalizada) {
                tareasCompiladas.push(tareaNormalizada);
              }
            }
          });
        });

        this.tareas = tareasCompiladas.sort((a, b) => a.fechaEntrega.getTime() - b.fechaEntrega.getTime());
        console.log(`✅ Total de tareas cargadas: ${this.tareas.length}`);
        this.cargandoTareas = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error al procesar tareas asignadas:', error);
        this.errorCarga = true;
        this.cargandoTareas = false;
        this.cdr.detectChanges();
      }
    });
  }

  private crearMapaAsignaciones(asignaciones: any[]): Map<string, any> {
    const mapa = new Map<string, any>();

    asignaciones.forEach(registro => {
      const clave = this.extraerIdTareaAsignacion(registro);
      if (clave) {
        mapa.set(clave, registro);
      }
    });

    return mapa;
  }

  private extraerIdTareaCatalogo(tareaBackend: any): string | null {
    if (!tareaBackend) {
      return null;
    }

    const posiblesIds = [
      tareaBackend.id,
      tareaBackend.tareaId,
      tareaBackend.tarea?.id,
      tareaBackend.tarea?.tareaId
    ];

    const idValido = posiblesIds.find(valor => typeof valor === 'string' || typeof valor === 'number');
    return idValido !== undefined && idValido !== null ? String(idValido) : null;
  }

  private extraerIdTareaAsignacion(asignacion: any): string | null {
    if (!asignacion) {
      return null;
    }

    const posiblesIds = [
      asignacion.tarea?.id,
      asignacion.tareaId,
      asignacion.idTarea,
      asignacion.tarea?.tareaId,
      asignacion.idTareaAsignada
    ];

    const idValido = posiblesIds.find(valor => typeof valor === 'string' || typeof valor === 'number');
    return idValido !== undefined && idValido !== null ? String(idValido) : null;
  }

  private normalizarTareaCatalogo(
    tareaBackend: any,
    contexto: { cursoId: string; tituloCurso: string; instructor: string },
    asignacionAlumno?: any
  ): Tarea | null {
    if (!tareaBackend) {
      return null;
    }

    const tareaId = this.extraerIdTareaCatalogo(tareaBackend);
    if (!tareaId) {
      return null;
    }

    const tareaAlumnoId = asignacionAlumno?.id || asignacionAlumno?.tareaAlumnoId || asignacionAlumno?.tareaAsignadaId;
    const fechaEntrega = this.parsearFecha(tareaBackend?.fechaEntrega);
    const fechaAsignacion = this.parsearFecha(
      asignacionAlumno?.fechaAsignacion || tareaBackend?.fechaAsignacion || tareaBackend?.fechaCreacion
    );
    
    // Determinar si la tarea está asignada/entregada
    const tieneArchivoAdjunto = Boolean(asignacionAlumno?.archivoAdjunto || tareaBackend?.archivoAdjunto);
    const estadoBackend = asignacionAlumno?.estado || tareaBackend?.estado;
    const tieneEstadoEntregado = ['en-progreso', 'en_progreso', 'completada', 'calificada'].includes(
      (estadoBackend || '').toLowerCase()
    );
    const estaAsignada = Boolean(tareaAlumnoId) || tieneArchivoAdjunto || tieneEstadoEntregado;
    
    const estadoNormalizado = this.normalizarEstadoTarea(estadoBackend, fechaEntrega, estaAsignada);
    const archivoAdjunto = asignacionAlumno?.archivoAdjunto || tareaBackend?.archivoAdjunto;

    return {
      id: tareaAlumnoId || tareaId,
      tareaId: tareaId,
      tareaAlumnoId: tareaAlumnoId || undefined,
      asignada: estaAsignada,
      titulo: tareaBackend?.titulo || 'Tarea sin título',
      descripcion: tareaBackend?.descripcion || 'Sin descripción',
      curso: contexto.tituloCurso,
      cursoId: contexto.cursoId,
      profesor: contexto.instructor,
      fechaEntrega,
      fechaAsignacion,
      estado: estadoNormalizado,
      calificacion: asignacionAlumno?.calificacion ?? tareaBackend?.calificacion,
      archivoEntregado: archivoAdjunto ? this.extraerInfoArchivo(archivoAdjunto) || undefined : undefined,
      comentarioProfesor: asignacionAlumno?.retroalimentacion || tareaBackend?.retroalimentacion,
      puntosPosibles: tareaBackend?.puntosPosibles ?? tareaBackend?.puntajeMaximo ?? 0,
      prioridad: this.normalizarPrioridad(tareaBackend?.prioridad)
    };
  }

  private normalizarAsignacionSinCatalogo(
    asignacion: any,
    contexto: { cursoId: string; tituloCurso: string; instructor: string }
  ): Tarea | null {
    if (!asignacion) {
      return null;
    }

    const tareaInfo = asignacion.tarea || {};
    const tareaId = this.extraerIdTareaAsignacion(asignacion) || tareaInfo?.id;
    const tareaAlumnoId = asignacion.id || asignacion.tareaAlumnoId || asignacion.tareaAsignadaId;

    if (!tareaAlumnoId) {
      return null;
    }

    const fechaEntrega = this.parsearFecha(tareaInfo?.fechaEntrega || asignacion.fechaEntrega);
    const fechaAsignacion = this.parsearFecha(asignacion.fechaAsignacion || tareaInfo?.fechaAsignacion);
    const estadoNormalizado = this.normalizarEstadoTarea(asignacion.estado, fechaEntrega, true);
    const archivoAdjunto = asignacion.archivoAdjunto || tareaInfo?.archivoAdjunto;

    return {
      id: String(tareaAlumnoId),
      tareaId: tareaId ? String(tareaId) : undefined,
      tareaAlumnoId: String(tareaAlumnoId),
      asignada: true,
      titulo: tareaInfo?.titulo || 'Tarea asignada',
      descripcion: tareaInfo?.descripcion || 'Sin descripción disponible',
      curso: contexto.tituloCurso,
      cursoId: contexto.cursoId,
      profesor: contexto.instructor,
      fechaEntrega,
      fechaAsignacion,
      estado: estadoNormalizado,
      calificacion: asignacion.calificacion ?? tareaInfo?.calificacion,
      archivoEntregado: archivoAdjunto ? this.extraerInfoArchivo(archivoAdjunto) || undefined : undefined,
      comentarioProfesor: asignacion.retroalimentacion || tareaInfo?.retroalimentacion,
      puntosPosibles: tareaInfo?.puntosPosibles ?? tareaInfo?.puntajeMaximo ?? 0,
      prioridad: this.normalizarPrioridad(tareaInfo?.prioridad)
    };
  }

  private parsearFecha(valor: string | Date | undefined): Date {
    if (!valor) {
      return new Date();
    }
    const fecha = valor instanceof Date ? valor : new Date(valor);
    return isNaN(fecha.getTime()) ? new Date() : fecha;
  }

  private normalizarEstadoTarea(
    estado: string | undefined,
    fechaEntrega: Date,
    asignada: boolean
  ): 'pendiente' | 'en-progreso' | 'completada' | 'vencida' {
    const estadoLimpio = (estado || '').toLowerCase().replace(/_/g, '-');
    const estadosValidos: Array<'pendiente' | 'en-progreso' | 'completada' | 'vencida'> = [
      'pendiente',
      'en-progreso',
      'completada',
      'vencida'
    ];

    if (estadosValidos.includes(estadoLimpio as any)) {
      return estadoLimpio as typeof estadosValidos[number];
    }

    if (!asignada) {
      return 'pendiente';
    }

    const ahora = Date.now();
    if (fechaEntrega.getTime() < ahora) {
      return 'vencida';
    }
    return 'pendiente';
  }

  private normalizarPrioridad(prioridad: string | undefined): 'alta' | 'media' | 'baja' {
    const valor = (prioridad || '').toLowerCase();
    if (valor === 'alta' || valor === 'media' || valor === 'baja') {
      return valor;
    }
    return 'media';
  }

  private asegurarAsignacionTarea(tarea: Tarea): Observable<string> {
    if (tarea.tareaAlumnoId) {
      return of(tarea.tareaAlumnoId);
    }

    if (!this.alumnoId) {
      return throwError(() => new Error('No se pudo identificar al alumno autenticado.'));
    }

    const tareaId = tarea.tareaId || tarea.id;
    if (!tareaId) {
      return throwError(() => new Error('La tarea no cuenta con un identificador válido para generar la asignación.'));
    }

    const tareaIdString = String(tareaId);
    const cursoId = tarea.cursoId;

    console.log('🧩 Creando asignación de tarea para el alumno', {
      cursoId: tarea.cursoId,
      tareaId,
      alumnoId: this.alumnoId
    });

    return this.tareasService.asignarTarea(tareaId, this.alumnoId).pipe(
      map((respuesta: any) => {
        const asignacion = respuesta?.tareaAlumno || respuesta?.data || respuesta;
        const tareaAlumnoId = asignacion?.id || asignacion?.tareaAlumnoId || asignacion?.tareaAsignadaId || respuesta?.id;

        if (!tareaAlumnoId) {
          throw new Error('El backend no devolvió el identificador de la asignación.');
        }

        const idString = String(tareaAlumnoId);
        tarea.tareaAlumnoId = idString;
        tarea.id = idString;
        tarea.asignada = true;
        return idString;
      }),
      catchError(error => {
        if ((error?.status === 409 || error?.status === 400) && cursoId) {
          console.warn('Asignación existente detectada, recuperando identificador desde el backend.', error);
          return this.tareasService.getTareasAlumnoByCurso(cursoId, this.alumnoId!).pipe(
            map((registros: any[]) => {
              const registro = (registros || []).find((item: any) => {
                const registroId = this.extraerIdTareaAsignacion(item);
                return registroId === tareaIdString;
              }) || (registros || []).find((item: any) => String(item?.tareaId || item?.tarea?.id) === tareaIdString);

              const tareaAlumnoIdExistente = registro?.id || registro?.tareaAlumnoId || registro?.tareaAsignadaId;
              if (!tareaAlumnoIdExistente) {
                throw error;
              }

              const idString = String(tareaAlumnoIdExistente);
              tarea.tareaAlumnoId = idString;
              tarea.id = idString;
              tarea.asignada = true;
              return idString;
            })
          );
        }

        return throwError(() => error);
      })
    );
  }

  private generarIdLocal(prefijo: string): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
