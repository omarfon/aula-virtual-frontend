import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CursosService {
  private mockCursos = [
    {
      id: 1,
      nombre: 'Matemáticas Avanzadas',
      profesor: 'Prof. García',
      estudiantes: 32,
      color: 'bg-blue-500',
      progreso: 75,
      descripcion: 'Curso avanzado de matemáticas'
    },
    {
      id: 2,
      nombre: 'Historia Universal',
      profesor: 'Prof. Martínez',
      estudiantes: 28,
      color: 'bg-green-500',
      progreso: 60,
      descripcion: 'Historia desde la antigüedad hasta nuestros días'
    },
    {
      id: 3,
      nombre: 'Programación Web',
      profesor: 'Prof. López',
      estudiantes: 25,
      color: 'bg-purple-500',
      progreso: 85,
      descripcion: 'Desarrollo web con tecnologías modernas'
    }
  ];

  constructor() { }

  getCursos(): Observable<any[]> {
    // TODO: Reemplazar con llamada HTTP real
    return of(this.mockCursos);
  }

  getCursoById(id: number): Observable<any> {
    const curso = this.mockCursos.find(c => c.id === id);
    return of(curso);
  }
}
