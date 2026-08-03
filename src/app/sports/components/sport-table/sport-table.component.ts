// sport-table.component.ts
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
import { finalize } from 'rxjs';
import { SportModel } from '../../models/sport.model';
import { SportsService } from '../../services/sports/sports.service';
import { SportAddDialogComponent } from '../sport-add-dialog/sport-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../../common/services/toast/toast.service';
import { EntityModel } from '../../../entities/model/entity.model';
import { OrganizationModel } from '../../../organizations/model/organization.model';
import { ParticipantModel } from '../../../participants/model/participant.model';

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
      finalize(() => {})
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
      const sports = this.parseBulkImportData(content);

      if (!sports.length) {
        this.toast.error('No valid sport records found in the file.', 'Import failed');
        input.value = '';
        return;
      }

      this.sportsService.bulkImportSports(sports).subscribe({
        next: (response) => {
          this.importLoading.set(false);
          const { imported, skipped, errors } = response;
          const importedCount = imported?.sports?.length || 0;
          const skippedCount = skipped?.length || 0;
          const errorCount = errors?.length || 0;

          let message = `Imported ${importedCount} sport(s)`;
          if (skippedCount) message += `, ${skippedCount} skipped (duplicates)`;
          if (errorCount) message += `, ${errorCount} error(s)`;
          this.toast.success(message, 'Import completed');

          if (errorCount > 0) {
            console.warn('Bulk import errors:', errors);
          }

          this.refreshData();
          input.value = '';
        },
        error: (err) => {
          this.importLoading.set(false);
          this.toast.error('Bulk import failed. Please check the file format and try again.', 'Error');
          console.error('Bulk import error', err);
          input.value = '';
        }
      });
    } catch (error) {
      this.toast.error('Unable to read the selected file. Please try again.', 'Import failed');
      console.error('Bulk import failed', error);
      input.value = '';
      this.importLoading.set(false);
    }
  }

  parseBulkImportData(content: string): SportModel[] {
    const trimmedContent = content?.trim();
    if (!trimmedContent) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmedContent);
      let records: any[] = [];

      if (Array.isArray(parsed)) {
        records = parsed;
      } else if (parsed.sports && Array.isArray(parsed.sports)) {
        records = parsed.sports;
      } else if (parsed.data && Array.isArray(parsed.data)) {
        records = parsed.data;
      } else {
        records = [parsed];
      }

      if (!records.length) {
        return [];
      }

      const first = records[0];
      if (first && typeof first === 'object' && 'entities' in first) {
        return records.map((item: any) => this.normalizeSportDates(item));
      } else {
        return records
          .filter((item: any) => item && typeof item === 'object')
          .map((item: any) => {
            const sport: SportModel = {
              id: item.id || '',
              name: this.normalizeString(item.name),
              emoji: this.normalizeString(item.emoji),
              color: this.normalizeString(item.color),
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
              updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
              entities: [],
            };
            return sport;
          })
          .filter((sport: SportModel) => sport.name || sport.emoji || sport.color);
      }
    } catch {
      const flat = this.parseCsvBulkImportData(trimmedContent);
      return flat.map(({ name, emoji, color }) => ({
        id: '',
        name,
        emoji,
        color,
        createdAt: new Date(),
        updatedAt: new Date(),
        entities: [],
      }));
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
            squads: (part.squads || []).map((squad: any) => ({
              ...squad,
            })),
            staff: (part.staff || []).map((staff: any) => ({
              ...staff,
            })),
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