// src/app/core/auth/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return authService.verifyToken().pipe(
    take(1),
    map((user) => {
      if (user) {
        authService.currentUser.set(user);
        authService.isAuthenticated.set(true);
        return true;
      }
      router.navigateByUrl('/login');
      return false;
    })
  );
};