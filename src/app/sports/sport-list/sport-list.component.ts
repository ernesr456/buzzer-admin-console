import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, combineLatest, of, take } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
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

  // Search
  private searchSubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchSubject.asObservable();

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  private sportsData$ = this.sportsService.sports$.pipe(
    map(sports => (sports ?? []).map(sport => ({ ...sport, entities: [] })) as SportModel[]),
    catchError((err) => {
      console.error('Failed to load sports', err);
      this.loadingSubject.next(false);
      this.toast.error('Failed to load sports. Please refresh.', 'Error');
      return of([]);
    })
  );

  // Filtered list based on search (only after data loads)
  filteredSports$ = combineLatest([
    this.sportsData$,
    this.searchQuery$
  ]).pipe(
    map(([sports, query]) => {
      const search = query?.trim().toLowerCase() || '';
      if (!search) return sports;
      return sports.filter(sport => sport.name.toLowerCase().includes(search));
    })
  );

  // Statistics derived from the same data stream
  totalSports$ = this.sportsData$.pipe(map(s => s.length));

  // Counts
  countsMap$ = new BehaviorSubject<Partial<Record<string, { entities: number; organizations: number; participants: number }>>>({});
  totalEntities$ = new BehaviorSubject<number>(0);
  totalOrganisations$ = new BehaviorSubject<number>(0);
  totalParticipants$ = new BehaviorSubject<number>(0);

  // Bulk import loading state
  private importLoadingSubject = new BehaviorSubject<boolean>(false);
  importLoading$ = this.importLoadingSubject.asObservable();

  ngOnInit(): void {
    this.loadingSubject.next(true);

    this.sportsService.loadSports().pipe(
      finalize(() => {
        // compute counts after sports loaded
        this.computeAllCounts().catch(() => {});
        this.loadingSubject.next(false);
      })
    ).subscribe();
  }

  private refreshData(): void {
    this.loadingSubject.next(false);
    this.sportsService.loadSports().pipe(
      finalize(() => {
        this.computeAllCounts().catch(() => {});
        this.loadingSubject.next(false);
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
        this.sportsService.addSport(result);
        this.refreshData();
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
        this.sportsService.updateSport(sport.id, result);
        this.refreshData();
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
            }else{
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
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.searchSubject.next('');
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
    this.importLoadingSubject.next(true);

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
        // flatSports.forEach((sport) => {
        //   this.sportsService.addSport({
        //     name: sport.name,
        //     createdAt: new Date(),
        //   });
        // });
        this.toast.success(
          `Imported ${flatSports.length} sport(s).`,
          'Import completed'
        );
        // optionally refresh list if needed
        this.refreshData();
      }
    } catch (error) {
      this.toast.error('Unable to read the selected file. Please try again.', 'Import failed');
      console.error('Bulk import failed', error);
    } finally {
      input.value = '';
      // clear loading
      this.importLoadingSubject.next(false);
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
      let totalEntities = 0;
      let totalOrgs = 0;
      let totalParticipants = 0;

      for (const sport of sports) {
        try {
          const c = await this.sportsService.computeAndCacheCounts(sport.id);
          counts[sport.id] = { entities: c.entities, organizations: c.organizations, participants: c.participants };
          totalEntities += c.entities;
          totalOrgs += c.organizations;
          totalParticipants += c.participants;
        } catch (sErr) {
          console.error('Error computing counts for sport', sport.id, sErr);
          counts[sport.id] = { entities: 0, organizations: 0, participants: 0 };
        }
      }

      this.countsMap$.next(counts);
      this.totalEntities$.next(totalEntities);
      this.totalOrganisations$.next(totalOrgs);
      this.totalParticipants$.next(totalParticipants);
    } catch (err) {
      console.error('Failed to compute counts', err);
    }
  }
}
