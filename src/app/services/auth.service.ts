import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface LoginResponse {
  accessToken: string;
  usuario: any;
  expiresIn: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private readonly tokenKey = 'accessToken';
  private readonly userKey = 'currentUser';

  constructor() {
    const storedUser = localStorage.getItem(this.userKey);
    this.currentUserSubject = new BehaviorSubject<any>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  public getCurrentUserId(): string {
    const user = this.currentUserSubject.value;
    if (user?.id) {
      return user.id.toString();
    }

    throw new Error('No se pudo determinar el ID del usuario actual.');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  login(credentials: LoginRequest) {
    const url = `${environment.apiUrl}/auth/login`;
    return this.http.post<LoginResponse>(url, credentials).pipe(
      tap(response => this.establecerSesion(response))
    );
  }

  logout() {
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('alumnoDemoId');
    this.currentUserSubject.next(null);
  }

  private establecerSesion(respuesta: LoginResponse) {
    if (!respuesta?.accessToken || !respuesta?.usuario) {
      throw new Error('Respuesta inválida del servidor de autenticación');
    }

    localStorage.setItem(this.tokenKey, respuesta.accessToken);
    localStorage.setItem(this.userKey, JSON.stringify(respuesta.usuario));
    this.currentUserSubject.next(respuesta.usuario);
  }
}
