import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { PersonasService, Persona, CreatePersonaDto, UpdatePersonaDto } from '../../../../services/personas.service';
import { UsuariosService, UpdateUsuarioDto, CreateUsuarioDto } from '../../../../services/usuarios.service';

@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personas.component.html',
  styleUrls: ['./personas.component.css']
})
export class PersonasComponent implements OnInit {
  private personasService = inject(PersonasService);
  private usuariosService = inject(UsuariosService);
  private cdr = inject(ChangeDetectorRef);
  
  personasCompletas: Persona[] = [];
  personaSeleccionada: Persona | null = null;
  modoEdicion = false;
  modoImportacion = false;
  filtroTipo: string = 'todos';
  terminoBusqueda = '';
  cargando = false;
  guardando = false;
  archivoSeleccionado: File | null = null;
  personasImportadas: CreatePersonaDto[] = [];
  resultadoImportacion: { exitosos: number; fallidos: number; errores: any[] } | null = null;

  ngOnInit(): void {
    this.cargarPersonas();
  }

  async cargarPersonas(): Promise<void> {
    try {
      this.cargando = true;
      this.personasCompletas = [];
      this.cdr.detectChanges();
      
      // Cargar todos los usuarios del sistema (alumnos, instructores, admin)
      const usuariosSistema = await firstValueFrom(this.usuariosService.listarUsuarios()).catch(() => []);
      
      console.log('Usuarios del sistema recibidos:', usuariosSistema);
      
      // Convertir usuarios a formato Persona para mostrarlos en la tabla
      const usuariosComoPersonas: Persona[] = usuariosSistema.map((usuario: any) => {
        const nombreCompleto = usuario.nombre || '';
        const partesNombre = nombreCompleto.trim().split(' ');
        const nombre = partesNombre[0] || '';
        const apellido = partesNombre.slice(1).join(' ') || '';
        
        console.log('Mapeando usuario:', usuario);
        
        const personaMapeada = {
          id: usuario.id,
          _esUsuarioSistema: true, // Flag para identificar que viene del sistema
          nombre: nombre,
          apellido: apellido,
          tipoDocumento: usuario.tipoDocumento || usuario.tipo_documento,
          numeroDocumento: usuario.numeroDocumento || usuario.numero_documento,
          email: usuario.email || '',
          telefono: usuario.telefono,
          telefonoFijo: usuario.telefonoFijo || usuario.telefono_fijo,
          direccion: usuario.direccion,
          areaLabor: usuario.areaLabor || usuario.area_labor,
          fechaIngreso: usuario.fechaIngreso || usuario.fecha_ingreso ? new Date(usuario.fechaIngreso || usuario.fecha_ingreso) : undefined,
          tipo: usuario.rol === 'instructor' ? 'instructor' : usuario.rol === 'admin' ? 'admin' : 'alumno',
          estado: usuario.activo ? 'activo' : 'inactivo',
          fechaRegistro: usuario.createdAt ? new Date(usuario.createdAt) : undefined
        } as any;
        
        console.log('Persona mapeada:', personaMapeada);
        return personaMapeada;
      });
      
      console.log('Usuarios convertidos a personas:', usuariosComoPersonas);
      
      this.personasCompletas = usuariosComoPersonas;
      
      console.log('Total personas completas asignadas:', this.personasCompletas.length);
      console.log('personasCompletas:', this.personasCompletas);
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
      
      // Esperar un tick para asegurar que Angular procese los cambios
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 0);
      
    } catch (error) {
      console.error('Error al cargar personas:', error);
      Swal.fire('Error', 'No se pudieron cargar las personas', 'error');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  get personasFiltradas(): Persona[] {
    console.log('Filtrando personas. Total:', this.personasCompletas.length);
    const filtradas = this.personasCompletas.filter(p => {
      const coincideTipo = this.filtroTipo === 'todos' || p.tipo === this.filtroTipo;
      const coincideBusqueda = !this.terminoBusqueda ||
        (p.nombre || '').toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        (p.apellido || '').toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        (p.email || '').toLowerCase().includes(this.terminoBusqueda.toLowerCase());
      return coincideTipo && coincideBusqueda;
    });
    console.log('Personas filtradas:', filtradas.length);
    return filtradas;
  }

  nuevaPersona(): void {
    this.personaSeleccionada = {
      nombre: '',
      apellido: '',
      tipoDocumento: 'DNI',
      numeroDocumento: '',
      email: '',
      telefono: '',
      telefonoFijo: '',
      direccion: '',
      areaLabor: '',
      tipo: 'alumno',
      estado: 'activo'
    };
    this.modoEdicion = true;
  }

  editarPersona(persona: Persona): void {
    console.log('Editando persona:', persona);
    console.log('Tipo documento:', persona.tipoDocumento);
    console.log('Numero documento:', persona.numeroDocumento);
    this.personaSeleccionada = { ...persona };
    console.log('Persona seleccionada:', this.personaSeleccionada);
    this.modoEdicion = true;
    this.cdr.detectChanges();
  }

  async guardarPersona(): Promise<void> {
    if (!this.personaSeleccionada) return;

    // Validaciones
    if (!this.personaSeleccionada.nombre?.trim()) {
      Swal.fire('Error', 'El nombre es requerido', 'error');
      return;
    }
    if (!this.personaSeleccionada.email?.trim()) {
      Swal.fire('Error', 'El email es requerido', 'error');
      return;
    }

    try {
      this.guardando = true;
      
      if (this.personaSeleccionada.id) {
        // Actualizar usuario existente
        const nombreCompleto = `${this.personaSeleccionada.nombre} ${this.personaSeleccionada.apellido}`.trim();
        
        const dto: UpdateUsuarioDto = {
          nombre: nombreCompleto,
          email: this.personaSeleccionada.email,
          rol: this.personaSeleccionada.tipo === 'instructor' ? 'instructor' : this.personaSeleccionada.tipo === 'admin' ? 'admin' : 'alumno',
          tipoDocumento: this.personaSeleccionada.tipoDocumento || undefined,
          numeroDocumento: this.personaSeleccionada.numeroDocumento || undefined,
          telefono: this.personaSeleccionada.telefono || undefined,
          telefonoFijo: this.personaSeleccionada.telefonoFijo || undefined,
          direccion: this.personaSeleccionada.direccion || undefined,
          areaLabor: this.personaSeleccionada.areaLabor || undefined,
          activo: this.personaSeleccionada.estado === 'activo'
        };

        // Solo agregar fechaIngreso si es válida
        if (this.personaSeleccionada.fechaIngreso && this.personaSeleccionada.fechaIngreso instanceof Date && !isNaN(this.personaSeleccionada.fechaIngreso.getTime())) {
          dto.fechaIngreso = this.personaSeleccionada.fechaIngreso;
        }

        await firstValueFrom(
          this.usuariosService.actualizarUsuario(this.personaSeleccionada.id, dto)
        );

        Swal.fire('Éxito', 'Usuario actualizado correctamente', 'success');
      } else {
        // Crear nuevo usuario en el sistema
        const nombreCompleto = `${this.personaSeleccionada.nombre} ${this.personaSeleccionada.apellido}`.trim();
        
        const dto: CreateUsuarioDto = {
          nombre: nombreCompleto,
          email: this.personaSeleccionada.email,
          password: 'cambiar123', // Contraseña por defecto
          rol: this.personaSeleccionada.tipo === 'instructor' ? 'instructor' : this.personaSeleccionada.tipo === 'admin' ? 'admin' : 'alumno',
          tipoDocumento: this.personaSeleccionada.tipoDocumento || undefined,
          numeroDocumento: this.personaSeleccionada.numeroDocumento || undefined,
          telefono: this.personaSeleccionada.telefono || undefined,
          telefonoFijo: this.personaSeleccionada.telefonoFijo || undefined,
          direccion: this.personaSeleccionada.direccion || undefined,
          areaLabor: this.personaSeleccionada.areaLabor || undefined,
          activo: this.personaSeleccionada.estado === 'activo'
        };

        // Solo agregar fechaIngreso si es válida
        if (this.personaSeleccionada.fechaIngreso && this.personaSeleccionada.fechaIngreso instanceof Date && !isNaN(this.personaSeleccionada.fechaIngreso.getTime())) {
          dto.fechaIngreso = this.personaSeleccionada.fechaIngreso;
        }

        await firstValueFrom(this.usuariosService.crearUsuario(dto));

        Swal.fire({
          title: 'Éxito',
          text: 'Usuario creado correctamente con contraseña: cambiar123',
          icon: 'success'
        });
      }

      this.cancelar();
      await this.cargarPersonas();
    } catch (error: any) {
      console.error('Error al guardar persona:', error);
      let mensaje = 'No se pudo guardar la persona';
      
      if (error?.error?.message) {
        if (Array.isArray(error.error.message)) {
          mensaje = error.error.message.join(', ');
        } else {
          mensaje = error.error.message;
        }
      }
      
      Swal.fire('Error', mensaje, 'error');
    } finally {
      this.guardando = false;
    }
  }

  async eliminarPersona(id: string): Promise<void> {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción eliminará el usuario del sistema',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        this.cargando = true;
        
        // Siempre usar el servicio de usuarios para eliminar
        await firstValueFrom(this.usuariosService.eliminarUsuario(id));
        
        Swal.fire('Eliminado', 'El usuario ha sido eliminado', 'success');
        await this.cargarPersonas();
      } catch (error: any) {
        console.error('Error al eliminar persona:', error);
        const mensaje = error?.error?.message || 'No se pudo eliminar la persona';
        Swal.fire('Error', mensaje, 'error');
      } finally {
        this.cargando = false;
      }
    }
  }

  cancelar(): void {
    this.personaSeleccionada = null;
    this.modoEdicion = false;
  }

  abrirImportacion(): void {
    this.modoImportacion = true;
    this.archivoSeleccionado = null;
    this.personasImportadas = [];
    this.resultadoImportacion = null;
  }

  cerrarImportacion(): void {
    this.modoImportacion = false;
    this.archivoSeleccionado = null;
    this.personasImportadas = [];
    this.resultadoImportacion = null;
  }

  async onArchivoSeleccionado(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const archivo = input.files[0];
    this.archivoSeleccionado = archivo;

    try {
      const XLSX = await import('xlsx');
      const data = await archivo.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      this.personasImportadas = jsonData.map((row: any) => {
        // Validar fecha de ingreso
        const fechaIngresoRaw = row['Fecha Ingreso'] || row['fechaIngreso'];
        let fechaIngreso: Date | undefined = undefined;
        
        if (fechaIngresoRaw && fechaIngresoRaw.toString().trim() !== '') {
          const fecha = new Date(fechaIngresoRaw);
          if (!isNaN(fecha.getTime())) {
            fechaIngreso = fecha;
          }
        }

        return {
          nombre: row['Nombre'] || row['nombre'] || '',
          apellido: row['Apellido'] || row['apellido'] || '',
          tipoDocumento: (row['Tipo Documento'] || row['Tipo de Documento'] || row['tipoDocumento'] || 'DNI') as 'DNI' | 'CE' | 'Pasaporte' | 'RUC',
          numeroDocumento: row['Número Documento'] || row['Numero Documento'] || row['numeroDocumento'] || '',
          email: row['Email'] || row['email'] || '',
          telefono: row['Teléfono Móvil'] || row['Telefono Movil'] || row['telefono'] || '',
          telefonoFijo: row['Teléfono Fijo'] || row['Telefono Fijo'] || row['telefonoFijo'] || '',
          direccion: row['Dirección'] || row['Direccion'] || row['direccion'] || '',
          areaLabor: row['Área de Labor'] || row['Area de Labor'] || row['areaLabor'] || '',
          fechaIngreso: fechaIngreso,
          tipo: (row['Tipo'] || row['tipo'] || 'alumno').toLowerCase() as 'alumno' | 'instructor' | 'admin',
          estado: (row['Estado'] || row['estado'] || 'activo').toLowerCase() as 'activo' | 'inactivo'
        };
      });

      console.log('Personas importadas:', this.personasImportadas);

      if (this.personasImportadas.length === 0) {
        Swal.fire('Advertencia', 'El archivo no contiene datos válidos', 'warning');
      }
    } catch (error) {
      console.error('Error al leer archivo:', error);
      Swal.fire('Error', 'No se pudo leer el archivo Excel', 'error');
      this.archivoSeleccionado = null;
      this.personasImportadas = [];
    }
  }

  async procesarImportacion(): Promise<void> {
    if (this.personasImportadas.length === 0) {
      Swal.fire('Advertencia', 'No hay datos para importar', 'warning');
      return;
    }

    try {
      this.guardando = true;
      
      let exitosos = 0;
      let fallidos = 0;
      const errores: any[] = [];

      // Procesar cada persona individualmente
      for (const persona of this.personasImportadas) {
        try {
          const nombreCompleto = `${persona.nombre} ${persona.apellido}`.trim();
          
          const dto: CreateUsuarioDto = {
            nombre: nombreCompleto,
            email: persona.email,
            password: 'cambiar123',
            rol: persona.tipo === 'instructor' ? 'instructor' : persona.tipo === 'admin' ? 'admin' : 'alumno',
            tipoDocumento: persona.tipoDocumento || undefined,
            numeroDocumento: persona.numeroDocumento || undefined,
            telefono: persona.telefono || undefined,
            telefonoFijo: persona.telefonoFijo || undefined,
            direccion: persona.direccion || undefined,
            areaLabor: persona.areaLabor || undefined,
            activo: persona.estado === 'activo'
          };

          // Solo agregar fechaIngreso si es válida
          if (persona.fechaIngreso && persona.fechaIngreso instanceof Date && !isNaN(persona.fechaIngreso.getTime())) {
            dto.fechaIngreso = persona.fechaIngreso;
          }

          console.log('Creando usuario:', dto);
          const resultado = await firstValueFrom(this.usuariosService.crearUsuario(dto));
          console.log('Usuario creado:', resultado);
          exitosos++;
        } catch (error: any) {
          console.error('Error al crear usuario:', error);
          console.error('Persona que falló:', persona);
          fallidos++;
          const mensajeError = Array.isArray(error?.error?.message) 
            ? error.error.message.join(', ') 
            : error?.error?.message || error?.message || 'Error desconocido';
          errores.push({
            persona: `${persona.nombre} ${persona.apellido}`,
            error: mensajeError
          });
        }
      }

      this.resultadoImportacion = { exitosos, fallidos, errores };

      Swal.fire({
        title: 'Importación Completada',
        html: `
          <p><strong>Exitosos:</strong> ${exitosos}</p>
          <p><strong>Fallidos:</strong> ${fallidos}</p>
        `,
        icon: fallidos > 0 ? 'warning' : 'success'
      });

      await this.cargarPersonas();
      
      if (fallidos === 0) {
        this.cerrarImportacion();
      }
    } catch (error: any) {
      console.error('Error al importar personas:', error);
      const mensaje = error?.error?.message || 'No se pudo completar la importación';
      Swal.fire('Error', mensaje, 'error');
    } finally {
      this.guardando = false;
    }
  }

  descargarPlantilla(): void {
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(
      'Nombre,Apellido,Tipo Documento,Número Documento,Email,Teléfono Móvil,Teléfono Fijo,Dirección,Área de Labor,Fecha Ingreso,Tipo,Estado\n' +
      'Juan,Pérez,DNI,12345678,juan.perez@example.com,987654321,014567890,Av. Principal 123,Desarrollo,2024-01-15,alumno,activo\n' +
      'María,García,DNI,87654321,maria.garcia@example.com,912345678,013456789,Calle Secundaria 456,Recursos Humanos,2023-06-20,instructor,activo\n' +
      'Admin,Sistema,CE,001234567,admin@example.com,999888777,012345678,Plaza Mayor 789,Administración,2022-03-10,admin,activo'
    );
    link.download = 'plantilla_personas.csv';
    link.click();
  }

  getTipoBadgeClass(tipo: string): string {
    const classes: Record<string, string> = {
      alumno: 'bg-blue-100 text-blue-800',
      instructor: 'bg-green-100 text-green-800',
      admin: 'bg-purple-100 text-purple-800'
    };
    return classes[tipo] || 'bg-gray-100 text-gray-800';
  }

  getEstadoBadgeClass(estado: string): string {
    return estado === 'activo' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }
}
