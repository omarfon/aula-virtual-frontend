import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  stats = [
    { title: 'Cursos Activos', value: '5', icon: '📚', color: 'bg-blue-500' },
    { title: 'Tareas Pendientes', value: '12', icon: '📝', color: 'bg-yellow-500' },
    { title: 'Tareas Completadas', value: '28', icon: '✅', color: 'bg-green-500' },
    { title: 'Promedio', value: '8.5', icon: '⭐', color: 'bg-purple-500' }
  ];

  recentActivities = [
    { course: 'Matemáticas', activity: 'Nueva tarea asignada', time: 'Hace 2 horas' },
    { course: 'Historia', activity: 'Calificación publicada', time: 'Hace 5 horas' },
    { course: 'Programación', activity: 'Nuevo material disponible', time: 'Ayer' }
  ];
}
