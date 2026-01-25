import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, AlertConfig } from '../../services/alert.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="alert" 
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in"
         (click)="onBackdropClick($event)">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scale-in"
           (click)="$event.stopPropagation()">
        
        <!-- Header con icono -->
        <div class="p-6 pb-4">
          <div class="flex items-center justify-center mb-4">
            <!-- Icono de éxito -->
            <div *ngIf="alert.type === 'success'" 
                 class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            
            <!-- Icono de error -->
            <div *ngIf="alert.type === 'error'" 
                 class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            
            <!-- Icono de advertencia -->
            <div *ngIf="alert.type === 'warning'" 
                 class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg class="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            
            <!-- Icono de info -->
            <div *ngIf="alert.type === 'info'" 
                 class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            
            <!-- Icono de confirmación -->
            <div *ngIf="alert.type === 'confirm'" 
                 class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <svg class="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          
          <!-- Título -->
          <h3 class="text-2xl font-bold text-gray-900 text-center mb-2">
            {{ alert.title }}
          </h3>
          
          <!-- Mensaje -->
          <p *ngIf="alert.message" class="text-gray-600 text-center leading-relaxed">
            {{ alert.message }}
          </p>
        </div>
        
        <!-- Botones -->
        <div class="p-6 pt-2 flex gap-3">
          <!-- Botón cancelar (solo para confirmaciones) -->
          <button *ngIf="alert.type === 'confirm'" 
                  (click)="onCancel()"
                  class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all transform hover:scale-105">
            {{ alert.cancelText }}
          </button>
          
          <!-- Botón confirmar/aceptar -->
          <button (click)="onConfirm()"
                  [class]="getConfirmButtonClass()"
                  class="flex-1 px-6 py-3 font-semibold rounded-lg transition-all transform hover:scale-105">
            {{ alert.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes scale-in {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    .animate-fade-in {
      animation: fade-in 0.2s ease-out;
    }
    
    .animate-scale-in {
      animation: scale-in 0.3s ease-out;
    }
  `]
})
export class AlertModalComponent implements OnInit, OnDestroy {
  alert: AlertConfig | null = null;
  private subscription?: Subscription;

  constructor(private alertService: AlertService) {}

  ngOnInit() {
    this.subscription = this.alertService.alert$.subscribe(
      alert => this.alert = alert
    );
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  onConfirm() {
    if (this.alert?.onConfirm) {
      this.alert.onConfirm();
    }
    this.alertService.close();
  }

  onCancel() {
    if (this.alert?.onCancel) {
      this.alert.onCancel();
    }
    this.alertService.close();
  }

  onBackdropClick(event: Event) {
    if (this.alert?.type === 'confirm') {
      this.onCancel();
    } else {
      this.onConfirm();
    }
  }

  getConfirmButtonClass(): string {
    switch (this.alert?.type) {
      case 'success':
        return 'bg-green-600 text-white hover:bg-green-700';
      case 'error':
        return 'bg-red-600 text-white hover:bg-red-700';
      case 'warning':
        return 'bg-yellow-600 text-white hover:bg-yellow-700';
      case 'info':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      case 'confirm':
        return 'bg-orange-600 text-white hover:bg-orange-700';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  }
}
