import { Component, inject, ChangeDetectionStrategy, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { map, catchError, finalize, take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SportsService } from '../services/sports/sports.service';
import { SportModel } from '../models/sport.model';
import { SportAddDialogComponent } from '../components/sport-add-dialog/sport-add-dialog.component';
import { CustomBreadcrumbsComponent } from '../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';
import { ToastService } from '../../common/services/toast/toast.service';
import { CustomDialogComponent, CustomDialogData } from '../../common/components/custom-dialog/custom-dialog.component';
import { lastValueFrom } from 'rxjs';
import { EntityService } from '../../entities/services/entity.service';
import { OrganizationService } from '../../organizations/services/organization.service';
import { ParticipantService } from '../../participants/services/participant.service';
import { EntityModel } from '../../entities/model/entity.model';
import { OrganizationModel } from '../../organizations/model/organization.model';
import { ParticipantModel } from '../../participants/model/participant.model';

@Component({
  selector: 'app-sport-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomBreadcrumbsComponent],
  templateUrl: './sport-list.component.html',
  styleUrls: ['./sport-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportListComponent implements OnInit {
  private sportsService = inject(SportsService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private toast = inject(ToastService);
  private entityService = inject(EntityService);
  private organizationService = inject(OrganizationService);
  private participantService = inject(ParticipantService);

  // Signals
  search = signal('');
  loading = signal(true);
  importLoading = signal(false);
  private destroy$ = new Subject<void>();

  // Convert service observables into signals
  public sportsSignal = signal<SportModel[]>([]);
  public countsSignal = signal<Record<string, { entities: number; organizations: number; participants: number }>>({});

  public filteredSports = computed(() => {
    const all = (this.sportsSignal() ?? []) as SportModel[];
    const q = (this.search() ?? '').trim().toLowerCase();
    if (!q) return all;
    return all.filter(s => (s.name ?? '').toLowerCase().includes(q));
  });

  public totalSports = computed(() => (this.sportsSignal() ?? []).length);
  public counts = computed(() => this.countsSignal());
  public totalEntities = computed(() => Object.values(this.counts() || {}).reduce((acc, c) => acc + (c?.entities ?? 0), 0));
  public totalOrganisations = computed(() => Object.values(this.counts() || {}).reduce((acc, c) => acc + (c?.organizations ?? 0), 0));
  public totalParticipants = computed(() => Object.values(this.counts() || {}).reduce((acc, c) => acc + (c?.participants ?? 0), 0));

  ngOnInit(): void {
    this.loading.set(true);

    // mirror service observables into local signals
    this.sportsService.sports$.pipe(takeUntil(this.destroy$)).subscribe(list => this.sportsSignal.set(list));
    this.sportsService.counts$.pipe(takeUntil(this.destroy$)).subscribe(m => this.countsSignal.set(m));

    this.sportsService.loadSports().pipe(
      finalize(() => {
        // compute counts after sports loaded
        this.computeAllCounts().catch(() => {});
        this.loading.set(false);
      })
    ).subscribe();
  }

  private refreshData(): void {
    this.loading.set(true);
    this.sportsService.loadSports().pipe(
      finalize(() => {
        this.computeAllCounts().catch(() => {});
        this.loading.set(false);
      })
    ).subscribe({
      error: (err) => {
        console.error('Refresh failed', err);
        this.toast.error('Failed to refresh sports. Please try again.', 'Error');
      }
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(SportAddDialogComponent, {
      width: '450px',
      panelClass: 'dark-dialog',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.sportsService.addSport(result).subscribe(() => this.refreshData());
      }
    });
  }

  openEditDialog(sport: SportModel): void {
    const dialogRef = this.dialog.open(SportAddDialogComponent, {
      width: '450px',
      panelClass: 'dark-dialog',
      data: sport,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.sportsService.updateSport(sport.id, result).subscribe(() => this.refreshData());
      }
    });
  }

  navigateToDetail(sportId: string): void {
    this.router.navigate(['/sports', sportId]);
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

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.sportsService.deletesSport(sport.id).subscribe({
          next: () => {
            this.toast.success(`Sport "${sport.name}" deleted successfully.`, 'Deleted');
            if (this.router.url.includes('/sports/')) {
              this.router.navigate(['/sports']);
            } else {
              this.refreshData();
            }
          },
          error: (err) => {
            this.toast.error('Failed to delete sport. Please try again.', 'Error');
            console.error('Delete error', err);
          }
        });
      }
    });
  }

  onSearchInput(value: string): void {
    this.search.set(value);
  }

  clearSearch(): void {
    this.search.set('');
  }

  parseBulkImportData(
    content: string
  ):
    | { type: 'flat'; data: Array<{ name: string; emoji: string; color: string }> }
    | { type: 'full'; data: SportModel[] } {
    const trimmedContent = content?.trim();
    if (!trimmedContent) {
      return { type: 'flat', data: [] };
    }

    try {
      const parsed = JSON.parse(trimmedContent);
      const records = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.sports)
        ? parsed.sports
        : Array.isArray(parsed?.data)
        ? parsed.data
        : [parsed];

      if (!records.length) {
        return { type: 'flat', data: [] };
      }

      const first = records[0];
      if (first && typeof first === 'object' && 'entities' in first) {
        const fullSports = records.map((item: any) => this.normalizeSportDates(item));
        return { type: 'full', data: fullSports };
      } else {
        const flat = records
          .filter((item: any) => item && typeof item === 'object')
          .map((item: any) => ({
            name: this.normalizeString(item.name),
            emoji: this.normalizeString(item.emoji),
            color: this.normalizeString(item.color),
          }))
          .filter((record: { name: string; emoji: string; color: string }) =>
            record.name || record.emoji || record.color
          );
        return { type: 'flat', data: flat };
      }
    } catch {
      const flat = this.parseCsvBulkImportData(trimmedContent);
      return { type: 'flat', data: flat };
    }
  }

  private parseCsvBulkImportData(
    content: string
  ): Array<{ name: string; emoji: string; color: string }> {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].split(',').map((header) => header.trim().toLowerCase());
    const nameIndex = headers.indexOf('name');
    const emojiIndex = headers.indexOf('emoji');
    const colorIndex = headers.indexOf('color');

    if (nameIndex === -1) {
      return [];
    }

    return lines
      .slice(1)
      .map((line) => {
        const values = line.split(',').map((value) => value.trim().replace(/^"|"$/g, ''));
        return {
          name: this.normalizeString(values[nameIndex] ?? ''),
          emoji: this.normalizeString(values[emojiIndex] ?? ''),
          color: this.normalizeString(values[colorIndex] ?? ''),
        };
      })
      .filter((record) => record.name || record.emoji || record.color);
  }

  private normalizeString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private normalizeSportDates(sport: any): SportModel {
    return {
      ...sport,
      createdAt: sport.createdAt ? new Date(sport.createdAt) : new Date(),
      updatedAt: sport.updatedAt ? new Date(sport.updatedAt) : new Date(),
      entities: (sport.entities || []).map((entity: any) => ({
        ...entity,
        createdAt: entity.createdAt ? new Date(entity.createdAt) : new Date(),
        updatedAt: entity.updatedAt ? new Date(entity.updatedAt) : new Date(),
        onboardedAt: entity.onboardedAt ? new Date(entity.onboardedAt) : undefined,
        organizations: (entity.organizations || []).map((org: any) => ({
          ...org,
          createdAt: org.createdAt ? new Date(org.createdAt) : new Date(),
          updatedAt: org.updatedAt ? new Date(org.updatedAt) : new Date(),
          onboardedAt: org.onboardedAt ? new Date(org.onboardedAt) : undefined,
          participants: (org.participants || []).map((part: any) => ({
            ...part,
          })),
        })),
      })),
    };
  }

  async handleBulkImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    // set loading
    this.importLoading.set(true);

    try {
      const content = await file.text();
      const result = this.parseBulkImportData(content);

      if (result.type === 'full') {
        const sports = result.data;
        if (!sports.length) {
          this.toast.error('No valid sport records found in the file.', 'Import failed');
          input.value = '';
          return;
        }

        // Perform hierarchical import: sport -> entity -> organization -> participant
        try {
          await this.importHierarchy(sports);
          this.toast.success(
            `Imported ${sports.length} sport(s) with nested entities, organizations and participants.`,
            'Import completed'
          );
          this.refreshData();
        } catch (err) {
          console.error('Bulk import failed', err);
          this.toast.error('Bulk import completed with errors. Check console for details.', 'Import finished');
        }
      } else {
        const flatSports = result.data;
        if (!flatSports.length) {
          this.toast.error('No valid sport records found in the file.', 'Import failed');
          input.value = '';
          return;
        }
        this.toast.success(
          `Imported ${flatSports.length} sport(s).`,
          'Import completed'
        );
        this.refreshData();
      }
    } catch (error) {
      this.toast.error('Unable to read the selected file. Please try again.', 'Import failed');
      console.error('Bulk import failed', error);
    } finally {
      input.value = '';
      // clear loading
      this.importLoading.set(false);
    }
  }

  private async importHierarchy(sports: SportModel[]): Promise<void> {
    for (const sport of sports) {
      try {
        const sportPayload: SportModel = {
          name: sport.name,
          emoji: sport.emoji,
          color: sport.color,
          createdAt: sport.createdAt || new Date(),
          updatedAt: sport.updatedAt,
          id: sport.id,
          entities: [],
        };
        const createdSport = await lastValueFrom(this.sportsService.addSport(sportPayload));
        const entities = sport.entities || [];
        for (const entity of entities) {
          try {
            const entityPayload: EntityModel = {
                name: entity.name,
                country: entity.country,
                onboardedAt: entity.onboardedAt,
                createdAt: entity.createdAt || new Date(),
                updatedAt: entity.updatedAt,
                id: entity.id,
                sportId: createdSport.id,
            };

            const createdEntity = await lastValueFrom(
                this.entityService.addEntity(createdSport.id, entityPayload)
            );

            const orgs = entity.organizations || [];
            for (const org of orgs) {
              try {
                const orgPayload: OrganizationModel = {
                    name: org.name,
                    type: org.type || 'Association',
                    crestUrl: org.crestUrl,
                    country: org.country,
                    governingBodyId: org.governingBodyId,
                    onboardedAt: org.onboardedAt,
                    createdAt: org.createdAt || new Date(),
                    updatedAt: org.updatedAt || new Date(),
                    id: org.id,
                    participants: [],
                };

                const createdOrg = await lastValueFrom(
                    this.organizationService.addOrganization(createdEntity.id, orgPayload)
                );
                const parts = org.participants || [];
                for (const part of parts) {
                  try {
                    const partPayload: Partial<ParticipantModel> = {
                        name: part.name,
                        role: part.role,
                        createdAt: part.createdAt || new Date(),
                        updatedAt: part.updatedAt,
                        id: part.id,
                    };

                    await lastValueFrom(
                        this.participantService.addParticipant(createdOrg.id, partPayload)
                    );
                  } catch (pErr) {
                      console.error('Failed to import participant', part, pErr);
                  }
                }
              } catch (oErr) {
                  console.error('Failed to import organization', org, oErr);
              }
            }
          } catch (eErr) {
              console.error('Failed to import entity', entity, eErr);
          }
        }
      } catch (sErr) {
          console.error('Failed to import sport', sport, sErr);
      }
    }
  }

  trackByFn(index: number, sport: SportModel): string {
    return sport.id;
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
