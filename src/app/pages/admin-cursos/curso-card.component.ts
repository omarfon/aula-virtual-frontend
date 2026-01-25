import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Curso } from '../../models';

@Component({
  selector: 'app-curso-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all group">
      <!-- Imagen -->
      <div class="h-40 bg-gradient-to-br from-orange-500 to-orange-600 relative overflow-hidden">
        <img *ngIf="curso.imagen" [src]="curso.imagen" [alt]="curso.titulo"
          loading="lazy" class="w-full h-full object-cover">
        <div *ngIf="!curso.imagen" class="flex items-center justify-center h-full text-white text-6xl">
          📚
        </div>
      </div>

      <!-- Contenido -->
      <div class="p-4">
        <h3 class="font-bold text-lg text-gray-800 mb-2 line-clamp-2">{{ curso.titulo }}</h3>
        <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ curso.descripcion }}</p>

        <div class="space-y-2 mb-4">
          <div class="flex items-center text-sm text-gray-700">
            <span class="font-semibold mr-2">👨‍🏫</span>
            <span>{{ curso.instructor }}</span>
          </div>
          <div class="flex items-center text-sm text-gray-700">
            <span class="font-semibold mr-2">📊</span>
            <span>Nivel {{ curso.nivel }}</span>
          </div>
          <div class="flex items-center text-sm text-gray-700">
            <span class="font-semibold mr-2">⏱️</span>
            <span>{{ curso.duracionTotal }}h totales</span>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex gap-2">
          <button (click)="onEditar(); $event.stopPropagation()"
            class="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm">
            ✏️ Editar
          </button>
          <button (click)="onEliminar(); $event.stopPropagation()"
            class="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    </div>
  `
})
export class CursoCardComponent {
  @Input({ required: true }) curso!: Curso;
  @Output() editar = new EventEmitter<void>();
  @Output() eliminar = new EventEmitter<void>();

  onEditar() {
    console.log('📤 Emitiendo evento editar para:', this.curso.titulo);
    this.editar.emit();
  }

  onEliminar() {
    console.log('📤 Emitiendo evento eliminar para:', this.curso.titulo);
    this.eliminar.emit();
  }
}
