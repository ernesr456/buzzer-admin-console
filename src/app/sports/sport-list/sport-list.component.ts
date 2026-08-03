import { Component, inject, ChangeDetectionStrategy, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, take, takeUntil } from 'rxjs/operators';
import { Subject, lastValueFrom } from 'rxjs';
import { SportsService } from '../services/sports/sports.service';
import { SportModel } from '../models/sport.model';
import { CustomBreadcrumbsComponent } from '../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';
import { SportTableComponent } from '../components/sport-table/sport-table.component';

@Component({
  selector: 'app-sport-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomBreadcrumbsComponent, SportTableComponent],
  templateUrl: './sport-list.component.html',
  styleUrls: ['./sport-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportListComponent implements OnInit, OnDestroy {
  private sportsService = inject(SportsService);

  loading = signal(true);
  importLoading = signal(false);
  private destroy$ = new Subject<void>();

  public sportsSignal = signal<SportModel[]>([]);
  public countsSignal = signal<Record<string, { entities: number; organizations: number; participants: number }>>({});

  public totalSports = computed(() => this.sportsSignal().length);
  public counts = computed(() => this.countsSignal());
  public totalEntities = computed(() => Object.values(this.counts() || {}).reduce((acc, c) => acc + (c?.entities ?? 0), 0));
  public totalOrganisations = computed(() => Object.values(this.counts() || {}).reduce((acc, c) => acc + (c?.organizations ?? 0), 0));
  public totalParticipants = computed(() => Object.values(this.counts() || {}).reduce((acc, c) => acc + (c?.participants ?? 0), 0));

  ngOnInit(): void {
    this.loading.set(true);

    this.sportsService.sports$.pipe(takeUntil(this.destroy$)).subscribe(list => this.sportsSignal.set(list));
    this.sportsService.counts$.pipe(takeUntil(this.destroy$)).subscribe(m => this.countsSignal.set(m));

    this.sportsService.loadSports().pipe(
      finalize(() => {
        this.computeAllCounts().catch(() => {});
        this.loading.set(false);
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async computeAllCounts(): Promise<void> {
    try {
      const sports = await lastValueFrom(this.sportsService.sports$.pipe(take(1)));
      const counts: Record<string, { entities: number; organizations: number; participants: number }> = {};

      for (const sport of sports) {
        try {
          const c = await this.sportsService.computeAndCacheCounts(sport.id);
          counts[sport.id] = { entities: c.entities, organizations: c.organizations, participants: c.participants };
        } catch (sErr) {
          console.error('Error computing counts for sport', sport.id, sErr);
          counts[sport.id] = { entities: 0, organizations: 0, participants: 0 };
        }
      }

      this.countsSignal.set(counts);
    } catch (err) {
      console.error('Failed to compute counts', err);
    }
  }
}