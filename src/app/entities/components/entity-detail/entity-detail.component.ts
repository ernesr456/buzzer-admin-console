import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject, switchMap, of, catchError, startWith, map, takeUntil, BehaviorSubject, finalize } from 'rxjs';

import { CustomBreadcrumbsComponent } from '../../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';
import { EntityModel } from '../../model/entity.model';
import { EntityService } from '../../services/entity.service';
import { OrganizationModel } from '../../../organizations/model/organization.model';
import { OrganizationTableComponent } from '../../../organizations/components/organization-table/organization-table.component';
import { EntityAddDialogComponent } from '../entity-add-dialog/entity-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../../common/services/toast/toast.service';

// Define the possible states of the view
interface EntityViewState {
  loading: boolean;
  error: string | null;
  data: EntityModel | null; // null means not found or not loaded yet
}

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
  private destroy$ = new Subject<void>();

  // Expose the view state as an observable
  viewState$!: Observable<EntityViewState>;

  // We'll keep a separate subject to trigger refreshes
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  ngOnInit(): void {
    // Combine route params and refresh trigger
    this.viewState$ = this.refreshTrigger$.pipe(
      switchMap(() =>
        this.route.params.pipe(
          switchMap(params => {
            const sportId = params['sportId'];
            const entityId = params['entityId'];

            if (!sportId || !entityId) {
              this.router.navigate(['/sports']);
              return of({ loading: false, error: null, data: null });
            }

            // Start loading
            const initialState: EntityViewState = { loading: true, error: null, data: null };

            // Fetch entities for this sport
            return this.entityService.getEntityBySportId(sportId).pipe(
              map(entities => {
                const found = entities.find(e => e.id === entityId) || null;
                return {
                  loading: false,
                  error: null,
                  data: found,
                } as EntityViewState;
              }),
              catchError(err => {
                this.toast.error('Failed to load entity', 'Error');
                return of({
                  loading: false,
                  error: 'Could not load entity. Please try again.',
                  data: null,
                } as EntityViewState);
              }),
              // Show loading while the HTTP request is in progress
              startWith(initialState)
            );
          })
        )
      ),
      takeUntil(this.destroy$)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Call this method to reload the entity (e.g., after edit/delete)
  refreshEntity(): void {
    this.refreshTrigger$.next();
  }

  getTotalParticipants(organizations: OrganizationModel[]): number {
    if (!organizations) return 0;
    return organizations.reduce((sum, org) => sum + (org.participants?.length || 0), 0);
  }

  openEditDialog(entity: EntityModel): void {
    const dialogRef = this.dialog.open(EntityAddDialogComponent, {
      width: '400px',
      data: { sportId: this.route.snapshot.params['sportId'], entity },
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((updatedEntity) => {
      if (updatedEntity) {
        this.toast.success(`Entity "${updatedEntity.name}" updated successfully.`, 'Updated');
        this.refreshEntity();
      }
    });
  }

  deleteEntity(entity: EntityModel): void {
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {
        title: 'Delete Entity',
        message: `Are you sure you want to delete <strong>${entity.name}</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      } as CustomDialogData,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (confirmed) {
        this.entityService.deletesEntity(entity).subscribe({
          next: () => {
            this.toast.success(`Entity "${entity.name}" deleted.`, 'Deleted');
            this.router.navigate(['/sports', this.route.snapshot.params['sportId']]);
          },
          error: () => this.toast.error('Failed to delete entity', 'Error')
        });
      }
    });
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