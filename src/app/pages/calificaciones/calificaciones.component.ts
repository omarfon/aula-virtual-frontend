import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Calificacion {
  id: number;
  curso: string;
  profesor: string;
  nota: number;
  estado: 'aprobado' | 'reprobado' | 'en-progreso';
  tareas: number;
  tareasCompletadas: number;
  examenes: number;
  examenesCompletados: number;
  ultimaActualizacion: Date;
}

interface Insignia {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  obtenida: boolean;
  fechaObtencion?: Date;
  progreso?: number;
  meta?: number;
}

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calificaciones.component.html',
  styleUrls: ['./calificaciones.component.css']
})
export class CalificacionesComponent {
  calificaciones: Calificacion[] = [
    {
      id: 1,
      curso: 'Seguridad de la Información',
      profesor: 'Ing. Patricia Ramírez',
      nota: 92,
      estado: 'aprobado',
      tareas: 14,
      tareasCompletadas: 14,
      examenes: 7,
      examenesCompletados: 7,
      ultimaActualizacion: new Date('2025-12-28')
    },
    {
      id: 2,
      curso: 'Atención al Cliente Bancario',
      profesor: 'Lic. Jorge Mendoza',
      nota: 78,
      estado: 'en-progreso',
      tareas: 12,
      tareasCompletadas: 9,
      examenes: 7,
      examenesCompletados: 4,
      ultimaActualizacion: new Date('2026-01-10')
    },
    {
      id: 3,
      curso: 'Cajero Exitoso',
      profesor: 'Lic. Rosa Villegas',
      nota: 85,
      estado: 'en-progreso',
      tareas: 10,
      tareasCompletadas: 6,
      examenes: 7,
      examenesCompletados: 3,
      ultimaActualizacion: new Date('2026-01-09')
    }
  ];

  insignias: Insignia[] = [
    {
      id: 1,
      nombre: 'Primer Curso Completado',
      descripcion: 'Completaste tu primer curso con éxito',
      icono: '🎓',
      color: 'from-blue-500 to-indigo-600',
      obtenida: true,
      fechaObtencion: new Date('2025-12-28')
    },
    {
      id: 2,
      nombre: 'Experto en Seguridad',
      descripcion: 'Obtén una calificación mayor a 90 en Seguridad de la Información',
      icono: '🔒',
      color: 'from-red-500 to-red-600',
      obtenida: true,
      fechaObtencion: new Date('2025-12-28')
    },
    {
      id: 3,
      nombre: 'Profesional Bancario',
      descripcion: 'Completa los 3 cursos bancarios fundamentales',
      icono: '🏦',
      color: 'from-green-500 to-emerald-600',
      obtenida: false,
      progreso: 1,
      meta: 3
    },
    {
      id: 4,
      nombre: 'Racha de 7 días',
      descripcion: 'Estudia 7 días consecutivos',
      icono: '🔥',
      color: 'from-orange-500 to-red-600',
      obtenida: true,
      fechaObtencion: new Date('2026-01-05')
    },
    {
      id: 5,
      nombre: 'Maestro del Servicio',
      descripcion: 'Alcanza 100% en el curso de Atención al Cliente',
      icono: '⭐',
      color: 'from-yellow-400 to-orange-500',
      obtenida: false,
      progreso: 78,
      meta: 100
    },
    {
      id: 6,
      nombre: 'Cajero Profesional',
      descripcion: 'Completa todas las unidades de Cajero Exitoso',
      icono: '💰',
      color: 'from-cyan-500 to-blue-600',
      obtenida: false,
      progreso: 3,
      meta: 7
    },
    {
      id: 7,
      nombre: 'Estudiante Dedicado',
      descripcion: 'Completa 30 tareas en total',
      icono: '📚',
      color: 'from-blue-500 to-indigo-600',
      obtenida: false,
      progreso: 29,
      meta: 30
    },
    {
      id: 8,
      nombre: 'As de Exámenes',
      descripcion: 'Aprueba 10 exámenes con más de 85 puntos',
      icono: '🏆',
      color: 'from-amber-500 to-yellow-600',
      obtenida: false,
      progreso: 7,
      meta: 10
    }
  ];

  get promedioGeneral(): number {
    if (this.calificaciones.length === 0) return 0;
    const suma = this.calificaciones.reduce((acc, cal) => acc + cal.nota, 0);
    return Math.round(suma / this.calificaciones.length);
  }

  get cursosAprobados(): number {
    return this.calificaciones.filter(c => c.estado === 'aprobado').length;
  }

  get cursosEnProgreso(): number {
    return this.calificaciones.filter(c => c.estado === 'en-progreso').length;
  }

  get insigniasObtenidas(): number {
    return this.insignias.filter(i => i.obtenida).length;
  }

  get totalInsignias(): number {
    return this.insignias.length;
  }

  getColorNota(nota: number): string {
    if (nota >= 90) return 'text-green-600 bg-green-100';
    if (nota >= 70) return 'text-blue-600 bg-blue-100';
    if (nota >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'aprobado': return 'bg-green-100 text-green-800';
      case 'reprobado': return 'bg-red-100 text-red-800';
      case 'en-progreso': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'aprobado': return 'Aprobado';
      case 'reprobado': return 'Reprobado';
      case 'en-progreso': return 'En progreso';
      default: return estado;
    }
  }
}
