import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  menuOpen = false;
  userMenuOpen = false;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild('userMenuButton')
  userMenuButton?: ElementRef<HTMLButtonElement>;

  @ViewChild('userMenuPanel')
  userMenuPanel?: ElementRef<HTMLDivElement>;

  private readonly rolesAlumno = ['alumno', 'estudiante'];
  private readonly rolesInstructor = ['instructor', 'docente', 'profesor'];
  private readonly rolesAdministrador = ['admin', 'administrador', 'superadmin', 'coordinador'];

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      this.userMenuOpen = false;
    }
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  mostrarDatosUsuario() {
    const usuario = this.usuarioActual;

    if (!usuario) {
      Swal.fire({
        icon: 'info',
        title: 'Sesión no disponible',
        text: 'No se encontró un usuario activo.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const nombre = usuario?.nombre || usuario?.nombreCompleto || usuario?.nombres || usuario?.fullName || usuario?.name || 'Usuario';
    const correo = usuario?.email || usuario?.correo || usuario?.username || 'Sin correo registrado';

    Swal.fire({
      icon: 'info',
      title: nombre,
      text: `Correo: ${correo}`,
      confirmButtonText: 'Cerrar'
    });

    this.userMenuOpen = false;
  }

  cerrarSesion() {
    this.authService.logout();
    this.userMenuOpen = false;
    this.menuOpen = false;
    this.router.navigate(['/entrenamiento/ingreso']);
  }

  get usuarioActual() {
    return this.authService.currentUserValue;
  }

  get esAlumno(): boolean {
    return this.tieneRol(this.rolesAlumno);
  }

  get esInstructor(): boolean {
    return this.tieneRol(this.rolesInstructor);
  }

  get esAdministrador(): boolean {
    return this.tieneRol(this.rolesAdministrador);
  }

  get puedeVerOpcionesAdministrativas(): boolean {
    return this.esInstructor || this.esAdministrador;
  }

  get mostrarMenuAlumno(): boolean {
    return this.esAlumno || this.esAdministrador;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node | null;
    const clickedButton = !!this.userMenuButton?.nativeElement.contains(target as Node);
    const clickedPanel = !!this.userMenuPanel?.nativeElement.contains(target as Node);

    if (!clickedButton && !clickedPanel) {
      this.userMenuOpen = false;
    }
  }

  private tieneRol(rolesBuscados: string[]): boolean {
    const usuario = this.usuarioActual;

    if (!usuario) {
      return false;
    }

    const valores: unknown[] = [
      usuario.rol,
      usuario.role,
      usuario.perfil,
      usuario.profile,
      usuario.tipo,
      usuario.tipoUsuario,
      usuario.perfilUsuario,
      usuario.cargo,
      usuario.position
    ];

    const colecciones = [
      usuario.roles,
      usuario.perfiles,
      usuario.permisos,
      usuario.permisosEspeciales,
      usuario.grupos,
      usuario.asignaciones
    ];

    for (const coleccion of colecciones) {
      if (Array.isArray(coleccion)) {
        valores.push(...coleccion);
      }
    }

    const extraerTexto = (valor: unknown): string => {
      if (typeof valor === 'string') {
        return valor;
      }

      if (valor && typeof valor === 'object') {
        const candidato = valor as Record<string, unknown>;
        const posiblesClaves = ['nombre', 'name', 'role', 'rol', 'descripcion', 'description', 'label', 'tipo'];

        for (const clave of posiblesClaves) {
          const campo = candidato[clave];
          if (typeof campo === 'string') {
            return campo;
          }
        }
      }

      return '';
    };

    return valores.some(valor => {
      const normalizado = extraerTexto(valor).toLowerCase();
      if (!normalizado) {
        return false;
      }

      return rolesBuscados.some(rol => normalizado.includes(rol));
    });
  }
}
