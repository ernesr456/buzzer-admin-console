// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('buzzer_token');

  // Skip adding token for authentication endpoints
  const isAuthRequest = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  let clonedReq = req;
  if (token && !isAuthRequest) {
    clonedReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(clonedReq).pipe(
    catchError((error) => {
      if (error.status === 401 && !isAuthRequest) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('buzzer_token');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};