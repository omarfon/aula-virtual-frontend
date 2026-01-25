import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  Curso, 
  Unidad, 
  Tema, 
  Contenido, 
  Tarea, 
  Examen, 
  PreguntaExamen,
  CreateCursoDto,
  CreateUnidadDto,
  CreateTemaDto,
  CreateContenidoDto,
  CreateExamenDto,
  CreatePreguntaExamenDto,
  CreateTareaDto
} from '../../models';
import { CursosService } from '../../services/cursos.service';
import { UnidadesService } from '../../services/unidades.service';
import { TemasService } from '../../services/temas.service';
import { ContenidosService } from '../../services/contenidos.service';
import { ExamenesService } from '../../services/examenes.service';
import { PreguntasExamenService } from '../../services/preguntas-examen.service';
import { TareasService } from '../../services/tareas.service';
import { AlertService } from '../../services/alert.service';

import { CursoCardComponent } from './curso-card.component';

@Component({
  selector: 'app-admin-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule, CursoCardComponent],
  templateUrl: './admin-cursos.component.html',
  styleUrls: ['./admin-cursos.component.css']
})
export class AdminCursosComponent implements OnInit {
  private readonly cursosService = inject(CursosService);
  private readonly unidadesService = inject(UnidadesService);
  private readonly temasService = inject(TemasService);
  private readonly contenidosService = inject(ContenidosService);
  private readonly examenesService = inject(ExamenesService);
  private readonly preguntasExamenService = inject(PreguntasExamenService);
  private readonly tareasService = inject(TareasService);
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  
  curso: Curso = {
    titulo: '',
    descripcion: '',
    instructor: '',
    nivel: 'Principiante',
    imagen: '',
    categoria: '',
    estudiantes: 0,
    duracionTotal: 0,
    unidades: [],
    tareas: [],
    examenes: []
  };

  // Control de secciones expandidas
  seccionActiva: 'basico' | 'unidades' | 'tareas' | 'examenes' = 'basico';
  unidadExpandida: number | null = null;
  temaExpandido: string | null = null;

  // Formularios temporales
  nuevaUnidad: Unidad = this.crearUnidadVacia();
  nuevoTema: Tema = this.crearTemaVacio();
  nuevoContenido: Contenido = this.crearContenidoVacio();
  nuevaTarea: Tarea = this.crearTareaVacia();
  nuevoExamen: Examen = this.crearExamenVacio();

  // Control de modales
  modalUnidadAbierto = false;
  modalTemaAbierto = false;
  modalContenidoAbierto = false;
  modalTareaAbierto = false;
  modalExamenAbierto = false;
  modalPreguntaAbierto = false;
  unidadSeleccionada: Unidad | null = null;
  temaSeleccionado: Tema | null = null;
  examenSeleccionado: Examen | null = null;

  // Gestión de preguntas
  nuevaPregunta: PreguntaExamen = this.crearPreguntaVacia();
  opcionTemporal: string = '';

  // Estados de carga y error
  cargando = false;
  error: string | null = null;
  mensajeExito: string | null = null;

  // Listado de cursos
  cursos: Curso[] = [];
  
  // Control de formulario
  mostrarFormularioNuevo = false;
  cursoEditandoIndex: number | null = null;
  cursoEditandoId: string | null = null;
  terminoBusqueda = '';

  // Paginación
  cursosPorPagina = 9; // 3x3 grid
  paginaActual = 1;

  // Opciones para desplegables
  instructoresDisponibles = [
    'Ing. Patricia Ramírez',
    'Lic. Jorge Mendoza',
    'Lic. Rosa Villegas',
    'Dr. Carlos Gutiérrez',
    'Mg. Ana Torres',
    'Ing. Luis Fernández'
  ];

  categoriasDisponibles = [
    'Seguridad',
    'Atención al Cliente',
    'Operaciones Bancarias',
    'Finanzas',
    'Marketing',
    'Recursos Humanos',
    'Tecnología',
    'Compliance'
  ];

  ngOnInit() {
    console.log('🚀 AdminCursosComponent inicializado');
    // Asegurar que siempre inicie mostrando el listado de cursos
    this.mostrarFormularioNuevo = false;
    this.cursoEditandoIndex = null;
    this.cursoEditandoId = null;
    
    console.log('📊 Estado inicial - mostrarFormularioNuevo:', this.mostrarFormularioNuevo, 'cargando:', this.cargando);
    
    // Forzar detección de cambios después de inicializar estado
    this.cdr.detectChanges();
    
    // Cargar cursos
    this.cargarCursos();
  }

  /**
   * Carga todos los cursos desde el backend
   */
  private cargarCursos() {
    console.log('📥 Iniciando carga de cursos...');
    this.cargando = true;
    this.error = null;
    
    // Forzar detección de cambios inmediata
    this.cdr.detectChanges();
    
    this.cursosService.getCursos().subscribe({
      next: (cursos) => {
        console.log('✅ Cursos cargados exitosamente:', cursos.length);
        this.ngZone.run(() => {
          this.cursos = cursos;
          this.cargando = false;
          
          // Forzar detección de cambios después de cargar
          this.cdr.detectChanges();
          console.log('✅ Estado actualizado - cargando:', this.cargando, 'cursos:', this.cursos.length);
        });
      },
      error: (error) => {
        console.error('❌ Error al cargar cursos:', error);
        this.ngZone.run(() => {
          this.error = 'Error al cargar los cursos';
          this.cargando = false;
          
          // Forzar detección de cambios en error
          this.cdr.detectChanges();
          console.log('❌ Estado actualizado - cargando:', this.cargando);
        });
      }
    });
  }

  /**
   * Getter para obtener cursos filtrados por búsqueda
   */
  get cursosFiltrados(): Curso[] {
  if (!this.terminoBusqueda.trim()) {
    return this.cursos;
  }

  const termino = this.terminoBusqueda.toLowerCase().trim();
  return this.cursos.filter(curso => {
    return (
      curso.titulo.toLowerCase().includes(termino) ||
      curso.instructor.toLowerCase().includes(termino) ||
      curso.categoria.toLowerCase().includes(termino) ||
      curso.nivel.toLowerCase().includes(termino) ||
      curso.descripcion.toLowerCase().includes(termino)
    );
  });
}

