import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { GruposService, Grupo, CreateGrupoDto, UpdateGrupoDto } from '../../../../services/grupos.service';

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grupos.component.html',
  styleUrls: ['./grupos.component.css']
})
export class GruposComponent implements OnInit {
  private readonly gruposService = inject(GruposService);

  grupos: Grupo[] = [];
  grupoSeleccionado: Partial<Grupo> | null = null;
  modoEdicion = false;
  cargando = false;
  guardando = false;

  ngOnInit(): void {
    this.cargarGrupos();
  }

  async cargarGrupos(): Promise<void> {
    this.cargando = true;
    try {
      this.grupos = await firstValueFrom(this.gruposService.listarGrupos());
    } catch (error) {
      console.error('Error al cargar grupos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los grupos'
      });
    } finally {
      this.cargando = false;
    }
  }

  nuevoGrupo(): void {
    this.grupoSeleccionado = {
      nombre: '',
      descripcion: '',
      capacidadMaxima: 30,
      color: '#3b82f6',
      estado: 'activo'
    };
    this.modoEdicion = true;
  }

  editarGrupo(grupo: Grupo): void {
    this.grupoSeleccionado = { ...grupo };
    this.modoEdicion = true;
  }

  async guardarGrupo(): Promise<void> {
    if (!this.grupoSeleccionado || this.guardando) {
      return;
    }

    this.guardando = true;

    try {
      if (this.grupoSeleccionado.id) {
        // Actualizar
        const dto: UpdateGrupoDto = {
          nombre: this.grupoSeleccionado.nombre,
          descripcion: this.grupoSeleccionado.descripcion,
          capacidadMaxima: this.grupoSeleccionado.capacidadMaxima,
          color: this.grupoSeleccionado.color,
          estado: this.grupoSeleccionado.estado
        };
        await firstValueFrom(this.gruposService.actualizarGrupo(this.grupoSeleccionado.id, dto));
        
        Swal.fire({
          icon: 'success',
          title: 'Grupo actualizado',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Crear
        const dto: CreateGrupoDto = {
          nombre: this.grupoSeleccionado.nombre!,
          descripcion: this.grupoSeleccionado.descripcion,
          capacidadMaxima: this.grupoSeleccionado.capacidadMaxima!,
          color: this.grupoSeleccionado.color,
          estado: this.grupoSeleccionado.estado
        };
        await firstValueFrom(this.gruposService.crearGrupo(dto));
        
        Swal.fire({
          icon: 'success',
          title: 'Grupo creado',
          timer: 2000,
          showConfirmButton: false
        });
      }

      await this.cargarGrupos();
      this.cancelar();
    } catch (error) {
      console.error('Error al guardar grupo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el grupo'
      });
    } finally {
      this.guardando = false;
    }
  }

  async eliminarGrupo(id: string): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar grupo?',
      text: 'Esta acción no se puede deshacer',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        await firstValueFrom(this.gruposService.eliminarGrupo(id));
        
        Swal.fire({
          icon: 'success',
          title: 'Grupo eliminado',
          timer: 2000,
          showConfirmButton: false
        });
        
        await this.cargarGrupos();
      } catch (error) {
        console.error('Error al eliminar grupo:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el grupo'
        });
      }
    }
  }

  cancelar(): void {
    this.grupoSeleccionado = null;
    this.modoEdicion = false;
  }

  getEstadoBadgeClass(estado: string): string {
    return estado === 'activo' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  getOcupacionColor(grupo: Grupo): string {
    const estudiantesActuales = grupo.alumnos?.length || 0;
    const porcentaje = (estudiantesActuales / grupo.capacidadMaxima) * 100;
    if (porcentaje >= 90) return 'text-red-600';
    if (porcentaje >= 70) return 'text-yellow-600';
    return 'text-green-600';
  }

  getEstudiantesActuales(grupo: Grupo): number {
    return grupo.alumnos?.length || 0;
  }
}
