import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { Alumno, AsignacionCurso, Curso } from '../../models';
import { AlumnosService } from '../../services/alumnos.service';
import { CursosService } from '../../services/cursos.service';
import { AsignacionesService, ResultadoAsignacionCursos } from '../../services/asignaciones.service';

type CursoListado = Curso & { id: string };

@Component({
  selector: 'app-asignacion-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asignacion-cursos.component.html',
  styleUrls: ['./asignacion-cursos.component.css']
})
export class AsignacionCursosComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly alumnosService = inject(AlumnosService);
  private readonly cursosService = inject(CursosService);
  private readonly asignacionesService = inject(AsignacionesService);
  private readonly cdr = inject(ChangeDetectorRef);

  alumnos: Alumno[] = [];
  cursos: CursoListado[] = [];
  asignaciones: AsignacionCurso[] = [];
  private cursosPorId = new Map<string, CursoListado>();

  terminoBusquedaAlumno = '';
  terminoBusquedaCurso = '';
  alumnoSeleccionado: Alumno | null = null;
  cursosSeleccionados: Set<string> = new Set();
  vistaActual: 'lista' | 'asignar' = 'lista';
  filtroEstado: 'todos' | 'activo' | 'inactivo' = 'todos';

  ngOnInit(): void {
    this.cargarAlumnos();
    this.cargarCursos();
    this.cargarAsignaciones();
  }

  private cargarAlumnos(): void {
    this.alumnosService
      .getAlumnos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(alumnos => {
        this.alumnos = alumnos.map(alumno => this.normalizarAlumno(alumno));
        this.refrescarVista();
      });
  }

  private cargarCursos(): void {
    this.cursosService
      .getCursos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cursos => {
        this.cursos = cursos.map(curso => this.normalizarCurso(curso));
        this.actualizarIndiceCursos();
        this.refrescarVista();
      });
  }

  private cargarAsignaciones(): void {
    this.asignacionesService
      .getAsignaciones()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(asignaciones => {
        this.asignaciones = asignaciones.map(asignacion => this.normalizarAsignacion(asignacion));
        this.refrescarVista();
      });
  }

  get alumnosFiltrados(): Alumno[] {
    return this.alumnos.filter(alumno => {
      const coincideEstado = this.filtroEstado === 'todos' || alumno.estado === this.filtroEstado;
      const termino = this.terminoBusquedaAlumno.toLowerCase();
      const coincideBusqueda = !this.terminoBusquedaAlumno ||
        alumno.nombre.toLowerCase().includes(termino) ||
        alumno.email.toLowerCase().includes(termino);

      return coincideEstado && coincideBusqueda;
    });
  }

  get cursosFiltrados(): CursoListado[] {
    const termino = this.terminoBusquedaCurso.toLowerCase();
    return this.cursos.filter(curso =>
      !this.terminoBusquedaCurso ||
      curso.titulo.toLowerCase().includes(termino) ||
      curso.instructor.toLowerCase().includes(termino) ||
      curso.categoria.toLowerCase().includes(termino)
    );
  }

  get cursosDisponibles(): CursoListado[] {
    if (!this.alumnoSeleccionado) {
      return [];
    }
    const cursosAsignadosIds = this.getCursosAsignados(this.alumnoSeleccionado.id).map(curso => curso.id);
    return this.cursosFiltrados.filter(curso => !cursosAsignadosIds.includes(curso.id));
  }

  seleccionarAlumno(alumno: Alumno): void {
    this.alumnoSeleccionado = alumno;
    this.cursosSeleccionados.clear();
    this.vistaActual = 'asignar';
  }

  toggleCursoSeleccion(cursoId: string): void {
    if (!cursoId) {
      return;
    }

    if (this.cursosSeleccionados.has(cursoId)) {
      this.cursosSeleccionados.delete(cursoId);
    } else {
      this.cursosSeleccionados.add(cursoId);
    }
  }

  asignarCursos(): void {
    if (!this.alumnoSeleccionado || this.cursosSeleccionados.size === 0) {
      void Swal.fire({
        icon: 'warning',
        title: 'Selecciona cursos',
        text: 'Elige al menos un curso para continuar.'
      });
      return;
    }

    const cursosArray = Array.from(this.cursosSeleccionados);
    this.asignacionesService
      .asignarCursos(this.alumnoSeleccionado.id, cursosArray)
      .pipe(take(1))
      .subscribe({
        next: resultado => {
          this.mostrarResumenAsignacion(resultado, cursosArray);
          this.cursosSeleccionados.clear();
          this.volverALista();
        },
        error: () => {
          void Swal.fire({
            icon: 'error',
            title: 'No se pudo asignar',
            text: 'Intenta nuevamente más tarde.'
          });
        }
      });
  }

  desasignarCurso(alumnoId: string, cursoId: string): void {
    const cursoNombre = this.cursos.find(curso => curso.id === cursoId)?.titulo || 'este curso';
    const alumno = this.alumnos.find(item => item.id === alumnoId);

    void Swal.fire({
      icon: 'warning',
      title: '¿Desasignar curso?',
      text: `Se eliminará ${cursoNombre} de ${alumno?.nombre || 'el alumno'}.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, desasignar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    }).then(resultado => {
      if (!resultado.isConfirmed) {
        return;
      }

      this.asignacionesService
        .desasignarCurso(alumnoId, cursoId)
        .pipe(take(1))
        .subscribe({
          next: () => {
            void Swal.fire({
              icon: 'success',
              title: 'Curso desasignado',
              text: `${cursoNombre} fue eliminado de ${alumno?.nombre || 'el alumno'}.`
            });
          },
          error: () => {
            void Swal.fire({
              icon: 'error',
              title: 'No se pudo desasignar',
              text: 'Inténtalo nuevamente más tarde.'
            });
          }
        });
    });
  }

  volverALista(): void {
    this.vistaActual = 'lista';
    this.alumnoSeleccionado = null;
    this.cursosSeleccionados.clear();
  }

  getCursosAsignados(alumnoId: string): CursoListado[] {
    const asignacionesAlumno = this.asignaciones.filter(asignacion => asignacion.alumnoId === alumnoId);
    return asignacionesAlumno
      .map(asignacion => this.obtenerCursoAsignado(asignacion))
      .filter((curso): curso is CursoListado => Boolean(curso));
  }

  getAsignacion(alumnoId: string, cursoId: string): AsignacionCurso | undefined {
    return this.asignaciones.find(asignacion => asignacion.alumnoId === alumnoId && asignacion.cursoId === cursoId);
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'activo':
        return 'bg-blue-100 text-blue-800';
      case 'completado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTotalCursosAsignados(): number {
    return this.asignaciones.length;
  }

  getAlumnosConCursos(): number {
    const alumnosConCursos = new Set(this.asignaciones.map(asignacion => asignacion.alumnoId));
    return alumnosConCursos.size;
  }

  private normalizarAlumno(alumno: Alumno): Alumno {
    return {
      ...alumno,
      nombre: alumno.nombre || 'Alumno sin nombre',
      email: alumno.email || 'sin-correo@salesland.com',
      telefono: alumno.telefono || 'Sin teléfono',
      fechaRegistro: alumno.fechaRegistro || new Date().toISOString(),
      estado: alumno.estado === 'inactivo' ? 'inactivo' : 'activo'
    };
  }

  private normalizarCurso(curso: Curso): CursoListado {
    const id = curso.id || curso.titulo || this.generarIdLocal('curso');
    const nivel = (curso.nivel ?? 'Intermedio') as Curso['nivel'];
    return {
      ...curso,
      id: String(id),
      titulo: curso.titulo || 'Curso sin título',
      instructor: curso.instructor || 'Instructor no asignado',
      categoria: curso.categoria || 'General',
      nivel,
      imagen: curso.imagen || '',
      duracionTotal: curso.duracionTotal || 0
    };
  }

  private normalizarAsignacion(asignacion: AsignacionCurso): AsignacionCurso {
    return {
      ...asignacion,
      id: asignacion.id || this.generarIdLocal('asg'),
      alumnoId: String(asignacion.alumnoId),
      cursoId: String(asignacion.cursoId),
      fechaAsignacion: asignacion.fechaAsignacion || new Date().toISOString(),
      progreso: typeof asignacion.progreso === 'number' ? asignacion.progreso : 0,
      estado: asignacion.estado === 'completado' ? 'completado' : asignacion.estado === 'activo' ? 'activo' : 'pendiente'
    };
  }

  private mostrarResumenAsignacion(resultado: ResultadoAsignacionCursos, solicitados: string[]): void {
    const yaAsignadosIds = new Set(resultado.yaAsignados);
    const noEncontradosIds = new Set(resultado.noEncontrados);

    const asignadosIds = resultado.asignados.length
      ? resultado.asignados.map(asignacion => asignacion.cursoId)
      : solicitados.filter(id => !yaAsignadosIds.has(id) && !noEncontradosIds.has(id));

    const totalAsignados = asignadosIds.length;
    const totalYaAsignados = resultado.yaAsignados.length;
    const totalNoEncontrados = resultado.noEncontrados.length;

    const asignadosTitulos = asignadosIds
      .map(id => this.cursos.find(curso => curso.id === id)?.titulo || id)
      .filter((titulo): titulo is string => Boolean(titulo));

    const yaAsignadosTitulos = resultado.yaAsignados
      .map(id => this.cursos.find(curso => curso.id === id)?.titulo || id);

    const noEncontradosTitulos = resultado.noEncontrados.map(id => this.cursos.find(curso => curso.id === id)?.titulo || id);

    const lineas: string[] = [];

    if (totalAsignados) {
      lineas.push(`<p><strong>Asignados (${totalAsignados}):</strong> ${asignadosTitulos.join(', ') || 'Se registraron sin nombre disponible.'}</p>`);
    }

    if (totalYaAsignados) {
      lineas.push(`<p><strong>Ya asignados (${totalYaAsignados}):</strong> ${yaAsignadosTitulos.join(', ')}</p>`);
    }

    if (totalNoEncontrados) {
      lineas.push(`<p><strong>No encontrados (${totalNoEncontrados}):</strong> ${noEncontradosTitulos.join(', ')}</p>`);
    }

    if (!lineas.length) {
      lineas.push('<p>No se realizaron cambios de asignación.</p>');
    }

    const icono = totalAsignados ? 'success' : totalYaAsignados ? 'info' : 'warning';
    const alumnoNombre = resultado.alumno?.nombre || this.alumnoSeleccionado?.nombre || 'el alumno';

    void Swal.fire({
      icon: icono,
      title: `Resultado de la asignación para ${alumnoNombre}`,
      html: lineas.join('')
    });
  }

  private generarIdLocal(prefijo: string): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private actualizarIndiceCursos(): void {
    this.cursosPorId.clear();
    for (const curso of this.cursos) {
      this.cursosPorId.set(curso.id, curso);
    }
  }

  private obtenerCursoAsignado(asignacion: AsignacionCurso): CursoListado | null {
    const cursoExistente = this.cursosPorId.get(asignacion.cursoId);
    if (cursoExistente) {
      return cursoExistente;
    }

    if (asignacion.curso) {
      const curso = this.normalizarCursoDesdeAsignacion(asignacion);
      this.cursosPorId.set(curso.id, curso);
      return curso;
    }

    const placeholder = this.crearCursoPlaceholder(asignacion.cursoId);
    this.cursosPorId.set(placeholder.id, placeholder);
    return placeholder;
  }

  private normalizarCursoDesdeAsignacion(asignacion: AsignacionCurso): CursoListado {
    const curso = asignacion.curso ?? {};
    return {
      id: asignacion.cursoId,
      titulo: curso.titulo || `Curso ${asignacion.cursoId}`,
      descripcion: '',
      instructor: curso.instructor || 'Instructor no asignado',
      nivel: 'Intermedio',
      imagen: curso.imagen || '',
      categoria: curso.categoria || 'General',
      estudiantes: undefined,
      duracionTotal: undefined,
      unidades: [],
      tareas: [],
      examenes: []
    };
  }

  private crearCursoPlaceholder(cursoId: string): CursoListado {
    return {
      id: cursoId,
      titulo: `Curso ${cursoId}`,
      descripcion: '',
      instructor: 'Instructor no disponible',
      nivel: 'Intermedio',
      imagen: '',
      categoria: 'General',
      estudiantes: undefined,
      duracionTotal: undefined,
      unidades: [],
      tareas: [],
      examenes: []
    };
  }

  private refrescarVista(): void {
    if ((this.cdr as { destroyed?: boolean }).destroyed) {
      return;
    }

    queueMicrotask(() => {
      if ((this.cdr as { destroyed?: boolean }).destroyed) {
        return;
      }
      this.cdr.detectChanges();
    });
  }
}
