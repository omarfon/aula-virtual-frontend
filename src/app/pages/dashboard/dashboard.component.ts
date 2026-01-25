import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CursosService } from '../../services/cursos.service';
import { ProgresoService } from '../../services/progreso.service';
import { AsignacionesService } from '../../services/asignaciones.service';
import { Curso, AsignacionCurso } from '../../models';
import { forkJoin, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';

interface ActividadReciente {
  id: number;
  tipo: 'curso' | 'tarea' | 'examen' | 'unidad';
  titulo: string;
  curso: string;
  descripcion: string;
  fecha: Date;
  icono: string;
  color: string;
}

interface CursoConProgreso {
  id: string;
  title: string;
  description: string;
  progress: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private cursosService = inject(CursosService);
  private progresoService = inject(ProgresoService);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private asignacionesService = inject(AsignacionesService);
  private destroyRef = inject(DestroyRef);
  private alumnoId: string | null = null;

  user = {
    name: 'Usuario',
    email: 'Sin correo registrado',
    telefono: 'Sin teléfono',
    carrera: 'Sin información',
    semestre: '',
    matricula: '',
    fechaIngreso: new Date(),
    direccion: 'Sin dirección disponible'
  };
  lastLogin: Date = new Date();
  perfilAbierto = false;

  stats = {
    courses: 0,
    pendingTasks: 8
  };

  courses: CursoConProgreso[] = [];
  cargandoCursos = true;

  recentActivities: ActividadReciente[] = [
    {
      id: 1,
      tipo: 'unidad',
      titulo: 'Completaste: Gestión de Contraseñas y Autenticación',
      curso: 'Seguridad de la Información',
      descripcion: 'Has finalizado la Unidad 2 con excelentes resultados',
      fecha: new Date('2026-01-11T09:30:00'),
      icono: '✅',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 2,
      tipo: 'examen',
      titulo: 'Examen completado: Manejo de Objeciones y Quejas',
      curso: 'Atención al Cliente Bancario',
      descripcion: 'Obtuviste 85 puntos en el examen de la Unidad 3',
      fecha: new Date('2026-01-10T16:45:00'),
      icono: '📝',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 3,
      tipo: 'tarea',
      titulo: 'Tarea entregada: Simulación de Detección de Billetes Falsos',
      curso: 'Cajero Exitoso',
      descripcion: 'Tu práctica fue evaluada con 90/100',
      fecha: new Date('2026-01-10T14:20:00'),
      icono: '📋',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 4,
      tipo: 'curso',
      titulo: 'Nuevo contenido: Cumplimiento Normativo',
      curso: 'Seguridad de la Información',
      descripcion: 'Se ha publicado material actualizado sobre ISO 27001 y PCI DSS',
      fecha: new Date('2026-01-09T11:00:00'),
      icono: '🎓',
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 5,
      tipo: 'unidad',
      titulo: 'Iniciaste: Atención Telefónica',
      curso: 'Atención al Cliente Bancario',
      descripcion: 'Comenzaste la Unidad 4 sobre protocolos de llamadas',
      fecha: new Date('2026-01-09T09:15:00'),
      icono: '📚',
      color: 'from-cyan-500 to-blue-600'
    },
    {
      id: 6,
      tipo: 'tarea',
      titulo: 'Recordatorio: Ejercicios de Conteo de Efectivo',
      curso: 'Cajero Exitoso',
      descripcion: 'Plazo de entrega: 12 de enero, 2026',
      fecha: new Date('2026-01-08T18:00:00'),
      icono: '⏰',
      color: 'from-yellow-500 to-orange-600'
    },
    {
      id: 7,
      tipo: 'examen',
      titulo: 'Próximo examen: Seguridad en Redes',
      curso: 'Seguridad de la Información',
      descripcion: 'Fecha programada: 15 de enero, 2026 - 10:00 AM',
      fecha: new Date('2026-01-08T10:30:00'),
      icono: '📅',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 8,
      tipo: 'unidad',
      titulo: 'Completaste: Manejo de Efectivo',
      curso: 'Cajero Exitoso',
      descripcion: 'Finalizaste la Unidad 2 con 88% de aprovechamiento',
      fecha: new Date('2026-01-07T15:20:00'),
      icono: '💰',
      color: 'from-green-600 to-teal-600'
    }
  ];

  ngOnInit(): void {
    this.actualizarDatosUsuario();
    this.cargarCursos();
  }

  private actualizarDatosUsuario(): void {
    const usuarioAutenticado = this.authService.currentUserValue;

    if (!usuarioAutenticado) {
      return;
    }

    const nombre = this.obtenerNombreUsuario(usuarioAutenticado);
    const correo = this.obtenerCorreoUsuario(usuarioAutenticado);
    const telefono = usuarioAutenticado.telefono || usuarioAutenticado.phone || usuarioAutenticado.celular;
    const carrera = usuarioAutenticado.carrera || usuarioAutenticado.departamento || usuarioAutenticado.area || usuarioAutenticado.cargo;
    const direccion = usuarioAutenticado.direccion || usuarioAutenticado.address;
    const fechaIngreso = usuarioAutenticado.fechaIngreso || usuarioAutenticado.createdAt || usuarioAutenticado.fechaCreacion;
    const ultimoIngreso = usuarioAutenticado.lastLogin || usuarioAutenticado.ultimoIngreso || usuarioAutenticado.updatedAt;

    this.user = {
      ...this.user,
      name: nombre,
      email: correo || this.user.email,
      telefono: telefono || this.user.telefono,
      carrera: carrera || this.user.carrera,
      direccion: direccion || this.user.direccion
    };

    if (fechaIngreso) {
      const fechaConvertida = new Date(fechaIngreso);
      if (!Number.isNaN(fechaConvertida.getTime())) {
        this.user.fechaIngreso = fechaConvertida;
      } else {
        console.warn('No se pudo convertir la fecha de ingreso del usuario:', fechaIngreso);
      }
    }

    if (ultimoIngreso) {
      const ultimoIngresoConvertido = new Date(ultimoIngreso);
      if (!Number.isNaN(ultimoIngresoConvertido.getTime())) {
        this.lastLogin = ultimoIngresoConvertido;
      } else {
        console.warn('No se pudo convertir la fecha de último ingreso:', ultimoIngreso);
      }
    }
  }

  private obtenerNombreUsuario(usuario: any): string {
    const nombreCompleto = usuario?.nombreCompleto || usuario?.fullName || usuario?.displayName;
    if (nombreCompleto) {
      return nombreCompleto;
    }

    const nombres = usuario?.nombre || usuario?.nombres || usuario?.firstName;
    const apellidos = usuario?.apellidos || usuario?.apellido || usuario?.lastName;

    if (nombres && apellidos) {
      return `${nombres} ${apellidos}`.trim();
    }

    if (nombres) {
      return nombres;
    }

    if (apellidos) {
      return apellidos;
    }

    return 'Usuario';
  }

  private obtenerCorreoUsuario(usuario: any): string {
    return usuario?.email || usuario?.correo || usuario?.username || '';
  }

  cargarCursos(): void {
    this.cargandoCursos = true;
    
    try {
      this.alumnoId = this.authService.getCurrentUserId();
    } catch (error) {
      console.warn('No se pudo obtener el ID del usuario autenticado.', error);
      this.establecerCursosProcesados([]);
      return;
    }

    this.asignacionesService
      .getAsignacionesPorAlumno(this.alumnoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: asignaciones => this.procesarAsignaciones(asignaciones),
        error: error => {
          console.error('Error al obtener asignaciones del alumno:', error);
          this.establecerCursosProcesados([]);
        }
      });
  }

  togglePerfil() {
    this.perfilAbierto = !this.perfilAbierto;
  }

  cerrarPerfil() {
    this.perfilAbierto = false;
  }

  getTiempoTranscurrido(fecha: Date): string {
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (minutos < 60) return `Hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas !== 1 ? 's' : ''}`;
    if (dias < 7) return `Hace ${dias} día${dias !== 1 ? 's' : ''}`;
    return fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  }

  private procesarAsignaciones(asignaciones: AsignacionCurso[]): void {
    this.cargandoCursos = true;
    const cursoIds = Array.from(new Set(asignaciones.map(asignacion => asignacion.cursoId).filter(Boolean)));

    if (!cursoIds.length) {
      this.establecerCursosProcesados([]);
      return;
    }

    this.cursosService
      .getCursos()
      .pipe(take(1))
      .subscribe({
        next: cursos => {
          const cursosAsignados = this.mapearCursosAsignados(cursos, cursoIds, asignaciones);
          this.obtenerProgresoCursos(cursosAsignados);
        },
        error: error => {
          console.error('Error al obtener cursos del backend:', error);
          const cursosFallback = cursoIds.map(id => this.crearCursoDesdeAsignacion(asignaciones.find(asignacion => asignacion.cursoId === id)));
          this.obtenerProgresoCursos(cursosFallback);
        }
      });
  }

  private mapearCursosAsignados(cursos: Curso[], cursoIds: string[], asignaciones: AsignacionCurso[]): Curso[] {
    const cursosPorId = new Map<string, Curso>();
    cursos.forEach(curso => {
      if (curso?.id) {
        cursosPorId.set(String(curso.id), curso);
      }
    });

    return cursoIds.map(id => {
      const cursoExistente = cursosPorId.get(id);
      if (cursoExistente) {
        return cursoExistente;
      }
      const asignacion = asignaciones.find(asignacion => asignacion.cursoId === id);
      return this.crearCursoDesdeAsignacion(asignacion);
    });
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

  private obtenerProgresoCursos(cursos: Curso[]): void {
    if (!cursos.length) {
      this.establecerCursosProcesados([]);
      return;
    }

    const progresoObservables = cursos.map(curso =>
      this.progresoService.obtenerProgresoCurso(curso.id!).pipe(
        catchError(error => {
          console.warn(`Error al obtener progreso del curso ${curso.id}:`, error);
          return of({
            alumnoId: this.alumnoId ?? '',
            cursoId: curso.id!,
            fechaInscripcion: new Date(),
            ultimoAcceso: new Date(),
            estado: 'no-iniciado' as const,
            progresoGeneral: 0,
            temasCompletados: [],
            contenidosVistos: []
          });
        })
      )
    );

    forkJoin(progresoObservables).subscribe({
      next: progresos => {
        this.courses = cursos.map((curso, index) => {
          const progreso = progresos[index];
          const porcentaje = Math.round(progreso?.progresoGeneral || 0);
          return {
            id: curso.id!,
            title: curso.titulo,
            description: curso.descripcion || 'Sin descripción',
            progress: porcentaje
          };
        });
        this.establecerCursosProcesados(this.courses);
      },
      error: error => {
        console.error('Error al combinar progresos de cursos:', error);
        this.courses = cursos.map(curso => ({
          id: curso.id!,
          title: curso.titulo,
          description: curso.descripcion || 'Sin descripción',
          progress: 0
        }));
        this.establecerCursosProcesados(this.courses);
      }
    });
  }

  private establecerCursosProcesados(cursos: CursoConProgreso[]): void {
    this.courses = cursos;
    this.stats.courses = cursos.length;
    this.cargandoCursos = false;
    this.cdr.detectChanges();
  }

  private generarIdLocal(prefijo: string): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
