import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, combineLatest, Subject, takeUntil, map } from 'rxjs';
import { CustomBreadcrumbsComponent } from '../../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';
import { SportsService } from '../../services/sports/sports.service';
import { SportModel } from '../../models/sport.model';
import { SportAddDialogComponent } from '../sport-add-dialog/sport-add-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ToastService } from '../../../common/services/toast/toast.service';
import { EntityTableComponent } from '../../../entities/components/entity-table/entity-table.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';

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
  private destroy$ = new Subject<void>();

  sport$!: Observable<SportModel | undefined>;
  sportId!: string;
  totalCompetitions$!: Observable<number>;
  totalParticipants$!: Observable<number>;

  ngOnInit(): void {
    this.sportsService.getSport();

    this.sport$ = combineLatest([
      this.route.paramMap,
      this.sportsService.sportSubject$
    ]).pipe(
      map(([params, sports]) => {
        const id = params.get('sportId');
        if (!id) {
          this.router.navigate(['/sports']);
          return undefined;
        }
        this.sportId = id;
        return sports.find(sport => sport.id === id);
      }),
      takeUntil(this.destroy$)
    );

    this.totalCompetitions$ = this.sport$.pipe(
      map(sport => sport?.entities?.reduce((sum, gb) => sum + (gb?.organizations?.length ?? 0), 0) ?? 0)
    );

    this.totalParticipants$ = this.sport$.pipe(
      map(sport => sport?.entities?.reduce((sum, gb) => 
        sum + (gb?.organizations ?? []).reduce((s, org) => s + (org?.participants?.length ?? 0), 0), 0) ?? 0
      )
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshSport(): void {
    this.sportsService.getSport();
  }

  openEditDialog(sport: SportModel): void {
    const dialogRef = this.dialog.open(SportAddDialogComponent, {
      width: '450px',
      panelClass: 'dark-dialog',
      data: sport,
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.refreshSport(); // reload updated list from server
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