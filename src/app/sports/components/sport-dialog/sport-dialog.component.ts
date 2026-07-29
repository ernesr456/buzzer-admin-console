import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Sport } from '../../models/sport.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sport-add-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './sport-dialog.component.html',
  styleUrls: ['./sport-dialog.component.scss'],
})
export class SportAddDialogComponent {
  private dialogRef = inject(MatDialogRef<SportAddDialogComponent>);
  private data = inject<Sport | null>(MAT_DIALOG_DATA); // null for add, Sport for edit

  // Pre-fill if editing
  name = this.data?.name ?? '';
  emoji = this.data?.emoji ?? '';
  color = this.data?.color ?? '#FFB414';
  governingBodies = this.data?.governingBodies ?? 0;
  organisations = this.data?.organisations ?? 0;
  participants = this.data?.participants ?? 0;

  isEdit = !!this.data;

  submit(): void {
    this.dialogRef.close({
      name: this.name,
      emoji: this.emoji,
      color: this.color,
      governingBodies: this.governingBodies,
      organisations: this.organisations,
      participants: this.participants,
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}