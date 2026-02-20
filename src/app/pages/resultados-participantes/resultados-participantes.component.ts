import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ReportesService, Participante, Estadisticas, CursoCompletado } from '../../services/reportes.service';
import Swal from 'sweetalert2';

interface CriteriosAptitud {
  promedioMinimo: number;
  asistenciaMinima: number;
  tareasMinimas: number;
  examenesAprobadosMinimo: number;
}

@Component({
  selector: 'app-resultados-participantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resultados-participantes.component.html',
  styleUrls: ['./resultados-participantes.component.css']
})
export class ResultadosParticipantesComponent implements OnInit {
  private readonly reportesService = inject(ReportesService);
  private readonly cdr = inject(ChangeDetectorRef);
  
  Math = Math; // Para usar Math.min en el template
  
  // Datos del backend
  participantes: Participante[] = [];
  estadisticasBackend: Estadisticas = {
    total: 0,
    aptos: 0,
    noAptos: 0,
    promedioGeneral: 0
  };
  
  cargandoDatos = true;

  // Datos mock de ejemplo (se pueden eliminar después de probar con backend real)
  participantesMock: any[] = [
    {
      id: '1',
      nombre: 'Carlos Mendoza Torres',
      dni: '72345678',
      email: 'carlos.mendoza@email.com',
      telefono: '+51 987 654 321',
      ciudad: 'Lima',
      cursosCompletados: [
        { nombre: 'Seguridad de la Información', calificacion: 92, fechaFinalizacion: new Date('2026-01-05'), asistencia: 95 },
        { nombre: 'Atención al Cliente', calificacion: 88, fechaFinalizacion: new Date('2025-12-28'), asistencia: 90 }
      ],
      promedioGeneral: 90,
      asistenciaPromedio: 93,
      tareasEntregadas: 18,
      totalTareas: 20,
      examenesAprobados: 7,
      totalExamenes: 8,
      fechaInicio: new Date('2025-11-01'),
      fechaFinalizacion: new Date('2026-01-05'),
      estado: 'completado',
      aptitud: 'apto',
      observaciones: 'Excelente desempeño en todos los módulos'
    },
    {
      id: 2,
      nombre: 'María González Pérez',
      dni: '73456789',
      email: 'maria.gonzalez@email.com',
      telefono: '+51 998 765 432',
      ciudad: 'Arequipa',
      cursosCompletados: [
        { nombre: 'Cajero Exitoso', calificacion: 95, fechaFinalizacion: new Date('2026-01-08'), asistencia: 98 },
        { nombre: 'Seguridad de la Información', calificacion: 91, fechaFinalizacion: new Date('2025-12-30'), asistencia: 95 },
        { nombre: 'Atención al Cliente', calificacion: 89, fechaFinalizacion: new Date('2025-12-20'), asistencia: 92 }
      ],
      promedioGeneral: 92,
      asistenciaPromedio: 95,
      tareasEntregadas: 28,
      totalTareas: 30,
      examenesAprobados: 11,
      totalExamenes: 12,
      fechaInicio: new Date('2025-10-15'),
      fechaFinalizacion: new Date('2026-01-08'),
      estado: 'completado',
      aptitud: 'apto',
      observaciones: 'Sobresaliente en todas las áreas evaluadas'
    },
    {
      id: 3,
      nombre: 'Juan Ramírez Silva',
      dni: '74567890',
      email: 'juan.ramirez@email.com',
      telefono: '+51 976 543 210',
      ciudad: 'Cusco',
      cursosCompletados: [
        { nombre: 'Atención al Cliente', calificacion: 72, fechaFinalizacion: new Date('2026-01-03'), asistencia: 78 }
      ],
      promedioGeneral: 72,
      asistenciaPromedio: 78,
      tareasEntregadas: 7,
      totalTareas: 10,
      examenesAprobados: 2,
      totalExamenes: 4,
      fechaInicio: new Date('2025-12-01'),
      estado: 'en_curso',
      aptitud: 'en_evaluacion',
      observaciones: 'Requiere mejorar asistencia y entrega de tareas'
    },
    {
      id: 4,
      nombre: 'Ana Flores Vega',
      dni: '75678901',
      email: 'ana.flores@email.com',
      telefono: '+51 965 432 109',
      ciudad: 'Trujillo',
      cursosCompletados: [
        { nombre: 'Seguridad de la Información', calificacion: 85, fechaFinalizacion: new Date('2026-01-06'), asistencia: 88 },
        { nombre: 'Cajero Exitoso', calificacion: 87, fechaFinalizacion: new Date('2025-12-25'), asistencia: 90 }
      ],
      promedioGeneral: 86,
      asistenciaPromedio: 89,
      tareasEntregadas: 17,
      totalTareas: 20,
      examenesAprobados: 7,
      totalExamenes: 8,
      fechaInicio: new Date('2025-11-10'),
      fechaFinalizacion: new Date('2026-01-06'),
      estado: 'completado',
      aptitud: 'apto',
      observaciones: 'Buen rendimiento general'
    },
    {
      id: 5,
      nombre: 'Pedro Castillo Rojas',
      dni: '76789012',
      email: 'pedro.castillo@email.com',
      telefono: '+51 954 321 098',
      ciudad: 'Chiclayo',
      cursosCompletados: [
        { nombre: 'Atención al Cliente', calificacion: 58, fechaFinalizacion: new Date('2025-12-28'), asistencia: 65 }
      ],
      promedioGeneral: 58,
      asistenciaPromedio: 65,
      tareasEntregadas: 5,
      totalTareas: 10,
      examenesAprobados: 1,
      totalExamenes: 4,
      fechaInicio: new Date('2025-11-20'),
      estado: 'abandonado',
      aptitud: 'no_apto',
      observaciones: 'No cumple con los requisitos mínimos de calificación y asistencia'
    },
    {
      id: 6,
      nombre: 'Rosa Herrera Díaz',
      dni: '77890123',
      email: 'rosa.herrera@email.com',
      telefono: '+51 943 210 987',
      ciudad: 'Piura',
      cursosCompletados: [
        { nombre: 'Cajero Exitoso', calificacion: 90, fechaFinalizacion: new Date('2026-01-07'), asistencia: 93 },
        { nombre: 'Atención al Cliente', calificacion: 88, fechaFinalizacion: new Date('2025-12-30'), asistencia: 91 }
      ],
      promedioGeneral: 89,
      asistenciaPromedio: 92,
      tareasEntregadas: 19,
      totalTareas: 20,
      examenesAprobados: 7,
      totalExamenes: 8,
      fechaInicio: new Date('2025-11-05'),
      fechaFinalizacion: new Date('2026-01-07'),
      estado: 'completado',
      aptitud: 'apto',
      observaciones: 'Muy buen desempeño en cursos operativos'
    },
    {
      id: 7,
      nombre: 'Luis Alberto Sánchez',
      dni: '78901234',
      email: 'luis.sanchez@email.com',
      telefono: '+51 932 109 876',
      ciudad: 'Lima',
      cursosCompletados: [
        { nombre: 'Seguridad de la Información', calificacion: 91, fechaFinalizacion: new Date('2026-01-04'), asistencia: 94 },
        { nombre: 'Cajero Exitoso', calificacion: 87, fechaFinalizacion: new Date('2025-12-27'), asistencia: 88 }
      ],
      promedioGeneral: 89,
      asistenciaPromedio: 91,
      tareasEntregadas: 18,
      totalTareas: 20,
      examenesAprobados: 7,
      totalExamenes: 8,
      fechaInicio: new Date('2025-11-08'),
      fechaFinalizacion: new Date('2026-01-04'),
      estado: 'completado',
      aptitud: 'apto',
      observaciones: 'Destaca en seguridad informática'
    },
    {
      id: 8,
      nombre: 'Carmen Luz Torres',
      dni: '79012345',
      email: 'carmen.torres@email.com',
      telefono: '+51 921 098 765',
      ciudad: 'Arequipa',
      cursosCompletados: [
        { nombre: 'Atención al Cliente', calificacion: 94, fechaFinalizacion: new Date('2026-01-09'), asistencia: 97 }
      ],
      promedioGeneral: 94,
      asistenciaPromedio: 97,
      tareasEntregadas: 10,
      totalTareas: 10,
      examenesAprobados: 4,
      totalExamenes: 4,
      fechaInicio: new Date('2025-12-05'),
      fechaFinalizacion: new Date('2026-01-09'),
      estado: 'completado',
      aptitud: 'apto',
      observaciones: 'Excelente habilidades de comunicación'
    },
    {
      id: 9,
      nombre: 'Jorge Luis Pacheco',
      dni: '80123456',
      email: 'jorge.pacheco@email.com',
      telefono: '+51 910 987 654',
      ciudad: 'Cusco',
      cursosCompletados: [
        { nombre: 'Cajero Exitoso', calificacion: 68, fechaFinalizacion: new Date('2025-12-31'), asistencia: 72 }
      ],
      promedioGeneral: 68,
      asistenciaPromedio: 72,
      tareasEntregadas: 6,
      totalTareas: 10,
      examenesAprobados: 2,
      totalExamenes: 4,
      fechaInicio: new Date('2025-12-10'),
      estado: 'en_curso',
      aptitud: 'en_evaluacion',
      observaciones: 'Necesita reforzar conceptos básicos'
    },
    {
      id: 10,
      nombre: 'Patricia Morales Castro',
      dni: '81234567',
      email: 'patricia.morales@email.com',
      telefono: '+51 909 876 543',
      ciudad: 'Trujillo',
      cursosCompletados: [
        { nombre: 'Seguridad de la Información', calificacion: 83, fechaFinalizacion: new Date('2026-01-02'), asistencia: 86 },
        { nombre: 'Atención al Cliente', calificacion: 81, fechaFinalizacion: new Date('2025-12-26'), asistencia: 84 }
      ],
      promedioGeneral: 82,
      asistenciaPromedio: 85,
      tareasEntregadas: 16,
      totalTareas: 20,
      examenesAprobados: 6,
      totalExamenes: 8,
      fechaInicio: new Date('2025-11-12'),
      fechaFinalizacion: new Date('2026-01-02'),
      estado: 'completado',
      aptitud: 'apto',
      observaciones: 'Rendimiento consistente'
    },
    {
      id: 11,
      nombre: 'Roberto Vásquez Luna',
      dni: '82345678',
      email: 'roberto.vasquez@email.com',
      telefono: '+51 898 765 432',
      ciudad: 'Chiclayo',
      cursosCompletados: [
        { nombre: 'Cajero Exitoso', calificacion: 77, fechaFinalizacion: new Date('2025-12-29'), asistencia: 81 }
      ],
      promedioGeneral: 77,
      asistenciaPromedio: 81,
      tareasEntregadas: 8,
      totalTareas: 10,
      examenesAprobados: 3,
      totalExamenes: 4,
      fechaInicio: new Date('2025-11-25'),
      fechaFinalizacion: new Date('2025-12-29'),
      estado: 'completado',
      aptitud: 'apto',
      observaciones: 'Cumple con los requisitos mínimos'
    },
    {
      id: 12,
      nombre: 'Sofía Ríos Paredes',
      dni: '83456789',
      email: 'sofia.rios@email.com',
      telefono: '+51 887 654 321',
      ciudad: 'Piura',
      cursosCompletados: [
        { nombre: 'Atención al Cliente', calificacion: 96, fechaFinalizacion: new Date('2026-01-10'), asistencia: 99 },
        { nombre: 'Seguridad de la Información', calificacion: 93, fechaFinalizacion: new Date('2026-01-01'), asistencia: 96 }
      ],
      promedioGeneral: 95,
      asistenciaPromedio: 98,
      tareasEntregadas: 20,
      totalTareas: 20,
      examenesAprobados: 8,
      totalExamenes: 8,
      fechaInicio: new Date('2025-11-01'),
      fechaFinalizacion: new Date('2026-01-10'),
      estado: 'completado',
      aptitud: 'apto',
      observaciones: 'Rendimiento excepcional, candidata destacada'
    },
    {
      id: 13,
      nombre: 'Diego Fernández Ruiz',
      dni: '84567890',
      email: 'diego.fernandez@email.com',
      telefono: '+51 876 543 210',
      ciudad: 'Lima',
      cursosCompletados: [
        { nombre: 'Cajero Exitoso', calificacion: 54, fechaFinalizacion: new Date('2025-12-24'), asistencia: 58 }
      ],
      promedioGeneral: 54,
      asistenciaPromedio: 58,
      tareasEntregadas: 4,
      totalTareas: 10,
      examenesAprobados: 1,
      totalExamenes: 4,
      fechaInicio: new Date('2025-11-28'),
      estado: 'abandonado',
      aptitud: 'no_apto',
      observaciones: 'Bajo rendimiento y asistencia irregular'
    },
    {
      id: 14,
      nombre: 'Gabriela Medina Ortiz',
      dni: '85678901',
      email: 'gabriela.medina@email.com',
      telefono: '+51 865 432 109',
      ciudad: 'Arequipa',
      cursosCompletados: [
        { nombre: 'Seguridad de la Información', calificacion: 88, fechaFinalizacion: new Date('2026-01-05'), asistencia: 91 }
      ],
      promedioGeneral: 88,
      asistenciaPromedio: 91,
      tareasEntregadas: 9,
      totalTareas: 10,
      examenesAprobados: 4,
      totalExamenes: 4,
      fechaInicio: new Date('2025-12-01'),
      fechaFinalizacion: new Date('2026-01-05'),
      estado: 'completado',
      aptitud: 'apto',
      observaciones: 'Muy buena comprensión de conceptos de seguridad'
    },
    {
      id: 15,
      nombre: 'Fernando Quiroz Salazar',
      dni: '86789012',
      email: 'fernando.quiroz@email.com',
      telefono: '+51 854 321 098',
      ciudad: 'Cusco',
      cursosCompletados: [
        { nombre: 'Atención al Cliente', calificacion: 79, fechaFinalizacion: new Date('2026-01-03'), asistencia: 83 },
        { nombre: 'Cajero Exitoso', calificacion: 76, fechaFinalizacion: new Date('2025-12-27'), asistencia: 80 }
      ],
      promedioGeneral: 78,
      asistenciaPromedio: 82,
      tareasEntregadas: 15,
      totalTareas: 20,
      examenesAprobados: 6,
      totalExamenes: 8,
      fechaInicio: new Date('2025-11-15'),
      fechaFinalizacion: new Date('2026-01-03'),
      estado: 'completado',
      aptitud: 'apto',
      observaciones: 'Buen desempeño general'
    },
    {
      id: 16,
      nombre: 'Valeria Castro Núñez',
      dni: '87890123',
      email: 'valeria.castro@email.com',
      telefono: '+51 843 210 987',
      ciudad: 'Trujillo',
      cursosCompletados: [
        { nombre: 'Cajero Exitoso', calificacion: 70, fechaFinalizacion: new Date('2025-12-30'), asistencia: 75 }
      ],
      promedioGeneral: 70,
      asistenciaPromedio: 75,
      tareasEntregadas: 7,
      totalTareas: 10,
      examenesAprobados: 3,
      totalExamenes: 4,
      fechaInicio: new Date('2025-12-03'),
      estado: 'en_curso',
      aptitud: 'en_evaluacion',
      observaciones: 'En proceso de mejora continua'
    },
    {
      id: 17,
      nombre: 'Miguel Ángel Rojas',
      dni: '88901234',
      email: 'miguel.rojas@email.com',
      telefono: '+51 832 109 876',
      ciudad: 'Chiclayo',
      cursosCompletados: [
        { nombre: 'Seguridad de la Información', calificacion: 92, fechaFinalizacion: new Date('2026-01-08'), asistencia: 95 },
        { nombre: 'Atención al Cliente', calificacion: 89, fechaFinalizacion: new Date('2026-01-02'), asistencia: 92 },
        { nombre: 'Cajero Exitoso', calificacion: 91, fechaFinalizacion: new Date('2025-12-28'), asistencia: 94 }
      ],
      promedioGeneral: 91,
      asistenciaPromedio: 94,
      tareasEntregadas: 29,
      totalTareas: 30,
      examenesAprobados: 11,
      totalExamenes: 12,
      fechaInicio: new Date('2025-10-20'),
      fechaFinalizacion: new Date('2026-01-08'),
      estado: 'completado',
      aptitud: 'apto',
      observaciones: 'Completó todos los cursos con excelentes calificaciones'
    },
    {
      id: 18,
      nombre: 'Isabella Vargas Campos',
      dni: '89012345',
      email: 'isabella.vargas@email.com',
      telefono: '+51 821 098 765',
      ciudad: 'Piura',
      cursosCompletados: [
        { nombre: 'Atención al Cliente', calificacion: 85, fechaFinalizacion: new Date('2026-01-04'), asistencia: 88 }
      ],
      promedioGeneral: 85,
      asistenciaPromedio: 88,
      tareasEntregadas: 9,
      totalTareas: 10,
      examenesAprobados: 4,
      totalExamenes: 4,
      fechaInicio: new Date('2025-12-08'),
      fechaFinalizacion: new Date('2026-01-04'),
      estado: 'completado',
      aptitud: 'apto',
      observaciones: 'Excelente trato con clientes'
    },
    {
      id: 19,
      nombre: 'Andrés Maldonado Paz',
      dni: '90123456',
      email: 'andres.maldonado@email.com',
      telefono: '+51 810 987 654',
      ciudad: 'Lima',
      cursosCompletados: [
        { nombre: 'Seguridad de la Información', calificacion: 62, fechaFinalizacion: new Date('2025-12-26'), asistencia: 68 }
      ],
      promedioGeneral: 62,
      asistenciaPromedio: 68,
      tareasEntregadas: 5,
      totalTareas: 10,
      examenesAprobados: 2,
      totalExamenes: 4,
      fechaInicio: new Date('2025-11-30'),
      estado: 'en_curso',
      aptitud: 'en_evaluacion',
      observaciones: 'Requiere acompañamiento adicional'
    }
  ];

