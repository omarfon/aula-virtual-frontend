import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface AlertConfig {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new Subject<AlertConfig | null>();
  alert$ = this.alertSubject.asObservable();

  /**
   * Muestra una alerta de éxito
   */
  success(title: string, message: string = '') {
    this.alertSubject.next({
      title,
      message,
      type: 'success',
      confirmText: 'Aceptar'
    });
  }

  /**
   * Muestra una alerta de error
   */
  error(title: string, message: string = '') {
    this.alertSubject.next({
      title,
      message,
      type: 'error',
      confirmText: 'Aceptar'
    });
  }

  /**
   * Muestra una alerta de advertencia
   */
  warning(title: string, message: string = '') {
    this.alertSubject.next({
      title,
      message,
      type: 'warning',
      confirmText: 'Aceptar'
    });
  }

  /**
   * Muestra una alerta de información
   */
  info(title: string, message: string = '') {
    this.alertSubject.next({
      title,
      message,
      type: 'info',
      confirmText: 'Aceptar'
    });
  }

  /**
   * Muestra un diálogo de confirmación
   */
  confirm(
    title: string, 
    message: string = '', 
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar'
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.alertSubject.next({
        title,
        message,
        type: 'confirm',
        confirmText,
        cancelText,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  }

  /**
   * Cierra la alerta actual
   */
  close() {
    this.alertSubject.next(null);
  }
}
