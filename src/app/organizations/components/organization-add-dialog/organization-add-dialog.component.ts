import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrganizationService } from '../../services/organization.service';
import { OrganizationModel } from '../../model/organization.model';
import { finalize } from 'rxjs/operators';
import { UploadService } from '../../../core/services/upload/upload.service';

export interface OrganizationDialogData {
  entityId: string;
  organization?: OrganizationModel;
}

@Component({
  selector: 'app-organization-add-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './organization-add-dialog.component.html',
  styleUrls: ['./organization-add-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationAddDialogComponent {
  private dialogRef = inject(MatDialogRef<OrganizationAddDialogComponent>);
  private data = inject<OrganizationDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private organizationService = inject(OrganizationService);
  private uploadService = inject(UploadService);

  organizationForm = this.fb.group({
    name: [this.data.organization?.name ?? '', [Validators.required, Validators.minLength(2)]],
    type: [this.data.organization?.type ?? '', Validators.required],
    country: [this.data.organization?.country ?? '', Validators.required],
  });

  // Optional manual URL fallback (shown on upload failure)
  manualUrlControl = new FormControl('');
  showManualInput = signal(false);

  isEdit = !!this.data.organization;
  entityId = this.data.entityId;
  selectedFile: File | null = null;
  previewUrl: string | null = this.data.organization?.crestUrl ?? null;
  loading = false;

  get f() { return this.organizationForm.controls; }

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
    this.previewUrl = this.isEdit ? this.data.organization?.crestUrl ?? null : null;
    this.manualUrlControl.reset();
    const fileInput = document.getElementById('logoInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  submit(): void {
    if (this.organizationForm.invalid) {
      this.organizationForm.markAllAsTouched();
      return;
    }


    const { name, type, country } = this.organizationForm.value;
    this.loading = true;
    const manualUrl = this.manualUrlControl.value?.trim() || null;
    if (manualUrl) {
      this.saveOrganization(name!, type!, country!, manualUrl);
      return;
    }

    if (this.isEdit && !this.selectedFile && this.data.organization?.crestUrl) {
      this.saveOrganization(name!, type!, country!, this.data.organization.crestUrl);
      return;
    }

    if (!this.selectedFile) {
      alert('Please upload a logo image or enter a URL.');
      return;
    }

    // Validate file
    if (!this.isValidImage(this.selectedFile)) {
      return;
    }
    this.uploadService.uploadImage(this.selectedFile, undefined, 'file')
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          const crestUrl = response.url;
          if (crestUrl) {
            this.saveOrganization(name!, type!, country!, crestUrl);
          } else {
            alert('Upload succeeded but no URL returned. Please enter URL manually.');
            this.showManualInput.set(true);
          }
        },
        error: (err) => {
          console.error('Upload failed:', err);
          this.showManualInput.set(true);
          alert('Image upload failed. Please enter the image URL manually.');
        }
      });
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

  private saveOrganization(name: string, type: string, country: string, crestUrl: string): void {
    const baseOrg: Partial<OrganizationModel> = {
      name,
      type,
      country,
      crestUrl,
      governingBodyId: this.entityId,
    };

    if (this.isEdit && this.data.organization) {
      const updatedOrg: OrganizationModel = {
        ...this.data.organization,
        ...baseOrg,
        id: this.data.organization.id,
      };
      this.organizationService.updatesOrganization(updatedOrg).subscribe({
        next: (result) => this.dialogRef.close(result),
        error: (err) => {
          console.error('Update failed:', err);
          alert('Failed to update organization.');
        }
      });
    } else {
      const newOrg: OrganizationModel = {
        id: '',
        ...baseOrg,
        participants: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        onboardedAt: new Date(),
      } as OrganizationModel;
      this.organizationService.addOrganization(this.entityId, newOrg).subscribe({
        next: (result) => this.dialogRef.close(result),
        error: (err) => {
          console.error('Add failed:', err);
          alert('Failed to create organization.');
        }
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}