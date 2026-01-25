import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs/operators';
import { AuthService, LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-entrenamiento-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './entrenamiento-login.component.html',
  styleUrls: ['./entrenamiento-login.component.css']
})
export class EntrenamientoLoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  modoRecuperacion = false;
  isSubmitting = false;
  readonly currentYear = new Date().getFullYear();
  private returnUrl = '/home';

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    recordar: [true]
  });

  readonly recoverForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';

    if (this.authService.currentUserValue) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  toggleRecuperacion(): void {
    this.modoRecuperacion = !this.modoRecuperacion;

    if (this.modoRecuperacion) {
      this.recoverForm.reset({ email: this.loginForm.value.email || '' });
    } else {
      this.loginForm.patchValue({ email: this.recoverForm.value.email || this.loginForm.value.email, recordar: true });
      this.loginForm.controls.password.reset('');
    }

    this.loginForm.markAsPristine();
    this.recoverForm.markAsPristine();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const credentials: LoginRequest = {
      email: this.loginForm.value.email || '',
      password: this.loginForm.value.password || ''
    };

    this.authService.login(credentials).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl),
      error: (error) => {
        const message = error?.error?.message || error?.message || 'Credenciales inválidas';
        Swal.fire({
          icon: 'error',
          title: 'Acceso denegado',
          text: message,
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }

  onRecover(): void {
    if (this.recoverForm.invalid) {
      this.recoverForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    setTimeout(() => {
      this.isSubmitting = false;
      Swal.fire({
        icon: 'info',
        title: 'Recuperación enviada',
        text: 'Hemos enviado instrucciones para restablecer tu contraseña.',
        confirmButtonColor: '#2563eb'
      }).then(() => this.toggleRecuperacion());
    }, 600);
  }

  get emailControl() {
    return this.loginForm.controls.email;
  }

  get passwordControl() {
    return this.loginForm.controls.password;
  }

  get recoverEmailControl() {
    return this.recoverForm.controls.email;
  }
}
