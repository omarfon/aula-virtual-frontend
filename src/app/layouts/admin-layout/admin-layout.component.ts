import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent],
  template: `
    <div class="flex min-h-screen bg-gray-50">
      <app-admin-sidebar></app-admin-sidebar>
      <main class="flex-1 ml-16 md:ml-64 transition-all duration-300 p-6 mt-16">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AdminLayoutComponent {}
