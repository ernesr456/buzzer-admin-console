// src/app/organizations/components/organization-add-dialog/organization-add-dialog.component.ts

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrganizationService } from '../../services/organization.service';
import { OrganizationModel } from '../../model/organization.model';

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

  // Form with required name; you can add onboardedAt if needed
  organizationForm = this.fb.group({
    name: [this.data.organization?.name ?? '', [Validators.required, Validators.minLength(2)]],
    // Optional: add onboardedAt field if you want to capture it
    // onboardedAt: [this.data.organization?.onboardedAt ?? '', []],
  });

  isEdit = !!this.data.organization;
  entityId = this.data.entityId;

  get f() {
    return this.organizationForm.controls;
  }

  submit(): void {
    if (this.organizationForm.invalid) {
      this.organizationForm.markAllAsTouched();
      return;
    }

    const { name } = this.organizationForm.value;
    // If you have additional fields like onboardedAt, include them here

    if (this.isEdit && this.data.organization) {
      const updated = this.organizationService.updateOrganization(
        this.entityId,
        this.data.organization.id,
        { name } as Partial<OrganizationModel>
        // also pass onboardedAt if you added it
      );
      this.dialogRef.close(updated);
    } else {
      const newOrg = this.organizationService.createOrganization(this.entityId, {
        name: name!,
        participants: [], // default empty; can be added later
        // onboardedAt: this.organizationForm.value.onboardedAt || undefined,
      });
      this.dialogRef.close(newOrg);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}