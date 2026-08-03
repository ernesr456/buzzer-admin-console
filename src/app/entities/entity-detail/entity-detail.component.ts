import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, finalize, catchError, of } from 'rxjs';
import { CustomBreadcrumbsComponent } from '../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';
import { EntityModel } from '../model/entity.model';
import { EntityService } from '../services/entity.service';
import { OrganizationTableComponent } from '../../organizations/components/organization-table/organization-table.component';
import { EntityAddDialogComponent } from '../components/entity-add-dialog/entity-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../common/services/toast/toast.service';
import { OrganizationService } from '../../organizations/services/organization.service';
import { ParticipantService } from '../../participants/services/participant.service';

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
  private organizationService = inject(OrganizationService);
  private participantService = inject(ParticipantService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);
  private destroy$ = new Subject<void>();

  // Signals
  sportId = signal('');
  entityId = signal('');
  entities = signal<EntityModel[]>([]);
  organizations = signal<any[]>([]);
  participants = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Computed entity (may be null if not found)
  entity = computed(() => {
    const id = this.entityId();
    return this.entities().find(e => e.id === id) ?? null;
  });

  // Computed counts
  totalOrganizations = computed(() => this.organizations().length);
  totalParticipants = computed(() => this.participants().length);

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const sportId = params['sportId'];
        const entityId = params['entityId'];
        if (!sportId || !entityId) {
          this.router.navigate(['/sports']);
          return;
        }
        this.sportId.set(sportId);
        this.entityId.set(entityId);
        this.loadEntity();
        this.loadOrganizations(entityId);
      });

    // Keep organizations signal in sync with service
    this.organizationService.organizationSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe(orgs => {
        this.organizations.set(orgs);
      });

    // Keep participants signal in sync with service
    this.participantService.participantSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe(participants => {
        this.participants.set(participants);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEntity(): void {
    this.loading.set(true);
    this.error.set(null);
    this.entityService.getEntityBySportId(this.sportId())
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          console.error('Failed to load entities', err);
          this.toast.error('Failed to load entity data', 'Error');
          this.error.set('Could not load entity. Please try again.');
          return of([]);
        })
      )
      .subscribe(entities => {
        const list = Array.isArray(entities) ? entities : (entities ? [entities] : []);
        this.entities.set(list);
      });
  }

  private loadOrganizations(entityId: string): void {
    this.organizationService.getOrganizationByEntityId(entityId)
      .pipe(
        catchError((err) => {
          console.error('Failed to load organizations:', err);
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  refreshEntity(): void {
    this.loadEntity();
  }

  openEditDialog(entity: EntityModel): void {
    const dialogRef = this.dialog.open(EntityAddDialogComponent, {
      width: '400px',
      data: { sportId: this.sportId(), entity },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((updatedEntity) => {
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

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.entityService.deletesEntity(entity).subscribe({
            next: () => {
              this.toast.success(`Entity "${entity.name}" deleted.`, 'Deleted');
              this.router.navigate(['/sports', this.sportId()]);
            },
            error: () => this.toast.error('Failed to delete entity', 'Error')
          });
        }
      });
  }

  onOrganizationAdded(newOrg: any): void {
    this.toast.success(`Organization "${newOrg.name}" added successfully.`, 'Added');
    this.refreshEntity();
  }

  onOrganizationEdited(updatedOrg: any): void {
    this.toast.success(`Organization "${updatedOrg.name}" updated successfully.`, 'Updated');
    this.refreshEntity();
  }

  onOrganizationDeleted(orgId: string): void {
    this.toast.success('Organization deleted successfully.', 'Deleted');
    this.refreshEntity();
  }
}