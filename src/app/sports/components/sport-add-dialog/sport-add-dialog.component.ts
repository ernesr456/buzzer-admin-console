import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { SportModel } from '../../models/sport.model';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sport-add-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './sport-add-dialog.component.html',
  styleUrls: ['./sport-add-dialog.component.scss'],
})
export class SportAddDialogComponent {
  private dialogRef = inject(MatDialogRef<SportAddDialogComponent>);
  private data = inject<SportModel | null>(MAT_DIALOG_DATA); // null for add, Sport for edit

  private fb = inject(FormBuilder);

  sportForm = this.fb.group({
    name: [this.data?.name ?? '', [Validators.required, Validators.minLength(2)]],
    emoji: [this.data?.emoji ?? '', [Validators.required]],
    color: [this.data?.color ?? '#FFB414', [Validators.required]]
  });

  isEdit = !!this.data;

  get f() {
    return this.sportForm.controls;
  }

  submit(): void {
    if (this.sportForm.invalid) {
      this.sportForm.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.sportForm.value);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}