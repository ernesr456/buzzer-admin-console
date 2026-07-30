import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { OrganizationModel } from '../../model/organization.model';
import { OrganizationService } from '../../services/organization.service';
import { OrganizationAddDialogComponent } from '../organization-add-dialog/organization-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../../common/services/toast/toast.service';

@Component({
  selector: 'app-organization-table',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './organization-table.component.html',
  styleUrls: ['./organization-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationTableComponent {
  @Input() organizations: OrganizationModel[] = [];
  @Input() entityId!: string;

  @Output() editOrganization = new EventEmitter<OrganizationModel>();
  @Output() addOrganization = new EventEmitter<OrganizationModel>();
  @Output() deleteOrganizationEvent = new EventEmitter<string>();

  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private organizationService = inject(OrganizationService);
  private toast = inject(ToastService);

  // Optional: compute row data if needed (e.g., participant count)
  get tableRows() {
    return this.organizations
      .filter(org => org != null)
      .map(org => ({
        ...org,
        participantCount: org.participants?.length ?? 0,
      }));
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(OrganizationAddDialogComponent, {
      width: '400px',
      data: { entityId: this.entityId },
    });

    dialogRef.afterClosed().subscribe((newOrg: OrganizationModel | undefined) => {
      if (newOrg) {
        this.addOrganization.emit(newOrg);
        // Update local array
        this.organizations = [...this.organizations, newOrg];
        this.cdr.markForCheck();
        this.toast.success(`Organization "${newOrg.name}" added successfully.`, 'Added');
      }
    });
  }

  openEditDialog(organization: OrganizationModel): void {
    const dialogRef = this.dialog.open(OrganizationAddDialogComponent, {
      width: '400px',
      data: {
        entityId: this.entityId,
        organization: organization,
      },
    });

    dialogRef.afterClosed().subscribe((updatedOrg: OrganizationModel | undefined) => {
      if (updatedOrg) {
        this.editOrganization.emit(updatedOrg);
        // Replace in local array
        const index = this.organizations.findIndex(o => o.id === updatedOrg.id);
        if (index !== -1) {
          const newOrgs = [...this.organizations];
          newOrgs[index] = updatedOrg;
          this.organizations = newOrgs;
          this.cdr.markForCheck();
        }
        this.toast.success(`Organization "${updatedOrg.name}" updated successfully.`, 'Updated');
      }
    });
  }

  deleteOrganization(organization: OrganizationModel): void {
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {
        title: 'Delete Organization',
        message: `Are you sure you want to delete <strong>${organization.name}</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      } as CustomDialogData,
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.organizationService.deleteOrganization(this.entityId, organization.id);
        this.deleteOrganizationEvent.emit(organization.id);
        this.organizations = this.organizations.filter(o => o.id !== organization.id);
        this.cdr.markForCheck();
        this.toast.success(`Organization "${organization.name}" deleted successfully.`, 'Deleted');
      }
    });
  }
}