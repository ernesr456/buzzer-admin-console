import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SportModel } from '../../models/sport.model';
import { SportsService } from '../../services/sports/sports.service';
import { ToastService } from '../../../common/services/toast/toast.service';

@Component({
  selector: 'app-sport-add-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './sport-add-dialog.component.html',
  styleUrls: ['./sport-add-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportAddDialogComponent {
  private dialogRef = inject(MatDialogRef<SportAddDialogComponent>);
  private data = inject<SportModel | null>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private sportsService = inject(SportsService);
  private toast = inject(ToastService);

  sportForm = this.fb.group({
    name: [this.data?.name ?? '', [Validators.required, Validators.minLength(2)]],
    emoji: [this.data?.emoji ?? '', [Validators.required, Validators.minLength(2)]],
    color: [this.data?.color ?? '', [Validators.required, Validators.minLength(2)]]
  });

  isEdit = !!this.data;
  loading = false;

  get f() {
    return this.sportForm.controls;
  }

  submit(): void {
    if (this.sportForm.invalid) {
      this.sportForm.markAllAsTouched();
      return;
    }

    const name = this.sportForm.value.name!;
    this.loading = true;

    if (this.isEdit && this.data) {
      // Update existing sport
      const updatedSport: SportModel = { ...this.data, name };
      this.sportsService.updateSport(this.data.id, updatedSport).subscribe({
        next: () => {
          this.loading = false;
          this.toast.success(`Sport "${name}" updated successfully!`, 'Updated');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.loading = false;
          this.toast.error('Failed to update sport. Please try again.', 'Error');
          console.error('Update error', err);
        }
      });
    } else {
      const newSport: Partial<SportModel> = { name };
      this.sportsService.addSport(newSport as SportModel).subscribe({
        next: () => {
          this.loading = false;
          this.toast.success('Sport added successfully!', 'Added');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.loading = false;
          this.toast.error('Failed to add sport. Please try again.', 'Error');
          console.error('Add error', err);
        }
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}