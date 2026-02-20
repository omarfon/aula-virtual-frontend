import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ExamenesComponent } from './pages/examenes/examenes.component';
import { CursosComponent } from './pages/cursos/cursos.component';
import { CursoDetalleComponent } from './pages/curso-detalle/curso-detalle.component';
import { CalificacionesComponent } from './pages/calificaciones/calificaciones.component';
import { TareasComponent } from './pages/tareas/tareas.component';
import { AdminCursosComponent } from './pages/admin-cursos/admin-cursos.component';
import { ResultadosParticipantesComponent } from './pages/resultados-participantes/resultados-participantes.component';
import { CorreccionExamenesComponent } from './pages/correccion-examenes/correccion-examenes.component';
import { AsignacionCursosComponent } from './pages/asignacion-cursos/asignacion-cursos.component';
import { TomarExamenComponent } from './pages/examenes/tomar-examen.component';
import { HistorialIntentosComponent } from './pages/examenes/historial-intentos.component';
import { EntrenamientoLoginComponent } from './pages/entrenamiento-login/entrenamiento-login.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { PersonasComponent } from './pages/admin/maestros/personas/personas.component';
import { GruposComponent } from './pages/admin/maestros/grupos/grupos.component';
import { EmpresaComponent } from './pages/admin/maestros/empresa/empresa.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'entrenamiento/ingreso', component: EntrenamientoLoginComponent },
  { path: 'cursos', component: CursosComponent, canActivate: [authGuard] },
  { path: 'curso/:id', component: CursoDetalleComponent, canActivate: [authGuard] },
  { path: 'tareas', component: TareasComponent, canActivate: [authGuard] },
  { path: 'examenes', component: ExamenesComponent, canActivate: [authGuard] },
  { path: 'examenes/tomar/:examenAlumnoId', component: TomarExamenComponent, canActivate: [authGuard] },
  { path: 'examenes/historial/:examenAlumnoId', component: HistorialIntentosComponent, canActivate: [authGuard] },
  { path: 'calificaciones', component: CalificacionesComponent, canActivate: [authGuard] },
  { path: 'admin-cursos', component: AdminCursosComponent, canActivate: [authGuard] },
  { path: 'resultados-participantes', component: ResultadosParticipantesComponent, canActivate: [authGuard] },
  { path: 'correccion-examenes', component: CorreccionExamenesComponent, canActivate: [authGuard] },
  { path: 'asignacion-cursos', component: AsignacionCursosComponent, canActivate: [authGuard] },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'maestros/personas', pathMatch: 'full' },
      { path: 'maestros/personas', component: PersonasComponent },
      { path: 'maestros/grupos', component: GruposComponent },
      { path: 'maestros/empresa', component: EmpresaComponent },
      { path: 'seguridad/usuarios', component: PersonasComponent }, // Reutiliza el componente personas
      { path: 'seguridad/roles', component: PersonasComponent }, // Placeholder
      { path: 'seguridad/permisos', component: PersonasComponent } // Placeholder
    ]
  },
  { path: '**', redirectTo: 'home' }
];
