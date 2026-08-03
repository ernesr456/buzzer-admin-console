// entity-detail.component.ts
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
// Remove OrganizationService and ParticipantService imports

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

  sportId = signal('');
  entityId = signal('');
  entities = signal<EntityModel[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  entity = computed(() => {
    const id = this.entityId();
    return this.entities().find(e => e.id === id) ?? null;
  });

  // Totals directly from the entity's counts
  totalOrganizations = computed(() => this.entity()?.counts?.organisations ?? 0);
  totalParticipants = computed(() => this.entity()?.counts?.participants ?? 0);

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
}