  /**
   * Getter para obtener cursos paginados
   */
  get cursosPaginados(): Curso[] {
    const inicio = (this.paginaActual - 1) * this.cursosPorPagina;
    const fin = inicio + this.cursosPorPagina;
    return this.cursosFiltrados.slice(inicio, fin);
  }

  /**
   * Getter para calcular total de páginas
   */
  get totalPaginas(): number {
    return Math.ceil(this.cursosFiltrados.length / this.cursosPorPagina);
  }

  /**
   * Cambia a la página especificada
   */
  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Reinicia la paginación cuando cambia el filtro de búsqueda
   */
  onBusquedaChange(): void {
    this.paginaActual = 1;
  }

  // TrackBy functions para mejorar rendimiento
  trackByCurso(index: number, curso: Curso): string {
    return curso.id || index.toString();
  }

  trackByUnidad(index: number, unidad: Unidad): string {
    return unidad.id || index.toString();
  }

  trackByTema(index: number, tema: Tema): string {
    return tema.id || index.toString();
  }

  trackByContenido(index: number, contenido: Contenido): string {
    return contenido.id || index.toString();
  }

  trackByTarea(index: number, tarea: Tarea): string {
    return tarea.id || index.toString();
  }

  trackByExamen(index: number, examen: Examen): string {
    return examen.id || index.toString();
  }

  trackByPregunta(index: number, pregunta: PreguntaExamen): string {
    return pregunta.id || index.toString();
  }

  trackByIndex(index: number): number {
    return index;
  }

  // Métodos de creación de objetos vacíos

  crearUnidadVacia(): Unidad {
    return {
      id: this.generarId(),
      numero: (this.curso.unidades?.length ?? 0) + 1,
      titulo: '',
      descripcion: '',
      temas: []
    };
  }

  crearTemaVacio(): Tema {
    return {
      id: this.generarId(),
      titulo: '',
      descripcion: '',
      contenidos: [],
      duracionEstimada: 0
    };
  }

  crearContenidoVacio(): Contenido {
    return {
      tipo: 'video',
      titulo: '',
      url: '',
      contenido: '',
      duracion: 0
    };
  }

  crearTareaVacia(): Tarea {
    return {
      titulo: '',
      descripcion: '',
      fechaEntrega: '',
      puntosPosibles: 100,
      prioridad: 'media'
    };
  }

  crearExamenVacio(): Examen {
    return {
      titulo: '',
      descripcion: '',
      fecha: '',
      duracion: 60,
      preguntasLista: [],
      porcentajeAprobacion: 70,
      intentosPermitidos: 3,
      tipo: 'mixto'
    };
  }

  crearPreguntaVacia(): PreguntaExamen {
    return {
      id: this.generarId(),
      texto: '',
      tipo: 'opcion_multiple',
      opciones: ['', '', '', ''],
      respuestaCorrecta: 0
    };
  }

  generarId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  cambiarSeccion(seccion: 'basico' | 'unidades' | 'tareas' | 'examenes') {
    this.seccionActiva = seccion;
  }

  // Gestión de Unidades
  abrirModalUnidad(unidad?: Unidad) {
    if (unidad) {
      this.nuevaUnidad = { ...unidad, temas: unidad.temas ? [...unidad.temas] : [] };
    } else {
      this.nuevaUnidad = this.crearUnidadVacia();
    }
    this.modalUnidadAbierto = true;
  }

