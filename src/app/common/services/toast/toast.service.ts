import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Toast } from './../../components/models/toast.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  private defaultDuration = 3000;
  private idCounter = 0;

  show(toast: Toast) {
    const id = toast.id || `toast-${++this.idCounter}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? this.defaultDuration,
      dismissible: toast.dismissible ?? true,
    };
    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => this.dismiss(id), newToast.duration);
    }
  }

  success(message: string, title?: string, duration?: number) {
    this.show({ type: 'success', message, title, duration });
  }

  error(message: string, title?: string, duration?: number) {
    this.show({ type: 'error', message, title, duration });
  }

  warning(message: string, title?: string, duration?: number) {
    this.show({ type: 'warning', message, title, duration });
  }

  info(message: string, title?: string, duration?: number) {
    this.show({ type: 'info', message, title, duration });
  }

  dismiss(id: string) {
    const current = this.toastsSubject.value;
    this.toastsSubject.next(current.filter(t => t.id !== id));
  }

  clear() {
    this.toastsSubject.next([]);
  }
}