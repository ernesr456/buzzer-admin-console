import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface SportConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'warn' | 'accent';
}


@Component({
  selector: 'app-sport-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule,MatButtonModule],
  templateUrl: './sport-confirm-dialog.component.html',
  styleUrls: ['./sport-confirm-dialog.component.scss'],
})
export class SportConfirmDialogComponent {
  private dialogRef = inject(MatDialogRef<SportConfirmDialogData>);
  data = inject<SportConfirmDialogData>(MAT_DIALOG_DATA);

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}