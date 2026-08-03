// sport-list.component.ts
import { Component, inject, ChangeDetectionStrategy, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
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
  private destroy$ = new Subject<void>();

  public sportsSignal = signal<SportModel[]>([]);

  // Derive counts from the sports array – each sport already has counts from API
  public counts = computed(() => {
    const result: Record<string, { entities: number; organizations: number; participants: number }> = {};
    for (const sport of this.sportsSignal()) {
      result[sport.id] = {
        entities: sport.counts?.governingBodies ?? 0,
        organizations: sport.counts?.organisations ?? 0,
        participants: sport.counts?.participants ?? 0,
      };
    }
    return result;
  });

  // Totals computed from the derived counts
  public totalSports = computed(() => this.sportsSignal().length);
  public totalEntities = computed(() =>
    Object.values(this.counts()).reduce((acc, c) => acc + c.entities, 0)
  );
  public totalOrganisations = computed(() =>
    Object.values(this.counts()).reduce((acc, c) => acc + c.organizations, 0)
  );
  public totalParticipants = computed(() =>
    Object.values(this.counts()).reduce((acc, c) => acc + c.participants, 0)
  );

  ngOnInit(): void {
    this.loading.set(true);

    this.sportsService.sports$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => this.sportsSignal.set(list));

    // Load sports; counts are already included in the response
    this.sportsService.loadSports()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}