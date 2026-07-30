// src/app/entities/components/entity-detail/entity-detail.component.ts

import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { CustomBreadcrumbsComponent } from '../../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';
import { EntityModel } from '../../model/entity.model';
import { EntityService } from '../../services/entity.service';
import { OrganizationModel } from '../../../organizations/model/organization.model';
import { OrganizationTableComponent } from '../../../organizations/components/organization-table/organization-table.component';
import { EntityAddDialogComponent } from '../entity-add-dialog/entity-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../../common/services/toast/toast.service';

@Component({
  selector: 'app-entity-detail',
  standalone: true,
  imports: [CommonModule, CustomBreadcrumbsComponent, OrganizationTableComponent],
  templateUrl: './entity-detail.component.html',
  styleUrls: ['./entity-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private entityService = inject(EntityService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  entity?: EntityModel;

  get entityId(): string {
    return this.entity?.id ?? '';
  }

  get organizations(): OrganizationModel[] {
    return this.entity?.organizations ?? [];
  }

  get totalOrganizations(): number {
    return this.entity?.organizations?.length ?? 0;
  }

  // Total participants across all organizations
  get totalParticipants(): number {
    if (!this.entity?.organizations) return 0;
    return this.entity.organizations.reduce(
      (sum, org) => sum + (org.participants?.length ?? 0),
      0
    );
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('entityId');
    if (id) {
      this.entity = this.entityService.getEntityById(id);
      console.log(id);
      if (!this.entity) {
        this.toast.error('Governing body not found', 'Error');
        this.router.navigate(['/sports']);
      }
    }
  }

  openEditDialog(entity: EntityModel): void {
    const sportId = this.entityService.getSportIdForEntity(entity.id);
    if (!sportId) {
      this.toast.error('Could not determine the sport for this entity', 'Error');
      return;
    }

    const dialogRef = this.dialog.open(EntityAddDialogComponent, {
      width: '400px',
      data: {
        sportId: sportId,
        entity: entity,
      },
    });

    dialogRef.afterClosed().subscribe((updatedEntity: EntityModel | undefined) => {
      if (updatedEntity) {
        this.entity = updatedEntity;
        this.toast.success(`Entity "${updatedEntity.name}" updated successfully.`, 'Updated');
      }
    });
  }

  deleteEntity(entity: EntityModel): void {
    const sportId = this.entityService.getSportIdForEntity(entity.id);
    if (!sportId) {
      this.toast.error('Could not determine the sport for this entity', 'Error');
      return;
    }

    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {
        title: 'Delete Governing Body',
        message: `Are you sure you want to delete <strong>${entity.name}</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      } as CustomDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.entityService.deleteEntity(sportId, entity.id);
        this.toast.success(`Entity "${entity.name}" deleted successfully.`, 'Deleted');
        this.router.navigate(['/sports', sportId]);
      }
    });
  }

  onOrganizationAdded(newOrg: OrganizationModel): void {
    if (!this.entity) return;
    // Add to local list
    this.entity.organizations = [...(this.entity.organizations || []), newOrg];
    this.toast.success(`Organization "${newOrg.name}" added successfully.`, 'Added');
  }

  onOrganizationEdited(updatedOrg: OrganizationModel): void {
    if (!this.entity) return;
    const index = this.entity.organizations.findIndex((o) => o.id === updatedOrg.id);
    if (index !== -1) {
      const newOrgs = [...this.entity.organizations];
      newOrgs[index] = updatedOrg;
      this.entity.organizations = newOrgs;
      this.toast.success(`Organization "${updatedOrg.name}" updated successfully.`, 'Updated');
    }
  }

  onOrganizationDeleted(orgId: string): void {
    if (!this.entity) return;
    this.entity.organizations = this.entity.organizations.filter((o) => o.id !== orgId);
    this.toast.success('Organization deleted successfully.', 'Deleted');
  }
}