import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { EmpresaService, ConfiguracionEmpresa, UpdateConfiguracionEmpresaDto } from '../../../../services/empresa.service';

@Component({
  selector: 'app-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './empresa.component.html',
  styleUrls: ['./empresa.component.css']
})
export class EmpresaComponent implements OnInit {
  private readonly empresaService = inject(EmpresaService);

  configuracion: Partial<ConfiguracionEmpresa> = {
    nombreEmpresa: 'Salesland Virtual',
    logoUrl: '',
    colorPrimario: '#2563eb',
    colorSecundario: '#4f46e5',
    email: 'contacto@salesland.com',
    telefono: '+34 900 000 000',
    direccion: 'Madrid, España',
    sitioWeb: 'https://salesland.com',
    descripcion: 'Plataforma de formación virtual',
    terminosServicio: '',
    politicaPrivacidad: ''
  };

  configuracionId: string | null = null;
  cargando = false;
  guardando = false;
  mensaje: { tipo: 'exito' | 'error'; texto: string } | null = null;

  ngOnInit(): void {
    this.cargarConfiguracion();
  }

  async cargarConfiguracion(): Promise<void> {
    this.cargando = true;
    try {
      console.log('Cargando configuración activa...');
      const config = await firstValueFrom(this.empresaService.obtenerConfiguracionActiva());
      console.log('Configuración recibida:', config);
      this.configuracion = config;
      this.configuracionId = config.id;
      console.log('ID de configuración guardado:', this.configuracionId);
    } catch (error: any) {
      console.log('No hay configuración activa, usando valores por defecto');
      console.log('Error:', error);
      this.configuracionId = null;
    } finally {
      this.cargando = false;
    }
  }

  async guardarConfiguracion(): Promise<void> {
    this.guardando = true;
    this.mensaje = null;

    try {
      const dto: UpdateConfiguracionEmpresaDto = {
        nombreEmpresa: this.configuracion.nombreEmpresa,
        logoUrl: this.configuracion.logoUrl,
        colorPrimario: this.configuracion.colorPrimario,
        colorSecundario: this.configuracion.colorSecundario,
        email: this.configuracion.email,
        telefono: this.configuracion.telefono,
        direccion: this.configuracion.direccion,
        sitioWeb: this.configuracion.sitioWeb,
        descripcion: this.configuracion.descripcion,
        terminosServicio: this.configuracion.terminosServicio,
        politicaPrivacidad: this.configuracion.politicaPrivacidad,
        activa: true
      };

      console.log('Guardando configuración:', dto);
      console.log('ID existente:', this.configuracionId);

      let resultado;
      if (this.configuracionId) {
        // Actualizar configuración existente
        console.log('Actualizando configuración existente...');
        resultado = await firstValueFrom(this.empresaService.actualizarConfiguracion(this.configuracionId, dto));
      } else {
        // Crear nueva configuración
        console.log('Creando nueva configuración...');
        resultado = await firstValueFrom(this.empresaService.crearConfiguracion({
          nombreEmpresa: this.configuracion.nombreEmpresa!,
          ...dto
        }));
        this.configuracionId = resultado.id;
      }

      console.log('Resultado del guardado:', resultado);

      Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'Los cambios se han guardado correctamente',
        timer: 3000,
        showConfirmButton: false
      });

      await this.cargarConfiguracion();
    } catch (error: any) {
      console.error('Error completo al guardar configuración:', error);
      console.error('Error response:', error.error);
      console.error('Error status:', error.status);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.error?.message || 'No se pudo guardar la configuración'
      });
    } finally {
      this.guardando = false;
    }
  }

  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.configuracion.logoUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
}
