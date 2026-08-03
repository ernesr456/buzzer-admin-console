import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { finalize, lastValueFrom } from 'rxjs';
import { SportModel } from '../../models/sport.model';
import { SportsService } from '../../services/sports/sports.service';
import { SportAddDialogComponent } from '../sport-add-dialog/sport-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../../common/services/toast/toast.service';
import { EntityModel } from '../../../entities/model/entity.model';
import { OrganizationModel } from '../../../organizations/model/organization.model';
import { ParticipantModel } from '../../../participants/model/participant.model';
import { OrganizationService } from '../../../organizations/services/organization.service';
import { ParticipantService } from '../../../participants/services/participant.service';
import { EntityService } from '../../../entities/services/entity.service';

@Component({
  selector: 'app-sport-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sport-table.component.html',
  styleUrls: ['./sport-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportTableComponent {
  @Input() sports: SportModel[] = [];
  @Input() counts: Record<string, { entities: number; organizations: number; participants: number }> = {};
  @Input() loading = false;

  private dialog = inject(MatDialog);
  private sportsService = inject(SportsService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private entityService = inject(EntityService)
  private organizationService = inject(OrganizationService);
  private participantService = inject(ParticipantService);

  search = signal('');
  pageSize = signal(10);
  currentPage = signal(0);
  pageSizeOptions = [5, 10, 25, 100];
  importLoading = signal(false);

  filteredSports = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.sports;
    return this.sports.filter((s) => s.name.toLowerCase().includes(q));
  });

  totalItems = computed(() => this.filteredSports().length);

  paginatedSports = computed(() => {
    const start = this.currentPage() * this.pageSize();
    const end = Math.min(start + this.pageSize(), this.totalItems());
    return this.filteredSports().slice(start, end);
  });

  pageStart = computed(() =>
    this.totalItems() === 0 ? 0 : this.currentPage() * this.pageSize() + 1
  );
  pageEnd = computed(() =>
    Math.min((this.currentPage() + 1) * this.pageSize(), this.totalItems())
  );
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  onSearch(query: string): void {
    this.search.set(query);
    this.currentPage.set(0);
  }

  clearSearch(): void {
    this.search.set('');
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

  openAddDialog(): void {
    const dialogRef = this.dialog.open(SportAddDialogComponent, {
      width: '450px',
      panelClass: 'dark-dialog',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
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
        this.refreshData();
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
          },
        });
      }
    });
  }

  navigateToDetail(sportId: string): void {
    this.router.navigate(['/sports', sportId]);
  }

  private refreshData(): void {
    this.sportsService.loadSports().pipe(
      finalize(() => {
        // The parent's subscriptions will update the inputs automatically
        // because the service subjects emit new values.
      })
    ).subscribe();
  }

  async handleBulkImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

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
      this.importLoading.set(false);
    }
  }
  parseBulkImportData(content: string): { type: 'flat'; data: Array<{ name: string; emoji: string; color: string }> } | { type: 'full'; data: SportModel[] } {
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
  private normalizeString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }
  private parseCsvBulkImportData(content: string): Array<{ name: string; emoji: string; color: string }> {
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
}