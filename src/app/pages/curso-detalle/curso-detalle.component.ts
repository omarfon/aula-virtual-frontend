import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SanitizeUrlPipe } from '../../pipes/sanitize-url.pipe';
import { CursosService } from '../../services/cursos.service';
import { ProgresoService } from '../../services/progreso.service';
import { Curso } from '../../models/curso.model';
import { ProgresoCurso } from '../../models/progreso.model';

@Component({
  selector: 'app-curso-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, SanitizeUrlPipe],
  templateUrl: './curso-detalle.component.html',
  styleUrls: ['./curso-detalle.component.css']
})
export class CursoDetalleComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly cursosService = inject(CursosService);
  readonly progresoService = inject(ProgresoService); // público para usar en template
  private readonly route = inject(ActivatedRoute);
  private readonly elementRef = inject(ElementRef);
  
  curso: Curso | null = null;
  progresoCurso: ProgresoCurso | null = null;
  cargando = true;
  error: string | null = null;
  unidadExpandida: string | null = null;
  temaSeleccionado: { unidadId: string, temaIndex: number } | null = null;
  
  // Control de auto-completado
  private contenidosTimers = new Map<string, any>();
  private scrollObserver: IntersectionObserver | null = null;
  mostrarCertificado = false;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const cursoId = params['id'];
      this.cargarCurso(cursoId);
    });
  }

  ngAfterViewInit() {
    // Esperar a que el DOM esté listo antes de inicializar observadores
    setTimeout(() => {
      this.inicializarObservadores();
      this.observarContenidos();
    }, 500);
  }

  ngOnDestroy() {
    this.limpiarTimers();
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
  }

  cargarCurso(id: string) {
    this.cargando = true;
    this.error = null;
    
    this.cursosService.getCursoById(id).subscribe({
      next: (curso) => {
        this.curso = curso;
        this.cargando = false;
        
        // Cargar progreso del curso
        if (this.curso.id) {
          this.cargarProgreso(this.curso.id);
        }
        
        // Expandir primera unidad por defecto
        if (this.curso && this.curso.unidades && this.curso.unidades.length > 0) {
          this.unidadExpandida = this.curso.unidades[0].id!;
          
          if (this.curso.unidades[0].temas && this.curso.unidades[0].temas.length > 0) {
            this.temaSeleccionado = { 
              unidadId: this.curso.unidades[0].id!, 
              temaIndex: 0 
            };
          }
        }
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'No se pudo cargar el curso. Por favor, intenta nuevamente.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarProgreso(cursoId: string) {
    if (!this.curso?.unidades) return;
    
    // Primero cargar el progreso desde el backend (esto actualiza el cache)
    this.progresoService.obtenerProgresoCurso(cursoId).subscribe({
      next: () => {
        // Ahora calcular el progreso con el cache actualizado
        this.progresoService.calcularProgresoCurso(cursoId, this.curso!.unidades || []).subscribe({
          next: (progreso) => {
            this.progresoCurso = progreso;
            console.log('✅ Progreso cargado:', progreso);
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('❌ Error al calcular progreso:', err);
          }
        });
      },
      error: (err) => {
        console.error('❌ Error al obtener progreso:', err);
      }
    });
  }

  isUnidadExpandida(unidadId: string | undefined): boolean {
    return this.unidadExpandida === unidadId;
  }

  toggleUnidad(unidadId: string | undefined) {
    if (!unidadId) return;
    this.unidadExpandida = this.unidadExpandida === unidadId ? null : unidadId;
  }

  seleccionarTema(unidadId: string | undefined, temaIndex: number) {
    if (!unidadId) return;
    this.temaSeleccionado = { unidadId, temaIndex };
    if (this.unidadExpandida !== unidadId) {
      this.unidadExpandida = unidadId;
    }
    this.cdr.detectChanges();
    
    // Re-observar contenidos cuando cambia el tema
    setTimeout(() => {
      this.observarContenidos();
    }, 300);
  }

  irSiguienteTema() {
    if (!this.temaActual) return;
    
    console.log('⏭️ Avanzando al siguiente tema');
    
    // Marcar todos los contenidos del tema actual como vistos antes de avanzar
    const contenidos = this.temaActual.tema.contenidos || [];
    const contenidosNoVistos = contenidos.filter(c => 
      c.id && !this.progresoService.isContenidoVisto(this.curso!.id!, c.id)
    );
    
    if (contenidosNoVistos.length > 0) {
      console.log(`📝 Marcando ${contenidosNoVistos.length} contenidos como vistos antes de avanzar`);
      
      // Marcar cada contenido no visto
      let contenidosMarcados = 0;
      
      contenidosNoVistos.forEach((contenido, index) => {
        if (contenido.id) {
          this.progresoService.marcarContenidoVisto({
            cursoId: this.curso!.id!,
            temaId: this.temaActual!.tema.id!,
            contenidoId: contenido.id,
            visto: true
          }).subscribe({
            next: () => {
              contenidosMarcados++;
              console.log(`✅ Contenido ${contenidosMarcados}/${contenidosNoVistos.length} marcado`);
              
              // Cuando todos estén marcados, avanzar al siguiente tema
              if (contenidosMarcados === contenidosNoVistos.length) {
                this.avanzarAlSiguienteTema();
              }
            },
            error: (err) => {
              console.error('❌ Error al marcar contenido:', err);
              // Avanzar de todos modos
              contenidosMarcados++;
              if (contenidosMarcados === contenidosNoVistos.length) {
                this.avanzarAlSiguienteTema();
              }
            }
          });
        }
      });
    } else {
      // Todos los contenidos ya están vistos, avanzar directamente
      console.log('✅ Todos los contenidos ya vistos, avanzando...');
      this.avanzarAlSiguienteTema();
    }
  }

  private avanzarAlSiguienteTema() {
    if (!this.temaActual) return;
    
    const siguienteIndex = this.temaActual.index + 1;
    console.log(`➡️ Seleccionando siguiente tema (índice ${siguienteIndex})`);
    
    this.seleccionarTema(this.temaActual.unidad.id, siguienteIndex);
    
    // Recalcular progreso después de marcar contenidos
    if (this.curso?.unidades) {
      this.progresoService.calcularProgresoCurso(this.curso.id!, this.curso.unidades).subscribe({
        next: (progreso) => {
          this.progresoCurso = progreso;
          this.cdr.detectChanges();
          console.log('✅ Progreso actualizado:', progreso.porcentajeCompletado + '%');
        }
      });
    }
  }

  isTemaSeleccionado(unidadId: string | undefined, temaIndex: number): boolean {
    return this.temaSeleccionado?.unidadId === unidadId && this.temaSeleccionado?.temaIndex === temaIndex;
  }

  get temaActual() {
    if (!this.curso || !this.temaSeleccionado || !this.curso.unidades) {
      return null;
    }
    
    const unidad = this.curso.unidades.find(u => u.id === this.temaSeleccionado!.unidadId);
    if (!unidad || !unidad.temas) {
      return null;
    }
    
    const tema = unidad.temas[this.temaSeleccionado.temaIndex];
    if (!tema) {
      return null;
    }
    
    return { unidad, tema, index: this.temaSeleccionado.temaIndex };
  }

  trackByUnidad(index: number, unidad: any) {
    return unidad.id || index;
  }

  trackByTema(index: number, tema: any) {
    return tema.id || index;
  }

  trackByContenido(index: number, contenido: any) {
    return contenido.id || index;
  }

  // Métodos de progreso
  toggleTemaCompletado(unidadId: string | undefined, temaId: string | undefined) {
    if (!this.curso?.id || !unidadId || !temaId) return;
    
    const estaCompletado = this.isTemaCompletado(unidadId, temaId);
    
    console.log('🔄 Cambiando estado de tema:', { temaId, nuevoEstado: !estaCompletado });
    
    this.progresoService.marcarTemaCompletado({
      cursoId: this.curso.id,
      unidadId: unidadId,
      temaId: temaId,
      completado: !estaCompletado
    }).subscribe({
      next: () => {
        console.log('✅ Tema marcado en BD');
        this.cargarProgreso(this.curso!.id!);
      },
      error: (err) => {
        console.error('❌ Error al marcar tema:', err);
      }
    });
  }

  isTemaCompletado(unidadId: string | undefined, temaId: string | undefined): boolean {
    if (!this.curso?.id || !unidadId || !temaId) return false;
    return this.progresoService.isTemaCompletado(this.curso.id, unidadId, temaId);
  }

  obtenerProgresoUnidad(unidadId: string | undefined): number {
    if (!this.progresoCurso || !unidadId) return 0;
    const unidadProgreso = this.progresoCurso.unidades.find(u => u.unidadId === unidadId);
    return unidadProgreso?.porcentaje || 0;
  }

  get porcentajeProgresoGeneral(): number {
    return this.progresoCurso?.porcentajeCompletado || 0;
  }

  // ========== Métodos de Auto-Completado ==========

  inicializarObservadores() {
    // Observador para detectar cuando un contenido entra en viewport
    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const contenidoId = entry.target.getAttribute('data-contenido-id');
            const tipo = entry.target.getAttribute('data-tipo');
            
            if (contenidoId && tipo) {
              // Solo para imágenes usamos timer (visualización instantánea)
              if (tipo === 'imagen') {
                this.iniciarAutoCompletado(contenidoId, tipo);
              } else {
                console.log(`👁️ Contenido visible (${tipo}):`, contenidoId);
              }
            }
          }
        });
      },
      { threshold: 0.3 } // Reducido a 30% para detectar entrada más temprano
    );
  }

  iniciarAutoCompletado(contenidoId: string, tipo: string) {
    if (!this.curso?.id || !this.temaActual) return;
    
    // Si ya fue visto, no hacer nada
    if (this.progresoService.isContenidoVisto(this.curso.id, contenidoId)) {
      console.log('⏭️ Contenido ya visto:', contenidoId);
      return;
    }

    // Evitar múltiples timers para el mismo contenido
    if (this.contenidosTimers.has(contenidoId)) {
      console.log('⏸️ Timer ya activo para:', contenidoId);
      return;
    }

    // Solo imágenes usan timer (5 segundos)
    if (tipo === 'imagen') {
      console.log(`⏱️ Iniciando timer de 5s para imagen:`, contenidoId);
      
      const timer = setTimeout(() => {
        console.log('⏰ Timer cumplido, marcando imagen:', contenidoId);
        this.marcarContenidoVisto(contenidoId);
        this.contenidosTimers.delete(contenidoId);
      }, 5000);

      this.contenidosTimers.set(contenidoId, timer);
    }
  }

  marcarContenidoVisto(contenidoId: string) {
    if (!this.curso?.id || !this.temaActual) return;

    console.log('📝 Marcando contenido como visto:', contenidoId);

    this.progresoService.marcarContenidoVisto({
      cursoId: this.curso.id,
      temaId: this.temaActual.tema.id!,
      contenidoId: contenidoId,
      visto: true
    }).subscribe({
      next: (progresoActualizado) => {
        console.log('✅ Respuesta del backend - contenido visto:', progresoActualizado);
        
        // El backend devuelve el progreso actualizado y el servicio ya actualizó el caché
        // Ahora recalculamos el progreso usando ese caché actualizado
        if (this.curso?.unidades) {
          this.progresoService.calcularProgresoCurso(this.curso.id!, this.curso.unidades).subscribe({
            next: (progreso) => {
              console.log('📊 Progreso recalculado con caché del backend:', {
                porcentaje: progreso.porcentajeCompletado,
                temasCompletados: progreso.temasCompletados,
                totalTemas: progreso.totalTemas
              });
              this.progresoCurso = progreso;
              
              // Forzar actualización inmediata de la vista
              this.cdr.markForCheck();
              this.cdr.detectChanges();
              
              console.log('✅ Vista actualizada, progreso:', progreso.porcentajeCompletado + '%');
            }
          });
        }
        
        // Verificar si todos los contenidos del tema fueron vistos
        this.verificarTemaCompleto();
      },
      error: (err) => {
        console.error('❌ Error al marcar contenido:', err);
      }
    });
  }

  // Método para marcar contenido cuando se hace scroll hasta el final
  onScrollToBottom(contenidoId: string) {
    if (!this.curso?.id) return;
    
    if (!this.progresoService.isContenidoVisto(this.curso.id, contenidoId)) {
      console.log('📜 Usuario llegó al final del contenido:', contenidoId);
      this.marcarContenidoVisto(contenidoId);
    }
  }

  // Método para detectar reproducción de video
  onVideoPlay(contenidoId: string) {
    if (!this.curso?.id) return;
    
    if (!this.progresoService.isContenidoVisto(this.curso.id, contenidoId)) {
      console.log('▶️ Usuario inició video:', contenidoId);
      this.marcarContenidoVisto(contenidoId);
    }
  }

  // Método para detectar scroll en contenido de texto
  onTextoScroll(event: Event, contenidoId: string) {
    if (!this.curso?.id) return;
    
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    // Verificar si llegó al final (con margen de 50px)
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50;
    
    if (scrolledToBottom && !this.progresoService.isContenidoVisto(this.curso.id, contenidoId)) {
      console.log('📜 Usuario llegó al final del contenido:', contenidoId);
      this.marcarContenidoVisto(contenidoId);
    }
  }

  verificarTemaCompleto() {
    if (!this.curso?.id || !this.temaActual?.unidad?.id || !this.temaActual?.tema?.id) return;

    const contenidosIds = this.temaActual.tema.contenidos?.map(c => c.id!).filter(id => !!id) || [];
    
    this.progresoService.verificarYCompletarTema(
      this.curso.id,
      this.temaActual.unidad.id,
      this.temaActual.tema.id,
      contenidosIds
    ).subscribe({
      next: (completado) => {
        if (completado) {
          console.log('✅ Tema completado, recalculando progreso');
          // Recalcular progreso sin hacer llamada HTTP adicional
          if (this.curso?.unidades) {
            this.progresoService.calcularProgresoCurso(this.curso.id!, this.curso.unidades).subscribe({
              next: (progreso) => {
                this.progresoCurso = progreso;
                this.cdr.detectChanges();
                this.verificarCursoCompleto();
              }
            });
          }
        }
      }
    });
  }

  verificarCursoCompleto() {
    if (!this.curso?.id || !this.curso?.unidades) return;

    const totalTemas = this.curso.unidades.reduce((sum, u) => sum + (u.temas?.length || 0), 0);
    
    if (this.progresoService.cursoCompletado(this.curso.id, totalTemas)) {
      // Curso completado - mostrar certificado
      setTimeout(() => {
        this.mostrarCertificado = true;
        this.cdr.detectChanges();
      }, 1000);
    }
  }

  onVideoProgress(contenidoId: string, porcentaje: number) {
    // Marcar como visto cuando llegue al 80%
    if (porcentaje >= 80 && this.curso?.id) {
      if (!this.progresoService.isContenidoVisto(this.curso.id, contenidoId)) {
        this.marcarContenidoVisto(contenidoId);
      }
    }
  }

  observarContenido(element: HTMLElement, contenidoId: string, tipo: string) {
    if (this.scrollObserver && element) {
      element.setAttribute('data-contenido-id', contenidoId);
      element.setAttribute('data-tipo', tipo);
      this.scrollObserver.observe(element);
    }
  }

  limpiarTimers() {
    this.contenidosTimers.forEach(timer => clearTimeout(timer));
    this.contenidosTimers.clear();
  }

  observarContenidos() {
    if (!this.scrollObserver) {
      console.warn('⚠️ ScrollObserver no inicializado');
      return;
    }
    
    // Desconectar observaciones previas
    this.scrollObserver.disconnect();
    
    // Observar todos los elementos con data-contenido-id
    const elementos = this.elementRef.nativeElement.querySelectorAll('[data-contenido-id]');
    
    if (elementos.length === 0) {
      console.warn('⚠️ No se encontraron elementos con data-contenido-id');
      return;
    }
    
    elementos.forEach((el: HTMLElement) => {
      this.scrollObserver!.observe(el);
      const id = el.getAttribute('data-contenido-id');
      const tipo = el.getAttribute('data-tipo');
      console.log(`👁️ Observando contenido:`, id, tipo);
    });
    
    console.log(`✅ Total de contenidos observados: ${elementos.length}`);
  }

  cerrarCertificado() {
    this.mostrarCertificado = false;
  }

  descargarCertificado() {
    // Aquí se implementaría la generación del PDF del certificado
    alert('Descargando certificado...');
  }
}