  criterios: CriteriosAptitud = {
    promedioMinimo: 70,
    asistenciaMinima: 80,
    tareasMinimas: 80,
    examenesAprobadosMinimo: 70
  };

  // Filtros
  filtroEstado: 'todos' | 'en_curso' | 'completado' | 'abandonado' = 'todos';
  filtroAptitud: 'todos' | 'apto' | 'no_apto' | 'en_evaluacion' = 'todos';
  filtroCiudad: string = 'todas';
  busqueda: string = '';

  // Paginación
  paginaActual: number = 1;
  elementosPorPagina: number = 10;

  // Modal
  participanteSeleccionado: Participante | null = null;
  modalDetalleAbierto = false;
  modalCriteriosAbierto = false;

  ngOnInit() {
    console.log('🚀 Inicializando componente de Resultados de Participantes');
    this.cargarReporte();
  }

  /**
   * Carga el reporte de participantes desde el backend
   */
  cargarReporte() {
    this.cargandoDatos = true;
    this.cdr.detectChanges(); // Forzar actualización para mostrar spinner
    
    console.log('📊 Cargando reporte con criterios:', this.criterios);
    
    this.reportesService.getReporteParticipantes(this.criterios).subscribe({
      next: (response) => {
        console.log('✅ Reporte cargado exitosamente:', response);
        
        this.participantes = response.participantes;
        this.estadisticasBackend = response.estadisticas;
        this.cargandoDatos = false;
        
        // Forzar detección de cambios después de cargar los datos
        this.cdr.detectChanges();
        
        console.log(`📈 Total participantes: ${this.participantes.length}`);
        console.log('🔄 Vista actualizada');
      },
      error: (error) => {
        console.error('❌ Error al cargar reporte:', error);
        this.cargandoDatos = false;
        this.cdr.detectChanges();
        
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar reporte',
          text: 'No se pudo cargar el reporte de participantes. Por favor, intenta nuevamente.',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  get participantesFiltrados(): Participante[] {
    const filtrados = this.participantes.filter(p => {
      const coincideEstado = this.filtroEstado === 'todos' || p.estado === this.filtroEstado;
      const coincideAptitud = this.filtroAptitud === 'todos' || p.aptitud === this.filtroAptitud;
      const coincideCiudad = this.filtroCiudad === 'todas' || p.ciudad === this.filtroCiudad;
      const coincideBusqueda = !this.busqueda || 
        p.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        p.dni.includes(this.busqueda) ||
        p.email.toLowerCase().includes(this.busqueda.toLowerCase());
      
      return coincideEstado && coincideAptitud && coincideCiudad && coincideBusqueda;
    });

    // Aplicar paginación
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return filtrados.slice(inicio, fin);
  }

  get totalParticipantesFiltrados(): number {
    return this.participantes.filter(p => {
      const coincideEstado = this.filtroEstado === 'todos' || p.estado === this.filtroEstado;
      const coincideAptitud = this.filtroAptitud === 'todos' || p.aptitud === this.filtroAptitud;
      const coincideCiudad = this.filtroCiudad === 'todas' || p.ciudad === this.filtroCiudad;
      const coincideBusqueda = !this.busqueda || 
        p.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        p.dni.includes(this.busqueda) ||
        p.email.toLowerCase().includes(this.busqueda.toLowerCase());
      
      return coincideEstado && coincideAptitud && coincideCiudad && coincideBusqueda;
    }).length;
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalParticipantesFiltrados / this.elementosPorPagina);
  }

  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  get ciudadesUnicas(): string[] {
    return [...new Set(this.participantes.map(p => p.ciudad))].sort();
  }

  get estadisticas() {
    // Si tenemos datos del backend, usarlos
    if (this.estadisticasBackend.total > 0) {
      return this.estadisticasBackend;
    }
    
    // Fallback a cálculo local
    return {
      total: this.participantes.length,
      aptos: this.participantes.filter(p => p.aptitud === 'apto').length,
      noAptos: this.participantes.filter(p => p.aptitud === 'no_apto').length,
      promedioGeneral: this.calcularPromedioTotal()
    };
  }

  calcularPromedioTotal(): number {
    if (this.participantes.length === 0) return 0;
    const suma = this.participantes.reduce((acc, p) => acc + p.promedioGeneral, 0);
    return Math.round(suma / this.participantes.length);
  }

  filtrarPorEstado(estado: 'todos' | 'en_curso' | 'completado' | 'abandonado') {
    this.filtroEstado = estado;
    this.paginaActual = 1; // Resetear a primera página al filtrar
  }

  filtrarPorAptitud(aptitud: 'todos' | 'apto' | 'no_apto' | 'en_evaluacion') {
    this.filtroAptitud = aptitud;
    this.paginaActual = 1; // Resetear a primera página al filtrar
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.cambiarPagina(this.paginaActual - 1);
    }
  }

  paginaSiguiente() {
    if (this.paginaActual < this.totalPaginas) {
      this.cambiarPagina(this.paginaActual + 1);
    }
  }

  abrirDetalle(participante: Participante) {
    this.participanteSeleccionado = participante;
    this.modalDetalleAbierto = true;
  }

  cerrarModal() {
    this.modalDetalleAbierto = false;
    this.modalCriteriosAbierto = false;
    this.participanteSeleccionado = null;
  }

  abrirCriterios() {
    this.modalCriteriosAbierto = true;
  }

  calcularPorcentajeTareas(participante: Participante): number {
    if (participante.totalTareas === 0) return 0;
    return Math.round((participante.tareasEntregadas / participante.totalTareas) * 100);
  }

  calcularPorcentajeExamenes(participante: Participante): number {
    if (participante.totalExamenes === 0) return 0;
    return Math.round((participante.examenesAprobados / participante.totalExamenes) * 100);
  }

  reevaluarAptitud(participante: Participante) {
    const porcentajeTareas = this.calcularPorcentajeTareas(participante);
    const porcentajeExamenes = this.calcularPorcentajeExamenes(participante);

    const cumplePromedio = participante.promedioGeneral >= this.criterios.promedioMinimo;
    const cumpleAsistencia = participante.asistenciaPromedio >= this.criterios.asistenciaMinima;
    const cumpleTareas = porcentajeTareas >= this.criterios.tareasMinimas;
    const cumpleExamenes = porcentajeExamenes >= this.criterios.examenesAprobadosMinimo;

    if (participante.estado === 'en_curso') {
      participante.aptitud = 'en_evaluacion';
    } else if (cumplePromedio && cumpleAsistencia && cumpleTareas && cumpleExamenes) {
      participante.aptitud = 'apto';
    } else {
      participante.aptitud = 'no_apto';
    }
  }

  reevaluarTodos() {
    console.log('🔄 Reevaluando con nuevos criterios:', this.criterios);
    this.cerrarModal();
    this.cargarReporte(); // Recargar con los nuevos criterios
    
    Swal.fire({
      icon: 'success',
      title: 'Criterios actualizados',
      text: 'Se ha reevaluado la aptitud de todos los participantes según los nuevos criterios',
      timer: 2000,
      showConfirmButton: false
    });
  }

  exportarReporte() {
    // Preparar datos para Excel
    const datosExcel = this.participantes.map(p => ({
      'N°': p.id,
      'Nombre Completo': p.nombre,
      'DNI': p.dni,
      'Email': p.email,
      'Teléfono': p.telefono,
      'Ciudad': p.ciudad,
      'Promedio General': p.promedioGeneral,
      'Asistencia %': p.asistenciaPromedio,
      'Tareas Entregadas': `${p.tareasEntregadas}/${p.totalTareas}`,
      '% Tareas': this.calcularPorcentajeTareas(p),
      'Exámenes Aprobados': `${p.examenesAprobados}/${p.totalExamenes}`,
      '% Exámenes': this.calcularPorcentajeExamenes(p),
      'Cursos Completados': p.cursosCompletados.length,
      'Estado': this.getTextoEstado(p.estado),
      'Aptitud': this.getTextoAptitud(p.aptitud),
      'Fecha Inicio': this.formatearFecha(p.fechaInicio),
      'Fecha Finalización': p.fechaFinalizacion ? this.formatearFecha(p.fechaFinalizacion) : 'En curso',
      'Observaciones': p.observaciones || ''
    }));

    // Crear libro de trabajo
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    
    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 5 },  // N°
      { wch: 30 }, // Nombre
      { wch: 12 }, // DNI
      { wch: 30 }, // Email
      { wch: 15 }, // Teléfono
      { wch: 15 }, // Ciudad
      { wch: 10 }, // Promedio
      { wch: 12 }, // Asistencia
      { wch: 15 }, // Tareas Entregadas
      { wch: 10 }, // % Tareas
      { wch: 18 }, // Exámenes Aprobados
      { wch: 12 }, // % Exámenes
      { wch: 12 }, // Cursos
      { wch: 12 }, // Estado
      { wch: 15 }, // Aptitud
      { wch: 15 }, // Fecha Inicio
      { wch: 15 }, // Fecha Fin
      { wch: 50 }  // Observaciones
    ];
    ws['!cols'] = columnWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participantes');

    // Agregar hoja de estadísticas (calculadas localmente)
    const enEvaluacion = this.participantes.filter(p => p.aptitud === 'en_evaluacion').length;
    const completados = this.participantes.filter(p => p.estado === 'completado').length;
    const enCurso = this.participantes.filter(p => p.estado === 'en_curso').length;
    
    const estadisticas = [
      { Métrica: 'Total Participantes', Valor: this.estadisticas.total },
      { Métrica: 'Aptos', Valor: this.estadisticas.aptos },
      { Métrica: 'No Aptos', Valor: this.estadisticas.noAptos },
      { Métrica: 'En Evaluación', Valor: enEvaluacion },
      { Métrica: 'Completados', Valor: completados },
      { Métrica: 'En Curso', Valor: enCurso },
      { Métrica: 'Promedio General', Valor: this.estadisticas.promedioGeneral }
    ];
    const wsEstadisticas = XLSX.utils.json_to_sheet(estadisticas);
    wsEstadisticas['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsEstadisticas, 'Estadísticas');

    // Agregar hoja de criterios de aptitud
    const criteriosData = [
      { Criterio: 'Promedio Mínimo', Valor: this.criterios.promedioMinimo },
      { Criterio: 'Asistencia Mínima (%)', Valor: this.criterios.asistenciaMinima },
      { Criterio: 'Tareas Mínimas (%)', Valor: this.criterios.tareasMinimas },
      { Criterio: 'Exámenes Aprobados Mínimo (%)', Valor: this.criterios.examenesAprobadosMinimo }
    ];
    const wsCriterios = XLSX.utils.json_to_sheet(criteriosData);
    wsCriterios['!cols'] = [{ wch: 35 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsCriterios, 'Criterios de Aptitud');

    // Generar archivo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Reporte_Participantes_${fecha}.xlsx`;
    
    try {
      XLSX.writeFile(wb, nombreArchivo);
      
      Swal.fire({
        icon: 'success',
        title: '¡Reporte exportado!',
        text: `El archivo ${nombreArchivo} se ha descargado correctamente`,
        timer: 3000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error al exportar',
        text: 'No se pudo generar el archivo Excel. Por favor, intenta nuevamente.',
        confirmButtonText: 'Entendido'
      });
    }
  }

  formatearFecha(fecha: string | Date): string {
    return new Date(fecha).toLocaleDateString('es-PE', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  }

  getColorAptitud(aptitud: string): string {
    switch (aptitud) {
      case 'apto': return 'bg-green-100 text-green-800';
      case 'no_apto': return 'bg-red-100 text-red-800';
      case 'en_evaluacion': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'completado': return 'bg-blue-100 text-blue-800';
      case 'en_curso': return 'bg-orange-100 text-orange-800';
      case 'abandonado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getTextoAptitud(aptitud: string): string {
    switch (aptitud) {
      case 'apto': return 'APTO';
      case 'no_apto': return 'NO APTO';
      case 'en_evaluacion': return 'EN EVALUACIÓN';
      default: return aptitud;
    }
  }

  getTextoEstado(estado: string): string {
    switch (estado) {
      case 'completado': return 'Completado';
      case 'en_curso': return 'En Curso';
      case 'abandonado': return 'Abandonado';
      default: return estado;
    }
  }
}
