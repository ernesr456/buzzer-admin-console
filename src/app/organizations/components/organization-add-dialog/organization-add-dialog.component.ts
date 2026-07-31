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

  organizationForm = this.fb.group({
    name: [this.data.organization?.name ?? '', [Validators.required, Validators.minLength(2)]],
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

    if (this.isEdit && this.data.organization) {
      const updatedOrg: OrganizationModel = {
        ...this.data.organization,
        name: name!,
      };

      this.organizationService.updateOrganization(this.entityId, updatedOrg);
      this.dialogRef.close(updatedOrg);
    } else {
      const newOrg = this.organizationService.createOrganization(this.entityId, {
        name: name!,
        participants: [],
      });

      this.dialogRef.close(newOrg);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}