import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mis-cursos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-cursos.component.html',
  styleUrls: ['./mis-cursos.component.css']
})
export class MisCursosComponent {
  misCursos = [
    {
      id: 1,
      nombre: 'Seguridad de la Información',
      descripcion: 'Fundamentos de ciberseguridad, protección de datos empresariales y gestión de riesgos informáticos',
      profesor: 'Ing. Patricia Ramírez',
      imagen: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop',
      progreso: 65,
      horasCompletadas: 26,
      horasTotales: 40,
      estudiantes: 850,
      calificacion: 4.8,
      nivel: 'Intermedio',
      categoria: 'Seguridad',
      proximaClase: '2026-01-12',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 2,
      nombre: 'Atención al Cliente',
      descripcion: 'Técnicas y estrategias para brindar un servicio de excelencia, manejo de quejas y fidelización',
      profesor: 'Lic. Jorge Mendoza',
      imagen: 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=400&h=250&fit=crop',
      progreso: 82,
      horasCompletadas: 33,
      horasTotales: 40,
      estudiantes: 1250,
      calificacion: 4.9,
      nivel: 'Básico',
      categoria: 'Servicio',
      proximaClase: '2026-01-11',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 3,
      nombre: 'Cajero Exitoso',
      descripcion: 'Gestión eficiente de operaciones bancarias, manejo de efectivo y atención en ventanilla',
      profesor: 'Lic. Rosa Villegas',
      imagen: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop',
      progreso: 45,
      horasCompletadas: 18,
      horasTotales: 40,
      estudiantes: 620,
      calificacion: 4.7,
      nivel: 'Básico',
      categoria: 'Finanzas',
      proximaClase: '2026-01-13',
      color: 'from-green-500 to-emerald-600'
    }
  ];

  filtroActivo = 'todos';
  ordenActivo = 'progreso';

  getTotalHorasCompletadas() {
    return this.misCursos.reduce((total, curso) => total + curso.horasCompletadas, 0);
  }

  getProgresoPromedio() {
    const total = this.misCursos.reduce((sum, curso) => sum + curso.progreso, 0);
    return Math.round(total / this.misCursos.length);
  }

  get cursosEnProgreso() {
    return this.misCursos.filter(c => c.progreso > 0 && c.progreso < 100).length;
  }

  get cursosFiltrados() {
    let cursos = [...this.misCursos];
    
    if (this.filtroActivo !== 'todos') {
      cursos = cursos.filter(c => c.categoria.toLowerCase() === this.filtroActivo.toLowerCase());
    }
    
    if (this.ordenActivo === 'progreso') {
      cursos.sort((a, b) => b.progreso - a.progreso);
    } else if (this.ordenActivo === 'nombre') {
      cursos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (this.ordenActivo === 'proximaClase') {
      cursos.sort((a, b) => new Date(a.proximaClase).getTime() - new Date(b.proximaClase).getTime());
    }
    
    return cursos;
  }

  filtrar(filtro: string) {
    this.filtroActivo = filtro;
  }

  ordenar(orden: string) {
    this.ordenActivo = orden;
  }
}
