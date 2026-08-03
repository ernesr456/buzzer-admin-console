import { Component, OnInit, inject, ChangeDetectionStrategy, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, finalize, catchError, of } from 'rxjs';
import { EntityModel } from '../../model/entity.model';
import { EntityService } from '../../services/entity.service';
import { EntityAddDialogComponent } from '../entity-add-dialog/entity-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../../common/services/toast/toast.service';
import { OrganizationService } from '../../../organizations/services/organization.service';
import { ParticipantService } from '../../../participants/services/participant.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-entity-table',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './entity-table.component.html',
  styleUrls: ['./entity-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityTableComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private entityService = inject(EntityService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private organizationService = inject(OrganizationService);
  private participantService = inject(ParticipantService);
  private destroy$ = new Subject<void>();

  sportId = signal('');
  entities = signal<EntityModel[]>([]);
  counts = signal<Record<string, { organizations: number; participants: number }>>({});
  search = signal('');
  loading = signal(true);

  pageSize = signal(10);
  currentPage = signal(0);
  pageSizeOptions = [5, 10, 25, 100];

  filteredEntities = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.entities();
    return this.entities().filter(entity =>
      entity.name.toLowerCase().includes(q)
    );
  });

  totalItems = computed(() => this.filteredEntities().length);

  paginatedEntities = computed(() => {
    const start = this.currentPage() * this.pageSize();
    const end = Math.min(start + this.pageSize(), this.totalItems());
    return this.filteredEntities().slice(start, end);
  });

  pageStart = computed(() =>
    this.totalItems() === 0 ? 0 : this.currentPage() * this.pageSize() + 1
  );
  pageEnd = computed(() =>
    Math.min((this.currentPage() + 1) * this.pageSize(), this.totalItems())
  );
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.sportId.set(params['sportId']);
        this.loadEntities();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEntities(): void {
    this.loading.set(true);
    this.entityService.getEntityBySportId(this.sportId())
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          console.error('Failed to load entities', err);
          this.toast.error('Failed to load entities. Please refresh.', 'Error');
          return of([]);
        })
      )
      .subscribe(async entities => {
        const list = Array.isArray(entities) ? entities : (entities ? [entities] : []);
        this.entities.set(list);
        this.resetPagination();
        await this.computeCountsForEntities(list);
      });
  }

  onSearch(query: string): void {
    this.search.set(query);
    this.currentPage.set(0);
  }

  onPageSizeChange(event: Event): void {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    this.pageSize.set(value);
    this.currentPage.set(0);
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  private resetPagination(): void {
    this.currentPage.set(0);
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(EntityAddDialogComponent, {
      width: '400px',
      data: { sportId: this.sportId() },
    });

    dialogRef.afterClosed().subscribe((newEntity: EntityModel | undefined) => {
      if (newEntity) {
        this.toast.success(`Entity "${newEntity.name}" created.`, 'Success');
        this.loadEntities();
      }
    });
  }

  openEditDialog(entity: EntityModel): void {
    const dialogRef = this.dialog.open(EntityAddDialogComponent, {
      width: '400px',
      data: { sportId: this.sportId(), entity },
    });

    dialogRef.afterClosed().subscribe((updatedEntity: EntityModel | undefined) => {
      if (updatedEntity) {
        this.toast.success(`Entity "${updatedEntity.name}" updated.`, 'Success');
        this.loadEntities();
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

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.entityService.deletesEntity(entity).subscribe({
          next: () => {
            this.toast.success(`Entity "${entity.name}" deleted.`, 'Deleted');
            this.loadEntities();
          },
          error: (err) => this.toast.error('Failed to delete entity', 'Error')
        });
      }
    });
  }

  navigateToDetail(entity: EntityModel): void {
    this.router.navigate(['/sports', entity.sportId, entity.id]);
  }

  private async computeCountsForEntities(entities: EntityModel[]): Promise<void> {
    const counts: Record<string, { organizations: number; participants: number }> = {};
    for (const ent of entities) {
      try {
        const orgsResp: any = await lastValueFrom(this.organizationService.getOrganizationByEntityId(ent.id));
        const orgs = Array.isArray(orgsResp) ? orgsResp : (orgsResp ? [orgsResp] : []);
        let participantCount = 0;
        for (const org of orgs) {
          try {
            const partsResp: any = await lastValueFrom(this.participantService.getParticipantsByOrganizationId(org.id));
            const parts = Array.isArray(partsResp) ? partsResp : (partsResp ? [partsResp] : []);
            participantCount += parts.length;
          } catch (pErr) {
            console.error('Failed to load participants for org', org.id, pErr);
          }
        }
        counts[ent.id] = { organizations: orgs.length, participants: participantCount };
      } catch (e) {
        console.error('Failed to load organizations for entity', ent.id, e);
        counts[ent.id] = { organizations: 0, participants: 0 };
      }
    }
    this.counts.set(counts);
  }
}