import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StaffService } from '../../services/staff.service';
import { finalize } from 'rxjs/operators';
import { UploadService } from '../../../core/services/upload/upload.service';
import { StaffModel } from '../../mode/staff.model';

export interface StaffDialogData {
  orgId: string;
  staff?: StaffModel;
}

@Component({
  selector: 'app-staff-add-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './staff-add-dialog.component.html',
  styleUrls: ['./staff-add-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffAddDialogComponent {
  private dialogRef = inject(MatDialogRef<StaffAddDialogComponent>);
  private data = inject<StaffDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private staffService = inject(StaffService);
  private uploadService = inject(UploadService);

  staffForm = this.fb.group({
    name: [this.data.staff?.name ?? '', [Validators.required, Validators.minLength(2)]],
    roleTitle: [this.data.staff?.roleTitle ?? '', Validators.required],
    category: [this.data.staff?.category ?? '', Validators.required],
    nationality: [this.data.staff?.nationality ?? '', Validators.required],
  });

  manualUrlControl = new FormControl('');
  showManualInput = signal(false);
  loading = signal(false);

  isEdit = !!this.data.staff;
  orgId = this.data.orgId;
  selectedFile: File | null = null;
  previewUrl: string | null = this.data.staff?.photoUrl ?? null;

  get f() { return this.staffForm.controls; }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.showManualInput.set(false);
      this.manualUrlControl.reset();
      const reader = new FileReader();
      reader.onload = () => { this.previewUrl = reader.result as string; };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.manualUrlControl.reset();
    const fileInput = document.getElementById('photoInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  onManualUrlChange(): void {
    const url = this.manualUrlControl.value?.trim() || '';
    if (url) {
      this.previewUrl = url;
      this.selectedFile = null;
      const fileInput = document.getElementById('photoInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } else {
      this.previewUrl = null;
    }
  }

  submit(): void {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    const { name, roleTitle, category, nationality } = this.staffForm.value;
    this.loading.set(true);

    const manualUrl = this.manualUrlControl.value?.trim() || null;

    if (manualUrl) {
      this.saveStaff(name!, roleTitle!, category!, nationality!, manualUrl);
      return;
    }

    if (this.selectedFile) {
      if (!this.isValidImage(this.selectedFile)) {
        this.loading.set(false);
        return;
      }
      this.uploadService
        .uploadImage(this.selectedFile, undefined, 'file')
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (response) => {
            const photoUrl = response.url || response.imageUrl || response.data?.url;
            if (photoUrl) {
              this.saveStaff(name!, roleTitle!, category!, nationality!, photoUrl);
            } else {
              alert('Upload succeeded but no URL returned. Please enter the URL manually.');
              this.showManualInput.set(true);
            }
          },
          error: (err) => {
            console.error('Upload failed:', err);
            this.showManualInput.set(true);
            alert('Image upload failed. Please enter the image URL manually.');
          },
        });
      return;
    }

    if (this.isEdit) {
      this.saveStaff(name!, roleTitle!, category!, nationality!, this.previewUrl);
    } else {
      alert('Please upload a photo or enter an image URL.');
      this.loading.set(false);
    }
  }

  private isValidImage(file: File): boolean {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image (PNG, JPEG, WEBP, or SVG).');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB.');
      return false;
    }
    return true;
  }

  private saveStaff(
    name: string,
    roleTitle: string,
    category: string,
    nationality: string,
    photoUrl: string | null
  ): void {
    const baseStaff: Partial<StaffModel> = {
      name,
      roleTitle,
      category,
      nationality,
      photoUrl: photoUrl || '',
      organisationId: this.orgId,
    };

    if (this.isEdit && this.data.staff) {
      const updatedStaff: StaffModel = {
        ...this.data.staff,
        ...baseStaff,
        id: this.data.staff.id,
        createdAt: this.data.staff.createdAt,
        updatedAt: new Date(),
      } as StaffModel;
      this.staffService.updatesStaff(updatedStaff).subscribe({
        next: (result) => this.dialogRef.close(result),
        error: (err) => {
          console.error('Update failed:', err);
          alert('Failed to update staff member.');
          this.loading.set(false);
        },
      });
    } else {
      const newStaff: StaffModel = {
        id: '',
        ...baseStaff,
        createdAt: new Date(),
        updatedAt: undefined,
      } as StaffModel;
      this.staffService.addStaff(this.orgId, newStaff).subscribe({
        next: (result) => this.dialogRef.close(result),
        error: (err) => {
          console.error('Add failed:', err);
          alert('Failed to create staff member.');
          this.loading.set(false);
        },
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}