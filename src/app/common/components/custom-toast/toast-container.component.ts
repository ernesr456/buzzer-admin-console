import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast/toast.service';
import {CustomToastComponent} from './custom-toast.component'
import { Observable } from 'rxjs';
import { Toast } from '../models/toast.model';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, CustomToastComponent],
  template: `
    <div
      class="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2 max-h-screen overflow-y-auto pointer-events-none"
      style="max-width: 90vw;"
    >
      <div *ngFor="let toast of toasts$ | async" class="pointer-events-auto w-full">
        <app-toast [toast]="toast" (dismiss)="dismissToast(toast.id!)"></app-toast>
      </div>
    </div>
  `,
})
export class ToastContainerComponent implements OnInit {
  toasts$!: Observable<Toast[]>;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.toasts$ = this.toastService.toasts$;
  }

  dismissToast(id: string) {
    this.toastService.dismiss(id);
  }
}