import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AlertModalComponent } from './shared/alert-modal/alert-modal.component';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, NavbarComponent, AlertModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('aula-virtual');
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ocultarLayout = signal(this.esRutaSinLayout(this.router.url));
  protected readonly mostrarNavbar = computed(() => !this.ocultarLayout());

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => {
        this.ocultarLayout.set(this.esRutaSinLayout(event.urlAfterRedirects));
      });
  }

  private esRutaSinLayout(url: string): boolean {
    return url.startsWith('/entrenamiento/ingreso');
  }
}
