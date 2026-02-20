import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExamenesService } from '../../services/examenes.service';
import { AuthService } from '../../services/auth.service';
import { AsignacionesService } from '../../services/asignaciones.service';
import { AsignacionCurso } from '../../models';
import Swal from 'sweetalert2';

interface ExamenAlumno {
  id: string;
  examen: any;
  alumno: any;
  curso: string;
  cursoTitulo?: string;
  fechaAsignacion: Date;
  fechaLimite?: Date;
  intentosRealizados: number;
  intentosPermitidos?: number;
  calificacion?: number;
  mejorIntento?: number;
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'vencido';
}

@Component({
  selector: 'app-examenes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './examenes.component.html',
  styleUrls: ['./examenes.component.css']
})
export class ExamenesComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly examenesService = inject(ExamenesService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly asignacionesService = inject(AsignacionesService);
  private readonly destroyRef = inject(DestroyRef);

  filtroActivo: 'todos' | 'pendiente' | 'completado' | 'vencido' = 'todos';
  examenSeleccionado: ExamenAlumno | null = null;
  modalAbierto = false;
  
  examenes: ExamenAlumno[] = [];
  cargando = true;
  errorCarga = false;
  alumnoId: string | null = null;
  private asignaciones: AsignacionCurso[] = [];
  private cursosAsignados = new Map<string, { titulo: string; instructor?: string }>();

  ngOnInit() {
    this.cargarAsignaciones();
  }

  cargarExamenes() {
    this.cargarAsignaciones();
  }

  private cargarAsignaciones(): void {
    this.cargando = true;
    this.errorCarga = false;

    try {
      this.alumnoId = this.authService.getCurrentUserId();
    } catch (error) {
      console.warn('No se pudo determinar el alumno autenticado.', error);
      this.errorCarga = true;
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    console.log('🔍 Cargando asignaciones y exámenes para alumnoId:', this.alumnoId);

    this.asignacionesService
      .getAsignacionesPorAlumno(this.alumnoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: asignaciones => {
          this.asignaciones = asignaciones;
          this.sincronizarCursosAsignados();
          this.cargarExamenesAsignados();
        },
        error: error => {
          console.error('Error al obtener asignaciones del alumno:', error);
          this.errorCarga = true;
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  private cargarExamenesAsignados(): void {
    if (!this.alumnoId) {
      this.examenes = [];
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    const cursoIds = new Set(
      this.asignaciones
        .map(asignacion => asignacion.cursoId)
        .filter((id): id is string => Boolean(id))
    );

    if (!cursoIds.size) {
      console.log('⚠️ Alumno sin cursos asignados, no se cargarán exámenes.');
      this.examenes = [];
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    this.examenesService.getMisExamenes(this.alumnoId).pipe(
      take(1),
      catchError(error => {
        console.error('Error al cargar exámenes:', error);
        this.errorCarga = true;
        this.cargando = false;
        this.cdr.detectChanges();
        return of([]);
      })
    ).subscribe((examenesAlumno: any[]) => {
      console.log('📦 Datos recibidos del backend:', examenesAlumno);
      console.log('📊 Número de registros totales:', examenesAlumno.length);

      const filtrados = examenesAlumno.filter(item => {
        const cursoId = this.obtenerCursoId(item);
        const incluido = cursoId ? cursoIds.has(cursoId) : false;
        if (!incluido) {
          console.log('⏭️ Examen omitido por no pertenecer a cursos asignados:', { examenAlumnoId: item?.id, cursoId });
        }
        return incluido;
      });

      console.log('📊 Número de registros tras filtro por asignaciones:', filtrados.length);

      this.examenes = filtrados.map(item => this.mapeoExamenAlumno(item));

      console.log('✅ Exámenes finales mapeados:', this.examenes);
      this.cargando = false;
      this.cdr.detectChanges();
    });
  }

  private sincronizarCursosAsignados(): void {
    this.cursosAsignados.clear();
    this.asignaciones.forEach(asignacion => {
      if (!asignacion.cursoId) {
        return;
      }
      const cursoId = String(asignacion.cursoId);
      const titulo = asignacion.curso?.titulo || `Curso ${cursoId}`;
      const instructor = asignacion.curso?.instructor;
      this.cursosAsignados.set(cursoId, { titulo, instructor });
    });
  }

  private obtenerCursoId(item: any): string | null {
    const cursoId = item?.cursoId || item?.curso?.id || item?.curso?.cursoId || (typeof item?.curso === 'string' ? item.curso : null);
    return cursoId ? String(cursoId) : null;
  }

  private obtenerTituloCurso(cursoId: string | null, item: any): string {
    if (cursoId && this.cursosAsignados.has(cursoId)) {
      return this.cursosAsignados.get(cursoId)!.titulo;
    }

    const curso = item?.curso;
    if (typeof curso === 'string') {
      return curso;
    }
    if (curso && typeof curso === 'object') {
      return curso.titulo || curso.nombre || curso.descripcion || `Curso ${cursoId ?? ''}`;
    }

    return cursoId ? `Curso ${cursoId}` : 'Curso sin título';
  }

  private mapeoExamenAlumno(item: any): ExamenAlumno {
    const cursoId = this.obtenerCursoId(item);
    const tituloCurso = this.obtenerTituloCurso(cursoId, item);

    const examenData = {
      id: item.examenId || item.id,
      titulo: item.titulo || item.examen?.titulo || 'Sin título',
      descripcion: item.descripcion || item.examen?.descripcion || '',
      tiempoLimite: item.tiempoLimite || item.examen?.tiempoLimite || 60,
      intentosPermitidos: item.intentosPermitidos || item.examen?.intentosPermitidos || 1,
      porcentajeAprobacion: item.porcentajeAprobacion || item.examen?.porcentajeAprobacion || 70,
      puntosTotales: item.puntosTotales || item.examen?.puntosTotales || 100,
      preguntas: item.preguntas || item.examen?.preguntas || []
    };

    const examenAlumno = {
      id: item.id,
      examen: examenData,
      alumno: item.alumno || { id: this.alumnoId },
      curso: cursoId || item.curso || '',
      cursoTitulo: tituloCurso,
      fechaAsignacion: item.fechaAsignacion ? new Date(item.fechaAsignacion) : new Date(),
      fechaLimite: item.fechaLimite ? new Date(item.fechaLimite) : undefined,
      intentosRealizados: item.intentosRealizados || 0,
      intentosPermitidos: item.intentosPermitidos || examenData.intentosPermitidos || 1,
      calificacion: item.calificacion,
      mejorIntento: item.mejorIntento,
      estado: this.obtenerEstadoNormalizado(item)
    } as ExamenAlumno;

    console.log('✅ ExamenAlumno mapeado:', {
      id: examenAlumno.id,
      titulo: examenAlumno.examen.titulo,
      examenId: examenAlumno.examen.id,
      cursoId: cursoId
    });

    return examenAlumno;
  }

  private obtenerEstadoNormalizado(item: any): 'pendiente' | 'en_progreso' | 'completado' | 'vencido' {
    const estadoRemoto = (item?.estado || item?.estadoAsignacion || item?.status || '')
      .toString()
      .trim()
      .toLowerCase();

    switch (estadoRemoto) {
      case 'completado':
      case 'completo':
      case 'finalizado':
      case 'terminado':
        return 'completado';
      case 'pendiente':
      case 'no_iniciado':
      case 'no iniciado':
      case 'sin_empezar':
        return 'pendiente';
      case 'vencido':
      case 'expirado':
        return 'vencido';
      case 'en_progreso':
      case 'en-progreso':
      case 'en progreso':
      case 'en curso':
      case 'en_curso':
        return 'en_progreso';
    }

    return this.determinarEstadoPorDatos(item);
  }

  private determinarEstadoPorDatos(examenAlumno: any): 'pendiente' | 'en_progreso' | 'completado' | 'vencido' {
    if (examenAlumno.calificacion !== null && examenAlumno.calificacion !== undefined) {
      return 'completado';
    }
    
    if (examenAlumno.fechaLimite) {
      const ahora = new Date();
      const limite = new Date(examenAlumno.fechaLimite);
      if (ahora > limite) {
        return 'vencido';
      }
    }
    
    if (examenAlumno.intentosRealizados > 0) {
      return 'en_progreso';
    }
    
    return 'pendiente';
  }

  get examenesFiltrados() {
    if (this.filtroActivo === 'todos') {
      return this.examenes;
    }
    return this.examenes.filter(e => e.estado === this.filtroActivo);
  }

  get estadisticas() {
    return {
      total: this.examenes.length,
      pendientes: this.examenes.filter(e => e.estado === 'pendiente').length,
      completados: this.examenes.filter(e => e.estado === 'completado').length,
      vencidos: this.examenes.filter(e => e.estado === 'vencido').length,
      promedioCalificaciones: this.calcularPromedio()
    };
  }

  calcularPromedio(): number {
    const completados = this.examenes.filter(e => e.calificacion !== undefined && e.calificacion !== null);
    if (completados.length === 0) return 0;
    const suma = completados.reduce((acc, e) => acc + (e.calificacion || 0), 0);
    return Math.round(suma / completados.length);
  }

  filtrar(estado: 'todos' | 'pendiente' | 'completado' | 'vencido') {
    this.filtroActivo = estado;
  }

  abrirExamen(examen: ExamenAlumno) {
    this.examenSeleccionado = examen;
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.examenSeleccionado = null;
  }

  iniciarExamen(examenAlumno: ExamenAlumno) {
    // Validar si puede iniciar
    if (examenAlumno.estado === 'vencido') {
      Swal.fire({
        icon: 'warning',
        title: 'Examen vencido',
        text: 'Este examen ya no está disponible'
      });
      return;
    }

    if (examenAlumno.intentosPermitidos && 
        examenAlumno.intentosRealizados >= examenAlumno.intentosPermitidos) {
      Swal.fire({
        icon: 'warning',
        title: 'Límite de intentos',
        text: `Has alcanzado el límite de ${examenAlumno.intentosPermitidos} intento(s)`
      });
      return;
    }

    // Validar ID válido
    if (!examenAlumno.id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El examen no tiene un identificador válido. Contacta al profesor.'
      });
      console.error('❌ ExamenAlumno sin ID:', examenAlumno);
      return;
    }

    console.log('🚀 Navegando a tomar examen');
    console.log('  ✅ ID de ExamenAlumno (CORRECTO):', examenAlumno.id);
    console.log('  ℹ️ ID del Examen (NO USAR):', examenAlumno.examen?.id);
    console.log('  📋 Datos completos:', examenAlumno);

    // Cerrar modal y navegar
    this.cerrarModal();
    
    // ⚠️ CRÍTICO: Usar examenAlumno.id (asignación), NO examenAlumno.examen.id
    console.log('📍 URL navegación: /examenes/tomar/' + examenAlumno.id);
    this.router.navigate(['/examenes/tomar', examenAlumno.id]);
  }

  verHistorial(examenAlumno: ExamenAlumno) {
    this.router.navigate(['/examenes/historial', examenAlumno.id]);
  }

  ngOnDestroy() {
    // Cleanup si es necesario
  }

  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'completado': 'bg-green-100 text-green-800',
      'vencido': 'bg-red-100 text-red-800',
      'en_progreso': 'bg-blue-100 text-blue-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  }

  getEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'completado': 'Completado',
      'vencido': 'Vencido',
      'en_progreso': 'En Progreso'
    };
    return textos[estado] || estado;
  }

  getDiasRestantes(fecha?: Date): number {
    if (!fecha) return 0;
    const ahora = new Date();
    const diferencia = fecha.getTime() - ahora.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  getColorCalificacion(calificacion?: number): string {
    if (!calificacion) return 'text-gray-600';
    if (calificacion >= 90) return 'text-green-600';
    if (calificacion >= 75) return 'text-blue-600';
    if (calificacion >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  puedeIniciar(examen: ExamenAlumno): boolean {
    if (examen.estado === 'vencido') return false;
    if (examen.intentosPermitidos && examen.intentosRealizados >= examen.intentosPermitidos) return false;
    return true;
  }

  getTextoBoton(examen: ExamenAlumno): string {
    if (examen.estado === 'vencido') return 'Vencido';
    if (examen.intentosPermitidos && examen.intentosRealizados >= examen.intentosPermitidos) return 'Límite alcanzado';
    if (examen.intentosRealizados === 0) return 'Iniciar Examen';
    return 'Nuevo Intento';
  }
}
