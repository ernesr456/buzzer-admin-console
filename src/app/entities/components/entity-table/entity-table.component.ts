import { Component, OnInit, inject, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest, Subject, switchMap, finalize, takeUntil, of, catchError, tap, map } from 'rxjs';
import { EntityModel } from '../../model/entity.model';
import { EntityService } from '../../services/entity.service';
import { EntityAddDialogComponent } from '../entity-add-dialog/entity-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../../common/services/toast/toast.service';

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
  private destroy$ = new Subject<void>();

  sportId!: string;

  // Local source of truth for entities
  private entitiesSubject = new BehaviorSubject<EntityModel[]>([]);
  entities$ = this.entitiesSubject.asObservable();

  // Search
  private searchSubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchSubject.asObservable();

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  // Filtered entities (combines data and search)
  filteredEntities$: Observable<EntityModel[]> = combineLatest([
    this.entities$,
    this.searchQuery$
  ]).pipe(
    map(([entities, query]) => {
      const search = query?.trim().toLowerCase() || '';
      if (!search) return entities;
      return entities.filter(entity =>
        entity.name.toLowerCase().includes(search)
      );
    })
  );

  ngOnInit(): void {
    // Get sportId from route and load data
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        tap(params => {
          this.sportId = params['sportId'];
          this.loadEntities();
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load entities from the service and update the local subject
  loadEntities(): void {
    this.loadingSubject.next(true);
    this.entityService.getEntityBySportId(this.sportId)
      .pipe(
        finalize(() => this.loadingSubject.next(false)),
        catchError((err) => {
          console.error('Failed to load entities', err);
          this.toast.error('Failed to load entities. Please refresh.', 'Error');
          return of([]);
        })
      )
      .subscribe(entities => {
        // If the service returns a single entity, wrap it; otherwise assume array
        const list = Array.isArray(entities) ? entities : (entities ? [entities] : []);
        // Optionally enrich each entity with computed counts if needed
        this.entitiesSubject.next(list);
      });
  }

  // Search input handler
  onSearch(query: string): void {
    this.searchSubject.next(query);
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(EntityAddDialogComponent, {
      width: '400px',
      data: { sportId: this.sportId },
    });

    dialogRef.afterClosed().subscribe((newEntity: EntityModel | undefined) => {
      if (newEntity) {
        this.toast.success(`Entity "${newEntity.name}" created.`, 'Success');
        this.loadEntities(); // refresh the list
      }
    });
  }

  openEditDialog(entity: EntityModel): void {
    const dialogRef = this.dialog.open(EntityAddDialogComponent, {
      width: '400px',
      data: {
        sportId: this.sportId,
        entity: entity,
      },
    });

    dialogRef.afterClosed().subscribe((updatedEntity: EntityModel | undefined) => {
      if (updatedEntity) {
        this.toast.success(`Entity "${updatedEntity.name}" updated.`, 'Success');
        this.loadEntities(); // refresh
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
          next: () =>  this.toast.success(`Entity "${entity.name}" deleted.`, 'Deleted'),
          error: (err) => this.toast.error('Failed to delete entity', 'Error')
        });
        this.loadEntities(); // refresh
      }
    });
  }

  navigateToDetail(entity: EntityModel): void {
    this.router.navigate(['/sports', entity.sportId, entity.id]);
  }
}