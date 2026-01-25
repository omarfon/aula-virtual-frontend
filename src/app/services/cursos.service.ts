import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Curso, CreateCursoDto, UpdateCursoDto } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CursosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cursos`;

  // Mock data de respaldo (mientras se desarrolla el backend)
  private mockCursos = [
    {
      id: '1',
      titulo: 'Matemáticas Avanzadas',
      instructor: 'Prof. García',
      estudiantes: 32,
      nivel: 'Avanzado' as const,
      descripcion: 'Curso avanzado de matemáticas',
      imagen: '/assets/math.jpg',
      categoria: 'Matemáticas',
      duracionTotal: 40,
      unidades: [],
      tareas: [],
      examenes: []
    },
    {
      id: '2',
      titulo: 'Historia Universal',
      instructor: 'Prof. Martínez',
      estudiantes: 28,
      nivel: 'Intermedio' as const,
      descripcion: 'Historia desde la antigüedad hasta nuestros días',
      imagen: '/assets/history.jpg',
      categoria: 'Historia',
      duracionTotal: 30,
      unidades: [],
      tareas: [],
      examenes: []
    },
    {
      id: '3',
      titulo: 'Programación Web',
      instructor: 'Prof. López',
      estudiantes: 25,
      nivel: 'Avanzado' as const,
      descripcion: 'Desarrollo web con tecnologías modernas',
      imagen: '/assets/programming.jpg',
      categoria: 'Tecnología',
      duracionTotal: 60,
      unidades: [],
      tareas: [],
      examenes: []
    }
  ];

  /**
   * Obtiene todos los cursos (optimizado para listado - sin datos anidados)
   * IMPORTANTE: Elimina datos anidados profundos para mejorar rendimiento
   */
  getCursos(): Observable<Curso[]> {
    console.log('🔍 Solicitando cursos desde:', this.apiUrl);
    return this.http.get<unknown>(this.apiUrl).pipe(
      map(respuesta => {
        const cursosLista = this.extraerCursos(respuesta);
        console.log('✅ Cursos recibidos del backend:', cursosLista.length);
        return cursosLista.map(curso => this.normalizarCursoListado(curso));
      }),
      catchError((error) => {
        console.warn('⚠️ Backend no disponible, usando datos de ejemplo locales');
        console.error('Error:', error);
        return of(this.mockCursos);
      })
    );
  }

  /**
   * Obtiene un curso por ID
   */
  getCursoById(id: string): Observable<Curso> {
    console.log('🔍 Solicitando curso por ID:', id, 'desde:', `${this.apiUrl}/${id}`);
    return this.http.get<Curso>(`${this.apiUrl}/${id}`).pipe(
      map(curso => {
        console.log('✅ Curso recibido del backend:', curso.titulo);
        return curso;
      }),
      catchError((error) => {
        console.warn('⚠️ Error al obtener curso del backend, usando mock data:', error);
        const curso = this.mockCursos.find(c => c.id === id);
        if (curso) {
          console.log('✅ Curso encontrado en mock data:', curso.titulo);
          return of(curso);
        }
        console.error('❌ Curso no encontrado ni en backend ni en mock');
        return throwError(() => new Error('Curso no encontrado'));
      })
    );
  }

  /**
   * Crea un nuevo curso
   */
  createCurso(curso: CreateCursoDto): Observable<Curso> {
    return this.http.post<Curso>(this.apiUrl, curso).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un curso existente
   */
  updateCurso(id: string, curso: UpdateCursoDto): Observable<Curso> {
    return this.http.put<Curso>(`${this.apiUrl}/${id}`, curso).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza parcialmente un curso
   */
  patchCurso(id: string, curso: Partial<UpdateCursoDto>): Observable<Curso> {
    return this.http.patch<Curso>(`${this.apiUrl}/${id}`, curso).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un curso
   */
  deleteCurso(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Busca cursos por categoría
   */
  getCursosByCategoria(categoria: string): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.apiUrl}?categoria=${categoria}`).pipe(
      catchError((error) => {
        console.warn('Error al buscar cursos por categoría, usando mock data:', error);
        return of(this.mockCursos.filter(c => c.categoria === categoria));
      })
    );
  }

  /**
   * Busca cursos por nivel
   */
  getCursosByNivel(nivel: string): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.apiUrl}?nivel=${nivel}`).pipe(
      catchError((error) => {
        console.warn('Error al buscar cursos por nivel, usando mock data:', error);
        return of(this.mockCursos.filter(c => c.nivel === nivel));
      })
    );
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código: ${error.status}\nMensaje: ${error.message}`;
      
      if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }
    
    console.error('Error en CursosService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private normalizarCursoListado(curso: any): Curso {
    const id = curso?.id ?? curso?._id ?? curso?.uuid ?? curso?.codigo ?? curso?.slug ?? this.generarIdLocal('curso');
    const titulo = curso?.titulo ?? curso?.nombre ?? 'Curso sin título';
    const instructor = curso?.instructor ?? curso?.docente ?? curso?.teacher ?? 'Instructor no asignado';
    const categoria = curso?.categoria ?? curso?.category ?? 'General';

    const nivelCrudo = (curso?.nivel ?? curso?.level ?? '').toString();
    const nivelesValidos: Curso['nivel'][] = ['Principiante', 'Intermedio', 'Avanzado'];
    const nivelNormalizado = nivelesValidos.includes(nivelCrudo as Curso['nivel'])
      ? nivelCrudo as Curso['nivel']
      : 'Intermedio';

    const duracionTotal = typeof curso?.duracionTotal === 'number'
      ? curso.duracionTotal
      : typeof curso?.duracion === 'number'
        ? curso.duracion
        : undefined;

    const estudiantes = typeof curso?.estudiantes === 'number'
      ? curso.estudiantes
      : Number.isFinite(Number(curso?.totalEstudiantes))
        ? Number(curso.totalEstudiantes)
        : Number.isFinite(Number(curso?.studentsCount))
          ? Number(curso.studentsCount)
          : undefined;

    return {
      id: String(id),
      titulo,
      descripcion: curso?.descripcion ?? curso?.description ?? '',
      instructor,
      nivel: nivelNormalizado,
      imagen: curso?.imagen ?? curso?.imagenUrl ?? curso?.image ?? '',
      categoria,
      estudiantes,
      duracionTotal,
      unidades: Array.isArray(curso?.unidades) ? [] : [],
      tareas: Array.isArray(curso?.tareas) ? [] : [],
      examenes: Array.isArray(curso?.examenes) ? [] : []
    };
  }

  private extraerCursos(respuesta: unknown): any[] {
    if (Array.isArray(respuesta)) {
      return respuesta;
    }

    if (typeof respuesta === 'object' && respuesta !== null) {
      const posiblesClaves = ['cursos', 'courses', 'data', 'items', 'results', 'content', 'records'];
      for (const clave of posiblesClaves) {
        const valor = (respuesta as Record<string, unknown>)[clave];
        if (Array.isArray(valor)) {
          return valor;
        }
        if (valor && typeof valor === 'object') {
          const anidado = this.extraerCursos(valor);
          if (anidado.length) {
            return anidado;
          }
        }
      }
    }

    console.warn('Formato de respuesta no reconocido para cursos:', respuesta);
    return [];
  }

  private generarIdLocal(prefijo: string): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
