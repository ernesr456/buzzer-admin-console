import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map, takeUntil, Subject } from 'rxjs';

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
export class EntityDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private entityService = inject(EntityService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  entity$!: Observable<EntityModel | undefined>;
  sportId!: string;
  entityId!: string;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.sportId = params['sportId'];
      this.entityId = params['entityId'];

      if (this.sportId && this.entityId) {
        this.entity$ = this.entityService.getEntityById(this.sportId, this.entityId).pipe(
          map(entity => {
            if (!entity) {
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getTotalParticipants(organizations: OrganizationModel[]): number {
    if (!organizations) return 0;
    return organizations.reduce((sum, org) => sum + (org.participants?.length || 0), 0);
  }

  openEditDialog(entity: EntityModel): void {
    const dialogRef = this.dialog.open(EntityAddDialogComponent, {
      width: '400px',
      data: { sportId: this.sportId, entity },
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((updatedEntity) => {
      if (updatedEntity) {
        this.toast.success(`Entity "${updatedEntity.name}" updated successfully.`, 'Updated');
      }
    });
  }

  deleteEntity(entity: EntityModel): void {
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

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed) => {
      if (confirmed) {
        this.entityService.deleteEntity(this.sportId, entity.id);
        this.toast.success(`Entity "${entity.name}" deleted successfully.`, 'Deleted');
        this.router.navigate(['/sports', this.sportId]);
      }
    });
  }

  onOrganizationAdded(newOrg: OrganizationModel): void {
    this.toast.success(`Organization "${newOrg.name}" added successfully.`, 'Added');
    this.entityService.refreshEntity(this.sportId, this.entityId);
  }

  onOrganizationEdited(updatedOrg: OrganizationModel): void {
    this.toast.success(`Organization "${updatedOrg.name}" updated successfully.`, 'Updated');
    this.entityService.refreshEntity(this.sportId, this.entityId);
  }

  onOrganizationDeleted(orgId: string): void {
    this.toast.success('Organization deleted successfully.', 'Deleted');
    this.entityService.refreshEntity(this.sportId, this.entityId);
  }
}