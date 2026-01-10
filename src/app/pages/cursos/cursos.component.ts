import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cursos.component.html',
  styleUrls: ['./cursos.component.css']
})
export class CursosComponent {
  cursos = [
    {
      id: 1,
      nombre: 'Matemáticas Avanzadas',
      profesor: 'Prof. García',
      estudiantes: 32,
      color: 'bg-blue-500',
      progreso: 75
    },
    {
      id: 2,
      nombre: 'Historia Universal',
      profesor: 'Prof. Martínez',
      estudiantes: 28,
      color: 'bg-green-500',
      progreso: 60
    },
    {
      id: 3,
      nombre: 'Programación Web',
      profesor: 'Prof. López',
      estudiantes: 25,
      color: 'bg-purple-500',
      progreso: 85
    },
    {
      id: 4,
      nombre: 'Física Cuántica',
      profesor: 'Prof. Rodríguez',
      estudiantes: 20,
      color: 'bg-red-500',
      progreso: 45
    }
  ];
}