  /**
   * Guarda una unidad (crea o actualiza)
   * Si el curso ya tiene ID (está persistido), guarda en el backend
   * Si no, solo actualiza localmente
   */
  guardarUnidad() {
    // Si el curso ya está persistido en el backend
    if (this.curso.id && this.nuevaUnidad.id) {
      // Actualizar unidad existente en el backend
      this.cargando = true;
      const updateDto: CreateUnidadDto = {
        numero: this.nuevaUnidad.numero,
        titulo: this.nuevaUnidad.titulo,
        descripcion: this.nuevaUnidad.descripcion,
        temas: this.nuevaUnidad.temas
      };

      this.unidadesService.updateUnidad(this.curso.id, this.nuevaUnidad.id, updateDto).subscribe({
        next: (unidadActualizada) => {
          const index = this.curso.unidades?.findIndex(u => u.id === this.nuevaUnidad.id) ?? -1;
          if (index >= 0 && this.curso.unidades) {
            this.curso.unidades[index] = unidadActualizada;
          }
          this.mensajeExito = '✅ Unidad actualizada exitosamente';
          this.modalUnidadAbierto = false;
          this.cargando = false;
          this.renumerarUnidades();
          this.calcularDuracionTotal();
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (error) => {
          this.error = `Error al actualizar unidad: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error:', error);
        }
      });
    } else if (this.curso.id && !this.nuevaUnidad.id) {
      // Crear nueva unidad en el backend
      this.cargando = true;
      const createDto: CreateUnidadDto = {
        numero: this.nuevaUnidad.numero,
        titulo: this.nuevaUnidad.titulo,
        descripcion: this.nuevaUnidad.descripcion,
        temas: this.nuevaUnidad.temas
      };

      this.unidadesService.createUnidad(this.curso.id, createDto).subscribe({
        next: (unidadCreada) => {
          if (!this.curso.unidades) {
            this.curso.unidades = [];
          }
          this.curso.unidades.push(unidadCreada);
          this.mensajeExito = '✅ Unidad creada exitosamente';
          this.modalUnidadAbierto = false;
          this.cargando = false;
          this.renumerarUnidades();
          this.calcularDuracionTotal();
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (error) => {
          this.error = `Error al crear unidad: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error:', error);
        }
      });
    } else {
      // Modo local (curso aún no persistido)
      if (!this.curso.unidades) {
        this.curso.unidades = [];
      }
      
      const index = this.curso.unidades.findIndex(u => u.id === this.nuevaUnidad.id);
      if (index >= 0) {
        // Actualizar unidad existente localmente
        this.curso.unidades[index] = { ...this.nuevaUnidad };
      } else {
        // Agregar nueva unidad con ID temporal
        const nuevaUnidadConId = {
          ...this.nuevaUnidad,
          id: this.generarId()
        };
        this.curso.unidades.push(nuevaUnidadConId);
      }
      this.modalUnidadAbierto = false;
      this.renumerarUnidades();
      this.calcularDuracionTotal();
    }
  }

  /**
   * Elimina una unidad
   */
  async eliminarUnidad(unidadId: string) {
    const confirmed = await this.alertService.confirm(
      '¿Eliminar Unidad?',
      'Esta acción eliminará permanentemente la unidad y todos sus temas y contenidos asociados.',
      'Eliminar',
      'Cancelar'
    );

    if (!confirmed) return;

    // Si el curso está persistido en el backend
    if (this.curso.id) {
      this.cargando = true;
      this.unidadesService.deleteUnidad(this.curso.id, unidadId).subscribe({
        next: () => {
          if (this.curso.unidades) {
            this.curso.unidades = this.curso.unidades.filter(u => u.id !== unidadId);
          }
          this.alertService.success('¡Unidad Eliminada!', 'La unidad ha sido eliminada exitosamente.');
          this.cargando = false;
          this.renumerarUnidades();
          this.calcularDuracionTotal();
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (error) => {
          this.error = `Error al eliminar unidad: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error:', error);
        }
      });
    } else {
      // Modo local
      if (this.curso.unidades) {
        this.curso.unidades = this.curso.unidades.filter(u => u.id !== unidadId);
      }
      this.renumerarUnidades();
      this.calcularDuracionTotal();
    }
  }

  renumerarUnidades() {
    if (this.curso.unidades) {
      this.curso.unidades.forEach((unidad, index) => {
        unidad.numero = index + 1;
      });
    }
  }

  toggleUnidad(index: number) {
    this.unidadExpandida = this.unidadExpandida === index ? null : index;
  }

  // Gestión de Temas
  abrirModalTema(unidad: Unidad, tema?: Tema) {
    this.unidadSeleccionada = unidad;
    if (tema) {
      this.nuevoTema = { ...tema, contenidos: tema.contenidos ? [...tema.contenidos] : [] };
    } else {
      this.nuevoTema = this.crearTemaVacio();
    }
    this.modalTemaAbierto = true;
  }

  /**
   * Guarda un tema (crear o actualizar)
   * Si el curso y la unidad ya tienen ID (están persistidos), guarda en el backend
   * Si no, solo actualiza localmente
   */
  guardarTema() {
    if (!this.unidadSeleccionada) return;

    const unidad = this.curso.unidades?.find(u => u.id === this.unidadSeleccionada!.id);
    if (!unidad) return;

    // Si el curso y la unidad ya están persistidos en el backend
    if (this.curso.id && unidad.id && this.nuevoTema.id) {
      // Actualizar tema existente en el backend
      this.cargando = true;
      const updateDto: CreateTemaDto = {
        titulo: this.nuevoTema.titulo,
        descripcion: this.nuevoTema.descripcion,
        duracionEstimada: this.nuevoTema.duracionEstimada,
        contenidos: this.nuevoTema.contenidos
      };

      this.temasService.updateTema(this.curso.id, unidad.id, this.nuevoTema.id, updateDto).subscribe({
        next: (temaActualizado) => {
          if (!unidad.temas) {
            unidad.temas = [];
          }
          const index = unidad.temas.findIndex(t => t.id === this.nuevoTema.id);
          if (index >= 0) {
            unidad.temas[index] = temaActualizado;
          }
          this.mensajeExito = '✅ Tema actualizado exitosamente';
          this.modalTemaAbierto = false;
          this.cargando = false;
          this.calcularDuracionTotal();
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (error) => {
          this.error = `Error al actualizar tema: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error:', error);
        }
      });
    } else if (this.curso.id && unidad.id && !this.nuevoTema.id) {
      // Crear nuevo tema en el backend
      this.cargando = true;
      const createDto: CreateTemaDto = {
        titulo: this.nuevoTema.titulo,
        descripcion: this.nuevoTema.descripcion,
        duracionEstimada: this.nuevoTema.duracionEstimada,
        contenidos: this.nuevoTema.contenidos
      };

      this.temasService.createTema(this.curso.id, unidad.id, createDto).subscribe({
        next: (temaCreado) => {
          if (!unidad.temas) {
            unidad.temas = [];
          }
          unidad.temas.push(temaCreado);
          this.mensajeExito = '✅ Tema creado exitosamente';
          this.modalTemaAbierto = false;
          this.cargando = false;
          this.calcularDuracionTotal();
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (error) => {
          this.error = `Error al crear tema: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error:', error);
        }
      });
    } else {
      // Modo local (curso o unidad no persistidos aún)
      if (!unidad.temas) {
        unidad.temas = [];
      }
      const index = unidad.temas.findIndex(t => t.id === this.nuevoTema.id);
      if (index >= 0) {
        // Actualizar tema existente
        unidad.temas[index] = { ...this.nuevoTema };
      } else {
        // Agregar nuevo tema con un ID único
        const nuevoTemaConId = {
          ...this.nuevoTema,
          id: this.generarId()
        };
        unidad.temas.push(nuevoTemaConId);
      }
      this.modalTemaAbierto = false;
      this.calcularDuracionTotal();
    }
  }

  /**
   * Elimina un tema
   * Si el curso y la unidad ya tienen ID (están persistidos), elimina del backend
   * Si no, solo elimina localmente
   */
  async eliminarTema(unidad: Unidad, temaId: string | undefined) {
    console.log('🗑️ eliminarTema llamado:', { unidadId: unidad.id, temaId });
    
    if (!temaId) {
      console.warn('⚠️ No se puede eliminar tema sin ID');
      return;
    }
    
    console.log('📋 Mostrando diálogo de confirmación...');
    const confirmed = await this.alertService.confirm(
      '¿Eliminar Tema?',
      'Esta acción eliminará permanentemente el tema y todos sus contenidos asociados.',
      'Eliminar',
      'Cancelar'
    );

    console.log('✅ Usuario confirmó:', confirmed);
    if (!confirmed) {
      console.log('❌ Usuario canceló la eliminación');
      return;
    }

    const unidadCurso = this.curso.unidades?.find(u => u.id === unidad.id);
    if (!unidadCurso) {
      console.error('❌ No se encontró la unidad en el curso');
      return;
    }

    // Si el curso y la unidad ya están persistidos en el backend
    if (this.curso.id && unidad.id) {
      console.log('🌐 Eliminando tema del backend...');
      this.cargando = true;
      this.temasService.deleteTema(this.curso.id, unidad.id, temaId).subscribe({
        next: () => {
          console.log('✅ Tema eliminado del backend exitosamente');
          console.log('Temas antes del filtro:', unidadCurso.temas?.length);
          if (unidadCurso.temas) {
            unidadCurso.temas = unidadCurso.temas.filter(t => t.id !== temaId);
            console.log('Temas después del filtro:', unidadCurso.temas.length);
            
            // Forzar actualización en el curso principal
            const unidadIndex = this.curso.unidades?.findIndex(u => u.id === unidad.id);
            if (unidadIndex !== undefined && unidadIndex !== -1 && this.curso.unidades) {
              this.curso.unidades[unidadIndex].temas = [...unidadCurso.temas];
            }
          }
          this.cargando = false;
          this.calcularDuracionTotal();
          this.cdr.detectChanges();
          console.log('✅ Vista actualizada');
          setTimeout(() => {
            this.alertService.success('¡Eliminado Exitosamente!', 'El tema ha sido eliminado correctamente de la unidad.');
          }, 100);
        },
        error: (error) => {
          console.error('❌ Error al eliminar tema del backend:', error);
          this.cargando = false;
          setTimeout(() => {
            this.alertService.error('Error al Eliminar', `No se pudo eliminar el tema: ${error.message || 'Error desconocido'}`);
          });
        }
      });
    } else {
      console.log('💾 Eliminando tema localmente...');
      // Modo local
      if (unidadCurso.temas) {
        unidadCurso.temas = unidadCurso.temas.filter(t => t.id !== temaId);
        this.calcularDuracionTotal();
      }
      console.log('✅ Tema eliminado localmente');
    }
  }

  testClick(msg: string) {
    console.log('TEST CLICK:', msg);
  }

  // Gestión de Contenidos
  abrirModalContenido(tema: Tema, contenido?: Contenido) {
    this.temaSeleccionado = tema;
    if (contenido) {
      this.nuevoContenido = { ...contenido };
    } else {
      this.nuevoContenido = this.crearContenidoVacio();
    }
    this.modalContenidoAbierto = true;
  }

  /**
   * Guarda un contenido (crear o actualizar)
   * Si el curso, la unidad y el tema ya tienen ID (están persistidos), guarda en el backend
   * Si no, solo actualiza localmente
   */
  guardarContenido() {
    if (!this.temaSeleccionado) return;

    // Buscar el tema y la unidad en el curso
    let unidadEncontrada: Unidad | undefined;
    let temaEncontrado: Tema | undefined;

    for (const unidad of this.curso.unidades ?? []) {
      const tema = unidad.temas?.find(t => t.id === this.temaSeleccionado!.id);
      if (tema) {
        unidadEncontrada = unidad;
        temaEncontrado = tema;
        break;
      }
    }

    if (!unidadEncontrada || !temaEncontrado) return;

    // Si el curso, la unidad y el tema ya están persistidos en el backend
    if (this.curso.id && unidadEncontrada.id && temaEncontrado.id && this.nuevoContenido.id) {
      // Actualizar contenido existente en el backend
      this.cargando = true;
      const updateDto: CreateContenidoDto = {
        tipo: this.nuevoContenido.tipo,
        titulo: this.nuevoContenido.titulo,
        url: this.nuevoContenido.url,
        contenido: this.nuevoContenido.contenido,
        duracion: this.nuevoContenido.duracion
      };

      this.contenidosService.updateContenido(
        this.curso.id,
        unidadEncontrada.id,
        temaEncontrado.id,
        this.nuevoContenido.id,
        updateDto
      ).subscribe({
        next: (contenidoActualizado) => {
          console.log('✅ Contenido actualizado en backend');
          if (!temaEncontrado!.contenidos) {
            temaEncontrado!.contenidos = [];
          }
          const index = temaEncontrado!.contenidos.findIndex(c => c.id === this.nuevoContenido.id);
          if (index >= 0) {
            temaEncontrado!.contenidos[index] = contenidoActualizado;
          }
          // Forzar nueva referencia
          temaEncontrado!.contenidos = [...temaEncontrado!.contenidos];
          
          this.modalContenidoAbierto = false;
          this.cargando = false;
          this.cdr.detectChanges();
          
          setTimeout(() => {
            this.alertService.success('¡Actualizado Exitosamente!', 'El contenido ha sido actualizado correctamente.');
          }, 100);
        },
        error: (error) => {
          console.error('❌ Error al actualizar contenido:', error);
          this.cargando = false;
          setTimeout(() => {
            this.alertService.error('Error al Actualizar', `No se pudo actualizar el contenido: ${error.message || 'Error desconocido'}`);
          }, 100);
        }
      });
    } else if (this.curso.id && unidadEncontrada.id && temaEncontrado.id && !this.nuevoContenido.id) {
      // Crear nuevo contenido en el backend
      this.cargando = true;
      const createDto: CreateContenidoDto = {
        tipo: this.nuevoContenido.tipo,
        titulo: this.nuevoContenido.titulo,
        url: this.nuevoContenido.url,
        contenido: this.nuevoContenido.contenido,
        duracion: this.nuevoContenido.duracion
      };

      this.contenidosService.createContenido(
        this.curso.id,
        unidadEncontrada.id,
        temaEncontrado.id,
        createDto
      ).subscribe({
        next: (contenidoCreado) => {
          console.log('✅ Contenido creado en backend:', contenidoCreado);
          if (!temaEncontrado!.contenidos) {
            temaEncontrado!.contenidos = [];
          }
          temaEncontrado!.contenidos.push(contenidoCreado);
          // Forzar nueva referencia
          temaEncontrado!.contenidos = [...temaEncontrado!.contenidos];
          
          this.modalContenidoAbierto = false;
          this.cargando = false;
          this.cdr.detectChanges();
          
          setTimeout(() => {
            this.alertService.success('¡Creado Exitosamente!', 'El contenido ha sido agregado correctamente al tema.');
          }, 100);
        },
        error: (error) => {
          console.error('❌ Error al crear contenido:', error);
          this.cargando = false;
          setTimeout(() => {
            this.alertService.error('Error al Crear', `No se pudo crear el contenido: ${error.message || 'Error desconocido'}`);
          }, 100);
        }
      });
    } else {
      // Modo local (curso, unidad o tema no persistidos aún)
      if (!temaEncontrado.contenidos) {
        temaEncontrado.contenidos = [];
      }
      const index = temaEncontrado.contenidos.findIndex(c => c.id === this.nuevoContenido.id);
      if (index >= 0) {
        // Actualizar contenido existente
        temaEncontrado.contenidos[index] = { ...this.nuevoContenido };
      } else {
        // Agregar nuevo contenido con ID único
        const nuevoContenidoConId = {
          ...this.nuevoContenido,
          id: this.generarId()
        };
        temaEncontrado.contenidos.push(nuevoContenidoConId);
      }
      this.modalContenidoAbierto = false;
    }
  }

  /**
   * Elimina un contenido
   * Si el curso, la unidad y el tema ya tienen ID (están persistidos), elimina del backend
   * Si no, solo elimina localmente
   */
  async eliminarContenido(tema: Tema, contenidoIndex: number) {
    const confirmed = await this.alertService.confirm(
      '¿Eliminar Contenido?',
      'Esta acción eliminará permanentemente este contenido del tema.',
      'Eliminar',
      'Cancelar'
    );

    if (!confirmed) return;

    // Buscar el tema y la unidad en el curso
    let unidadEncontrada: Unidad | undefined;
    let temaEncontrado: Tema | undefined;

    for (const unidad of this.curso.unidades ?? []) {
      const temaAux = unidad.temas?.find(t => t.id === tema.id);
      if (temaAux) {
        unidadEncontrada = unidad;
        temaEncontrado = temaAux;
        break;
      }
    }

    if (!unidadEncontrada || !temaEncontrado || !temaEncontrado.contenidos) return;

    const contenido = temaEncontrado.contenidos[contenidoIndex];
    if (!contenido) return;

    // Si el curso, la unidad y el tema ya están persistidos en el backend
    if (this.curso.id && unidadEncontrada.id && temaEncontrado.id && contenido.id) {
      this.cargando = true;
      this.contenidosService.deleteContenido(
        this.curso.id,
        unidadEncontrada.id,
        temaEncontrado.id,
        contenido.id
      ).subscribe({
        next: () => {
          console.log('✅ Contenido eliminado del backend exitosamente');
          console.log('Contenidos antes:', temaEncontrado!.contenidos!.length);
          
          // Eliminar el contenido del array
          temaEncontrado!.contenidos!.splice(contenidoIndex, 1);
          
          // Forzar una nueva referencia para que Angular detecte el cambio
          temaEncontrado!.contenidos = [...temaEncontrado!.contenidos!];
          
          console.log('Contenidos después:', temaEncontrado!.contenidos!.length);
          this.cargando = false;
          this.cdr.detectChanges();
          console.log('✅ Vista actualizada');
          
          setTimeout(() => {
            this.alertService.success('¡Eliminado Exitosamente!', 'El contenido ha sido eliminado correctamente del tema.');
          }, 100);
        },
        error: (error) => {
          this.cargando = false;
          console.error('❌ Error al eliminar contenido:', error);
          setTimeout(() => {
            this.alertService.error('Error al Eliminar', `No se pudo eliminar el contenido: ${error.message || 'Error desconocido'}`);
          });
        }
      });
    } else {
      // Modo local
      temaEncontrado.contenidos.splice(contenidoIndex, 1);
      setTimeout(() => {
        this.alertService.success('¡Contenido Eliminado!', 'El contenido ha sido eliminado localmente.');
      });
    }
  }

  // Gestión de Tareas
  abrirModalTarea(tarea?: Tarea) {
    if (tarea) {
      this.nuevaTarea = { ...tarea };
    } else {
      this.nuevaTarea = this.crearTareaVacia();
    }
    this.modalTareaAbierto = true;
  }

  /**
   * Guarda una tarea (crear o actualizar)
   * Si el curso ya tiene ID (está persistido), guarda en el backend
   * Si no, solo actualiza localmente
   */
  guardarTarea() {
    if (!this.curso.tareas) {
      this.curso.tareas = [];
    }

    // Si el curso ya está persistido en el backend y la tarea tiene ID
    if (this.curso.id && this.nuevaTarea.id) {
      // Actualizar tarea existente en el backend
      this.cargando = true;
      const updateDto: CreateTareaDto = {
        titulo: this.nuevaTarea.titulo,
        descripcion: this.nuevaTarea.descripcion,
        fechaEntrega: this.nuevaTarea.fechaEntrega,
        puntosPosibles: this.nuevaTarea.puntosPosibles,
        prioridad: this.nuevaTarea.prioridad
      };

      this.tareasService.updateTarea(this.curso.id, this.nuevaTarea.id, updateDto).subscribe({
        next: (tareaActualizada) => {
          const index = this.curso.tareas!.findIndex(t => t.id === this.nuevaTarea.id);
          if (index >= 0) {
            this.curso.tareas![index] = tareaActualizada;
          }
          this.mensajeExito = '✅ Tarea actualizada exitosamente';
          this.modalTareaAbierto = false;
          this.cargando = false;
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (error) => {
          this.error = `Error al actualizar tarea: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error:', error);
        }
      });
    } else if (this.curso.id && !this.nuevaTarea.id) {
      // Crear nueva tarea en el backend
      this.cargando = true;
      const createDto: CreateTareaDto = {
        titulo: this.nuevaTarea.titulo,
        descripcion: this.nuevaTarea.descripcion,
        fechaEntrega: this.nuevaTarea.fechaEntrega,
        puntosPosibles: this.nuevaTarea.puntosPosibles,
        prioridad: this.nuevaTarea.prioridad
      };

      this.tareasService.createTarea(this.curso.id, createDto).subscribe({
        next: (tareaCreada) => {
          this.curso.tareas!.push(tareaCreada);
          this.mensajeExito = '✅ Tarea creada exitosamente';
          this.modalTareaAbierto = false;
          this.cargando = false;
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (error) => {
          this.error = `Error al crear tarea: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error:', error);
        }
      });
    } else {
      // Modo local (curso no persistido aún)
      const index = this.curso.tareas.findIndex(t => t.id === this.nuevaTarea.id);
      if (index >= 0) {
        // Actualizar tarea existente
        this.curso.tareas[index] = { ...this.nuevaTarea };
      } else {
        // Agregar nueva tarea con ID único
        const nuevaTareaConId = {
          ...this.nuevaTarea,
          id: this.generarId()
        };
        this.curso.tareas.push(nuevaTareaConId);
      }
      this.modalTareaAbierto = false;
    }
  }

  /**
   * Elimina una tarea
   * Si el curso ya tiene ID (está persistido), elimina del backend
   * Si no, solo elimina localmente
   */
  async eliminarTarea(tarea: Tarea) {
    const confirmed = await this.alertService.confirm(
      '¿Eliminar Tarea?',
      'Esta acción eliminará permanentemente la tarea del curso.',
      'Eliminar',
      'Cancelar'
    );

    if (!confirmed) return;

    // Si el curso ya está persistido en el backend
    if (this.curso.id && tarea.id) {
      this.cargando = true;
      this.tareasService.deleteTarea(this.curso.id, tarea.id).subscribe({
        next: () => {
          if (this.curso.tareas) {
            this.curso.tareas = this.curso.tareas.filter(t => t.id !== tarea.id);
          }
          this.alertService.success('¡Tarea Eliminada!', 'La tarea ha sido eliminada exitosamente.');
          this.cargando = false;
        },
        error: (error) => {
          this.error = `Error al eliminar tarea: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error:', error);
        }
      });
    } else {
      // Modo local
      if (this.curso.tareas) {
        this.curso.tareas = this.curso.tareas.filter(t => t.id !== tarea.id);
      }
    }
  }

  // Gestión de Exámenes
  abrirModalExamen(examen?: Examen) {
    if (examen) {
      this.nuevoExamen = { ...examen, preguntasLista: [...examen.preguntasLista] };
    } else {
      this.nuevoExamen = this.crearExamenVacio();
    }
    this.modalExamenAbierto = true;
  }

  /**
   * Guarda un examen (crear o actualizar)
   * Si el curso ya tiene ID (está persistido), guarda en el backend
   * Si no, solo actualiza localmente
   */
  guardarExamen() {
    if (!this.curso.examenes) {
      this.curso.examenes = [];
    }

    // Si el curso ya está persistido en el backend y el examen tiene ID
    if (this.curso.id && this.nuevoExamen.id) {
      // Actualizar examen existente en el backend
      this.cargando = true;
      const updateDto: CreateExamenDto = {
        titulo: this.nuevoExamen.titulo,
        descripcion: this.nuevoExamen.descripcion,
        fecha: this.nuevoExamen.fecha,
        duracion: this.nuevoExamen.duracion,
        porcentajeAprobacion: this.nuevoExamen.porcentajeAprobacion,
        intentosPermitidos: this.nuevoExamen.intentosPermitidos,
        tipo: this.nuevoExamen.tipo,
        preguntasLista: this.nuevoExamen.preguntasLista?.map(p => ({
          texto: p.texto,
          tipo: p.tipo,
          opciones: p.opciones,
          respuestaCorrecta: p.respuestaCorrecta
        }))
      };

      this.examenesService.updateExamen(this.curso.id, this.nuevoExamen.id, updateDto).subscribe({
        next: (examenActualizado) => {
          const index = this.curso.examenes!.findIndex(e => e.id === this.nuevoExamen.id);
          if (index >= 0) {
            this.curso.examenes![index] = examenActualizado;
          }
          this.mensajeExito = '✅ Examen actualizado exitosamente';
          this.modalExamenAbierto = false;
          this.cargando = false;
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (error) => {
          this.error = `Error al actualizar examen: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error:', error);
        }
      });
    } else if (this.curso.id && !this.nuevoExamen.id) {
      // Crear nuevo examen en el backend
      this.cargando = true;
      const createDto: CreateExamenDto = {
        titulo: this.nuevoExamen.titulo,
        descripcion: this.nuevoExamen.descripcion,
        fecha: this.nuevoExamen.fecha,
        duracion: this.nuevoExamen.duracion,
        porcentajeAprobacion: this.nuevoExamen.porcentajeAprobacion,
        intentosPermitidos: this.nuevoExamen.intentosPermitidos,
        tipo: this.nuevoExamen.tipo,
        preguntasLista: this.nuevoExamen.preguntasLista?.map(p => ({
          texto: p.texto,
          tipo: p.tipo,
          opciones: p.opciones,
          respuestaCorrecta: p.respuestaCorrecta
        }))
      };

      this.examenesService.createExamen(this.curso.id, createDto).subscribe({
        next: (examenCreado) => {
          this.curso.examenes!.push(examenCreado);
          this.mensajeExito = '✅ Examen creado exitosamente';
          this.modalExamenAbierto = false;
          this.cargando = false;
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (error) => {
          this.error = `Error al crear examen: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error:', error);
        }
      });
    } else {
      // Modo local (curso no persistido aún)
      const index = this.curso.examenes.findIndex(e => e.id === this.nuevoExamen.id);
      if (index >= 0) {
        // Actualizar examen existente
        this.curso.examenes[index] = { ...this.nuevoExamen };
      } else {
        // Agregar nuevo examen con ID único
        const nuevoExamenConId = {
          ...this.nuevoExamen,
          id: this.generarId()
        };
        this.curso.examenes.push(nuevoExamenConId);
      }
      this.modalExamenAbierto = false;
    }
  }

  /**
   * Elimina un examen
   * Si el curso ya tiene ID (está persistido), elimina del backend
   * Si no, solo elimina localmente
   */
  async eliminarExamen(examen: Examen) {
    const confirmed = await this.alertService.confirm(
      '¿Eliminar Examen?',
      'Esta acción eliminará permanentemente el examen y todas sus preguntas.',
      'Eliminar',
      'Cancelar'
    );

    if (!confirmed) return;

    // Si el curso ya está persistido en el backend
    if (this.curso.id && examen.id) {
      this.cargando = true;
      this.examenesService.deleteExamen(this.curso.id, examen.id).subscribe({
        next: () => {
          if (this.curso.examenes) {
            this.curso.examenes = this.curso.examenes.filter(e => e.id !== examen.id);
          }
          this.alertService.success('¡Examen Eliminado!', 'El examen ha sido eliminado exitosamente.');
          this.cargando = false;
        },
        error: (error) => {
          this.error = `Error al eliminar examen: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error:', error);
        }
      });
    } else {
      // Modo local
      if (this.curso.examenes) {
        this.curso.examenes = this.curso.examenes.filter(e => e.id !== examen.id);
      }
    }
  }

  // Gestión de Preguntas de Examen
  abrirModalPregunta(examen: Examen, pregunta?: PreguntaExamen) {
    this.examenSeleccionado = examen;
    if (pregunta) {
      this.nuevaPregunta = { ...pregunta, opciones: [...pregunta.opciones] };
    } else {
      this.nuevaPregunta = this.crearPreguntaVacia();
    }
    this.modalPreguntaAbierto = true;
  }

  agregarOpcion() {
    if (this.opcionTemporal.trim()) {
      this.nuevaPregunta.opciones.push(this.opcionTemporal.trim());
      this.opcionTemporal = '';
    }
  }

  eliminarOpcion(index: number) {
    this.nuevaPregunta.opciones.splice(index, 1);
    // Ajustar respuesta correcta si es necesario
    if (this.nuevaPregunta.respuestaCorrecta >= this.nuevaPregunta.opciones.length) {
      this.nuevaPregunta.respuestaCorrecta = Math.max(0, this.nuevaPregunta.opciones.length - 1);
    }
  }

  /**
   * Guarda una pregunta de examen (crear o actualizar)
   * Si el curso y el examen ya tienen ID (están persistidos), guarda en el backend
   * Si no, solo actualiza localmente
   */
  guardarPregunta() {
    if (!this.examenSeleccionado) return;

    const examen = this.curso.examenes?.find(e => e.id === this.examenSeleccionado!.id);
    if (!examen) return;

    // Si el curso y el examen ya están persistidos en el backend
    if (this.curso.id && examen.id && this.nuevaPregunta.id) {
      // Actualizar pregunta existente en el backend
      this.cargando = true;
      const updateDto: CreatePreguntaExamenDto = {
        texto: this.nuevaPregunta.texto,
        tipo: this.nuevaPregunta.tipo,
        opciones: this.nuevaPregunta.opciones,
        respuestaCorrecta: this.nuevaPregunta.respuestaCorrecta
      };

      this.preguntasExamenService.updatePregunta(
        this.curso.id,
        examen.id,
        this.nuevaPregunta.id,
        updateDto
      ).subscribe({
        next: (preguntaActualizada) => {
          const index = examen.preguntasLista.findIndex(p => p.id === this.nuevaPregunta.id);
          if (index >= 0) {
            examen.preguntasLista[index] = preguntaActualizada;
          }
          this.mensajeExito = '✅ Pregunta actualizada exitosamente';
          this.modalPreguntaAbierto = false;
          this.cargando = false;
          this.nuevaPregunta = this.crearPreguntaVacia();
          this.opcionTemporal = '';
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (error) => {
          this.error = `Error al actualizar pregunta: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error:', error);
        }
      });
    } else if (this.curso.id && examen.id && !this.nuevaPregunta.id) {
      // Crear nueva pregunta en el backend
      this.cargando = true;
      const createDto: CreatePreguntaExamenDto = {
        texto: this.nuevaPregunta.texto,
        tipo: this.nuevaPregunta.tipo,
        opciones: this.nuevaPregunta.opciones,
        respuestaCorrecta: this.nuevaPregunta.respuestaCorrecta
      };

      this.preguntasExamenService.createPregunta(
        this.curso.id,
        examen.id,
        createDto
      ).subscribe({
        next: (preguntaCreada) => {
          examen.preguntasLista.push(preguntaCreada);
          this.mensajeExito = '✅ Pregunta creada exitosamente';
          this.modalPreguntaAbierto = false;
          this.cargando = false;
          this.nuevaPregunta = this.crearPreguntaVacia();
          this.opcionTemporal = '';
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (error) => {
          this.error = `Error al crear pregunta: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error:', error);
        }
      });
    } else {
      // Modo local (curso o examen no persistidos aún)
      const index = examen.preguntasLista.findIndex(p => p.id === this.nuevaPregunta.id);
      if (index >= 0) {
        // Actualizar pregunta existente
        examen.preguntasLista[index] = { ...this.nuevaPregunta };
      } else {
        // Agregar nueva pregunta con ID único
        const nuevaPreguntaConId = {
          ...this.nuevaPregunta,
          id: this.generarId()
        };
        examen.preguntasLista.push(nuevaPreguntaConId);
      }
      this.modalPreguntaAbierto = false;
      this.nuevaPregunta = this.crearPreguntaVacia();
      this.opcionTemporal = '';
    }
  }

  /**
   * Elimina una pregunta de examen
   * Si el curso y el examen ya tienen ID (están persistidos), elimina del backend
   * Si no, solo elimina localmente
   */
  async eliminarPregunta(examen: Examen, preguntaId: string) {
    const confirmed = await this.alertService.confirm(
      '¿Eliminar Pregunta?',
      'Esta acción eliminará permanentemente la pregunta del examen.',
      'Eliminar',
      'Cancelar'
    );

    if (!confirmed) return;

    const examenEncontrado = this.curso.examenes?.find(e => e.id === examen.id);
    if (!examenEncontrado) return;

    // Si el curso y el examen ya están persistidos en el backend
    if (this.curso.id && examen.id) {
      this.cargando = true;
      this.preguntasExamenService.deletePregunta(this.curso.id, examen.id, preguntaId).subscribe({
        next: () => {
          examenEncontrado.preguntasLista = examenEncontrado.preguntasLista.filter(p => p.id !== preguntaId);
          this.alertService.success('¡Pregunta Eliminada!', 'La pregunta ha sido eliminada exitosamente.');
          this.cargando = false;
        },
        error: (error) => {
          this.error = `Error al eliminar pregunta: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error:', error);
        }
      });
    } else {
      // Modo local
      examenEncontrado.preguntasLista = examenEncontrado.preguntasLista.filter(p => p.id !== preguntaId);
    }
  }

  // Utilidades
  calcularDuracionTotal() {
    let totalMinutos = 0;
    this.curso.unidades?.forEach(unidad => {
      unidad.temas?.forEach(tema => {
        totalMinutos += tema.duracionEstimada;
      });
    });
    this.curso.duracionTotal = Math.round(totalMinutos / 60 * 10) / 10; // Convertir a horas con 1 decimal
  }

  /**
   * Guarda o actualiza un curso
   */
  guardarCurso() {
    if (!this.curso.titulo || !this.curso.instructor) {
      this.error = 'Por favor completa los campos obligatorios (Título e Instructor)';
      return;
    }

    this.cargando = true;
    this.error = null;
    this.mensajeExito = null;

    if (this.cursoEditandoId) {
      // Actualizar curso existente
      this.cursosService.updateCurso(this.cursoEditandoId, this.curso).subscribe({
        next: (cursoActualizado) => {
          const index = this.cursos.findIndex(c => c.id === this.cursoEditandoId);
          if (index !== -1) {
            this.cursos[index] = cursoActualizado;
          }
          this.mensajeExito = '✅ Curso actualizado exitosamente';
          this.cargando = false;
          this.cursoEditandoId = null;
          this.cursoEditandoIndex = null;
          this.reiniciarFormulario();
          this.mostrarFormularioNuevo = false;
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (error) => {
          this.error = `Error al actualizar el curso: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error al actualizar curso:', error);
        }
      });
    } else {
      // Crear nuevo curso
      const nuevoCurso: CreateCursoDto = {
        titulo: this.curso.titulo,
        descripcion: this.curso.descripcion,
        instructor: this.curso.instructor,
        nivel: this.curso.nivel,
        imagen: this.curso.imagen,
        categoria: this.curso.categoria,
        estudiantes: this.curso.estudiantes || 0,
        duracionTotal: this.curso.duracionTotal || 0,
        unidades: this.curso.unidades || [],
        tareas: this.curso.tareas || [],
        examenes: this.curso.examenes || []
      };

      this.cursosService.createCurso(nuevoCurso).subscribe({
        next: (cursoCreado) => {
          this.cursos.push(cursoCreado);
          this.mensajeExito = '✅ Curso creado exitosamente';
          this.cargando = false;
          this.reiniciarFormulario();
          this.mostrarFormularioNuevo = false;
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (error) => {
          this.error = `Error al crear el curso: ${error.message}`;
          this.cargando = false;
          console.error('❌ Error al crear curso:', error);
        }
      });
    }
  }

  /**
   * Edita un curso por índice
   * Carga el curso completo del backend solo cuando se va a editar
   */
  editarCurso(index: number) {
    console.log('✏️ Intentando editar curso en índice:', index);
    const cursoAEditar = this.cursos[index];
    if (!cursoAEditar || !cursoAEditar.id) {
      console.error('❌ Curso sin ID en índice:', index);
      this.error = 'No se puede editar un curso sin ID';
      return;
    }

    console.log('📥 Cargando curso completo, ID:', cursoAEditar.id);
    // Mostrar indicador de carga
    this.cargando = true;
    this.cdr.detectChanges();
    
    this.cursosService.getCursoById(cursoAEditar.id).subscribe({
      next: (cursoCompleto) => {
        console.log('✅ Curso completo cargado:', cursoCompleto.titulo);
        this.ngZone.run(() => {
          this.curso = { ...cursoCompleto };
          this.cursoEditandoIndex = index;
          this.cursoEditandoId = cursoCompleto.id || null;
          this.mostrarFormularioNuevo = true;
          this.seccionActiva = 'basico';
          this.cargando = false;
          
          // Forzar detección de cambios
          this.cdr.detectChanges();
          console.log('✅ Estado actualizado - Modo edición activado, mostrarFormularioNuevo:', this.mostrarFormularioNuevo, 'cargando:', this.cargando);
          
          // Scroll después de que el DOM se actualice
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        });
      },
      error: (error) => {
        console.error('❌ Error al cargar curso para editar:', error);
        this.ngZone.run(() => {
          this.error = 'Error al cargar el curso para editar: ' + (error.message || 'Error desconocido');
          this.cargando = false;
          console.log('❌ Estado actualizado - Error en carga');
        });
      }
    });
  }

  /**
   * Elimina un curso por índice
   */
  async eliminarCurso(index: number) {
    const curso = this.cursos[index];
    if (!curso.id) {
      this.alertService.error('Error', 'No se puede eliminar un curso sin ID');
      return;
    }

    const cursoNombre = curso.titulo;
    const confirmed = await this.alertService.confirm(
      `¿Eliminar "${cursoNombre}"?`,
      'Esta acción eliminará permanentemente el curso y todo su contenido (unidades, temas, tareas y exámenes).',
      'Eliminar Curso',
      'Cancelar'
    );

    if (!confirmed) return;

    this.cargando = true;
    this.error = null;
    this.cdr.detectChanges();

    this.cursosService.deleteCurso(curso.id).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.cursos.splice(index, 1);
          this.alertService.success('¡Curso Eliminado!', `El curso "${cursoNombre}" ha sido eliminado exitosamente.`);
          this.cargando = false;
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.error = `Error al eliminar el curso: ${error.message}`;
          this.cargando = false;
        });
        console.error('❌ Error al eliminar curso:', error);
      }
    });
  }

  editarCursoPorObjeto(curso: Curso) {
    console.log('🖱️ Click en editar curso:', curso.titulo);
    const index = this.cursos.findIndex(c => c.id === curso.id);
    if (index !== -1) {
      // Forzar detección de cambios inmediatamente
      this.cdr.detectChanges();
      this.editarCurso(index);
    } else {
      console.error('❌ Curso no encontrado en la lista');
    }
  }

  eliminarCursoPorObjeto(curso: Curso) {
    console.log('🖱️ Click en eliminar curso:', curso.titulo);
    const index = this.cursos.findIndex(c => c.id === curso.id);
    if (index !== -1) {
      this.eliminarCurso(index);
    } else {
      console.error('❌ Curso no encontrado en la lista');
    }
  }

  /**
   * Reinicia el formulario de curso
   */
  reiniciarFormulario() {
    this.curso = {
      titulo: '',
      descripcion: '',
      instructor: '',
      nivel: 'Principiante',
      imagen: '',
      categoria: '',
      estudiantes: 0,
      duracionTotal: 0,
      unidades: [],
      tareas: [],
      examenes: []
    };
    this.seccionActiva = 'basico';
    this.cursoEditandoIndex = null;
    this.cursoEditandoId = null;
    this.error = null;
    this.mensajeExito = null;
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  cerrarModal() {
    this.modalUnidadAbierto = false;
    this.modalTemaAbierto = false;
    this.modalContenidoAbierto = false;
    this.modalTareaAbierto = false;
    this.modalExamenAbierto = false;
    this.modalPreguntaAbierto = false;
  }
}
