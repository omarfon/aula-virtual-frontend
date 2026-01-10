import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CursosComponent } from './pages/cursos/cursos.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'cursos', component: CursosComponent },
  { path: 'tareas', component: DashboardComponent }, // Placeholder
  { path: 'calificaciones', component: DashboardComponent }, // Placeholder
  { path: '**', redirectTo: '/dashboard' }
];
