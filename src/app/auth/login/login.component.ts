// src/app/auth/login/login.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, catchError, finalize, map, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Form fields
  email = '';
  password = '';

  // UI state
  readonly isSubmitting = signal(false);
  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hasSubmitted = signal(false);

  // Submission stream
  private submitRequests$ = new Subject<void>();

  // Convert to signal for template binding
  private submitAction = toSignal(
    this.submitRequests$.pipe(
      switchMap(() => {
        this.errorMessage.set(null);
        this.isSubmitting.set(true);
        return this.authService.login(this.email.trim(), this.password).pipe(
          map(() => {
            this.router.navigateByUrl('/dashboard');
          }),
          catchError((error) => {
            this.errorMessage.set(this.formatAuthError(error));
            return of(null);
          }),
          finalize(() => this.isSubmitting.set(false))
        );
      })
    ),
    { initialValue: null }
  );

  onSubmit(form: NgForm): void {
    if (this.isSubmitting()) return;
    this.hasSubmitted.set(true);

    if (!form.valid) {
      this.errorMessage.set('Please check your email and password.');
      return;
    }

    this.submitRequests$.next();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  private formatAuthError(error: any): string {
    if (error.error?.message) return error.error.message;
    if (error.status === 0) return 'Network error. Please check your connection.';
    return 'Authentication failed. Please try again.';
  }
}