import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CursosService } from '../../services/cursos.service';
import { AsignacionesService } from '../../services/asignaciones.service';
import { Curso, AsignacionCurso } from '../../models';
import { AuthService } from '../../services/auth.service';
import { take } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cursos.component.html',
  styleUrl: './cursos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CursosComponent implements OnInit {
  private readonly cursosService = inject(CursosService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly asignacionesService = inject(AsignacionesService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private alumnoId: string | null = null;
  private asignaciones: AsignacionCurso[] = [];
  private cursosPorId = new Map<string, Curso>();
  
  cursos: Curso[] = [];
  cargando = true;
  error: string | null = null;

  get totalEstudiantes(): number {
    return this.cursos.reduce((acc, curso) => acc + (curso.estudiantes ?? 0), 0);
  }

  get cursosActivos(): number {
    if (!this.asignaciones.length) {
      return 0;
    }

    const activos = this.asignaciones
      .filter(asignacion => asignacion.estado === 'activo' || asignacion.estado === 'pendiente')
      .map(asignacion => asignacion.cursoId)
      .filter(Boolean);

    return new Set(activos).size;
  }

  ngOnInit() {
    this.cargarAsignaciones();
  }

  private cargarAsignaciones(): void {
    this.cargando = true;
    this.error = null;

    try {
      this.alumnoId = this.authService.getCurrentUserId();
    } catch (error) {
      console.warn('No se pudo determinar el alumno autenticado.', error);
      this.error = 'No se pudo identificar al alumno actual. Inicia sesión nuevamente.';
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    this.asignacionesService
      .getAsignacionesPorAlumno(this.alumnoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: asignaciones => {
          this.asignaciones = asignaciones;
          this.obtenerCursosAsignados();
        },
        error: error => {
          console.error('Error al obtener asignaciones del alumno:', error);
          this.error = 'No se pudieron obtener las asignaciones del alumno.';
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  private obtenerCursosAsignados(): void {
    const cursoIds = Array.from(new Set(this.asignaciones.map(asignacion => asignacion.cursoId).filter(Boolean)));

    if (!cursoIds.length) {
      this.cursos = [];
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    this.cursosService
      .getCursos()
      .pipe(take(1))
      .subscribe({
        next: cursos => {
          this.actualizarIndiceCursos(cursos);
          this.cursos = cursoIds.map(id => this.obtenerCursoPorId(id));
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: error => {
          console.error('Error al obtener cursos desde el backend:', error);
          this.cursos = cursoIds.map(id => this.crearCursoDesdeAsignacion(this.asignaciones.find(asignacion => asignacion.cursoId === id)));
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  private actualizarIndiceCursos(cursos: Curso[]): void {
    this.cursosPorId.clear();
    cursos.forEach(curso => {
      if (curso?.id) {
        this.cursosPorId.set(String(curso.id), curso);
      }
    });
  }

  private obtenerCursoPorId(id: string): Curso {
    const cursoExistente = this.cursosPorId.get(id);
    if (cursoExistente) {
      return cursoExistente;
    }
    const asignacion = this.asignaciones.find(item => item.cursoId === id);
    const fallback = this.crearCursoDesdeAsignacion(asignacion);
    this.cursosPorId.set(String(fallback.id), fallback);
    return fallback;
  }

  private crearCursoDesdeAsignacion(asignacion?: AsignacionCurso): Curso {
    const cursoMetadata = asignacion?.curso ?? {};
    const id = asignacion?.cursoId ?? cursoMetadata?.id ?? this.generarIdLocal('curso');
    return {
      id: String(id),
      titulo: cursoMetadata.titulo || `Curso ${id}`,
      descripcion: '',
      instructor: cursoMetadata.instructor || 'Instructor no disponible',
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

  private generarIdLocal(prefijo: string): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  cargarCursos() {
    this.cargarAsignaciones();
  }

  trackByCurso(index: number, curso: Curso): string {
    return curso.id || index.toString();
  }

  logNavegacion(curso: Curso) {
    console.log('🔗 Navegando a curso:', { id: curso.id, titulo: curso.titulo });
  }
}
