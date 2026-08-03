import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, of, finalize } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SportsService } from '../services/sports/sports.service';
import { SportModel } from '../models/sport.model';
import { SportAddDialogComponent } from '../components/sport-add-dialog/sport-add-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ToastService } from '../../common/services/toast/toast.service';
import { EntityTableComponent } from '../../entities/components/entity-table/entity-table.component';
import { CustomDialogComponent, CustomDialogData } from '../../common/components/custom-dialog/custom-dialog.component';
import { CustomBreadcrumbsComponent } from '../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';

@Component({
  selector: 'app-sport-detail',
  standalone: true,
  imports: [CommonModule, CustomBreadcrumbsComponent, EntityTableComponent],
  templateUrl: './sport-detail.component.html',
  styleUrls: ['./sport-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private sportsService = inject(SportsService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);
  private router = inject(Router);

  public sportId = signal('');
  public sportsSignal = signal<SportModel[]>([]);
  public countsSignal = signal<Record<string, { entities: number; organizations: number; participants: number }>>({});

  public loading = signal(true);
  public error = signal<string | null>(null);

  public sport = computed(() => this.sportsSignal().find((s: SportModel) => s.id === this.sportId()));

  public totalEntities = computed(() => this.countsSignal()[this.sportId()]?.entities ?? 0);
  public totalCompetitions = computed(() => this.countsSignal()[this.sportId()]?.organizations ?? 0);
  public totalParticipants = computed(() => this.countsSignal()[this.sportId()]?.participants ?? 0);

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadSportDetail();

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(pm => {
      const id = pm.get('sportId') || '';
      if (!id) {
        this.router.navigate(['/sports']);
        return;
      }
      this.sportId.set(id);
      this.sportsService.computeAndCacheCounts(id).catch(() => {});
    });

    this.sportsService.sports$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => {
        this.sportsSignal.set(list);
        this.loading.set(false);
        this.error.set(null);
      });

    this.sportsService.counts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(m => this.countsSignal.set(m));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSportDetail(): void {
    this.loading.set(true);
    this.error.set(null);

    this.sportsService.loadSports()
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          this.error.set('Failed to load sport data.');
          this.loading.set(false);
          return of(null);
        }),
        finalize(() => {})
      )
      .subscribe({
        next: (list) => {
          if (list) {
            this.sportsSignal.set(list);
          }
          this.loading.set(false);
        },
        error: () => {}
      });
  }

  refreshSport(): void {
    this.loadSportDetail();
    this.sportsService.computeAndCacheCounts(this.sportId()).catch(() => {});
  }

  openEditDialog(sport: SportModel): void {
    const dialogRef = this.dialog.open(SportAddDialogComponent, {
      width: '450px',
      panelClass: 'dark-dialog',
      data: sport,
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.refreshSport();
      }
    });
  }

  deleteSport(sport: SportModel): void {
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {
        title: 'Delete Sport',
        message: `Are you sure you want to delete <strong>${sport.name}</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      } as CustomDialogData,
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (confirmed) {
        this.sportsService.deletesSport(sport.id + '').subscribe({
          next: () => {
            this.toast.success(`Sport "${sport.name}" deleted successfully.`, 'Deleted');
            this.router.navigate(['/sports']);
          },
          error: () => this.toast.error('Delete failed.', 'Error')
        });
      }
    });
  }
}