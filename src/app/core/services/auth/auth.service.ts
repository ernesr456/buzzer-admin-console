// src/app/core/auth/services/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, tap, of } from 'rxjs';
import { environment } from '../../../../environment/environment';

interface LoginResponse {
  token: string;
  user: { id: string; email: string; role: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'buzzer_token';
  private readonly USER_KEY = 'buzzer_user';

  // Signals for reactive state
  readonly isAuthenticated = signal<boolean>(this.hasToken());
  readonly currentUser = signal<LoginResponse['user'] | null>(
    this.getStoredUser()
  );

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): LoginResponse['user'] | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, { email, password })
      .pipe(
        tap((response) => {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
          this.isAuthenticated.set(true);
          this.currentUser.set(response.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigateByUrl('/login');
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  verifyToken(): Observable<LoginResponse['user'] | null> {
  return this.http.get<LoginResponse['user']>(`${environment.apiBaseUrl}/auth/me`).pipe(
    catchError(() => of(null))
    );
  }
}