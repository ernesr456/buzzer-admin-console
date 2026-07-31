import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map, take } from 'rxjs';

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

  entity$!: Observable<EntityModel | undefined>;
  sportId!: string;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sportId = params['sportId'];
      const entityId = params['entityId'];

      if (this.sportId && entityId) {
        this.entity$ = this.entityService.getEntityById(this.sportId, entityId).pipe(
          map(entity => {
            if (!entity) {
              this.toast.error('Governing body not found', 'Error');
              this.router.navigate(['/sports', this.sportId]);
              return undefined;
            }
            return entity;
          })
        );
      } else {
        this.entity$ = new Observable(observer => observer.next(undefined));
      }
    });
  }

  getTotalParticipants(organizations: OrganizationModel[]): number {
    if (!organizations) return 0;
    return organizations.reduce((sum, org) => sum + (org.participants?.length || 0), 0);
  }

  private getCurrentEntity(): EntityModel | undefined {
    let entity: EntityModel | undefined;
    this.entity$.pipe(take(1)).subscribe(e => entity = e);
    return entity;
  }

  openEditDialog(entity: EntityModel): void {
    const sportId = this.sportId;
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
        this.refreshEntity();
        this.toast.success(`Entity "${updatedEntity.name}" updated successfully.`, 'Updated');
      }
    });
  }

  deleteEntity(entity: EntityModel): void {
    const sportId = this.sportId;
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

  private refreshEntity(): void {
    this.ngOnInit();
  }

  onOrganizationAdded(newOrg: OrganizationModel): void {
    this.toast.success(`Organization "${newOrg.name}" added successfully.`, 'Added');
    this.refreshEntity();
  }

  onOrganizationEdited(updatedOrg: OrganizationModel): void {
    this.toast.success(`Organization "${updatedOrg.name}" updated successfully.`, 'Updated');
    this.refreshEntity();
  }

  onOrganizationDeleted(orgId: string): void {
    this.toast.success('Organization deleted successfully.', 'Deleted');
    this.refreshEntity();
  }
}