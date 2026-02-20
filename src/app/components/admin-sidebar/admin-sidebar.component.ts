import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css']
})
export class AdminSidebarComponent {
  sidebarCollapsed = false;

  menuItems: MenuItem[] = [
    {
      label: 'Maestros',
      icon: '📚',
      expanded: false,
      children: [
        {
          label: 'Personas',
          icon: '👥',
          route: '/admin/maestros/personas'
        },
        {
          label: 'Grupos',
          icon: '🎓',
          route: '/admin/maestros/grupos'
        },
        {
          label: 'Empresa',
          icon: '🏢',
          route: '/admin/maestros/empresa'
        }
      ]
    },
    {
      label: 'Seguridad',
      icon: '🔐',
      expanded: false,
      children: [
        {
          label: 'Usuarios',
          icon: '👤',
          route: '/admin/seguridad/usuarios'
        },
        {
          label: 'Roles',
          icon: '🛡️',
          route: '/admin/seguridad/roles'
        },
        {
          label: 'Permisos',
          icon: '🔑',
          route: '/admin/seguridad/permisos'
        }
      ]
    }
  ];

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleSubmenu(item: MenuItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  isActive(route: string | undefined): boolean {
    if (!route) return false;
    return window.location.pathname === route;
  }
}
