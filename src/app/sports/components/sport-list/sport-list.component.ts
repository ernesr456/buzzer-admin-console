import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { SportsService } from '../../services/sports/sports.service';
import { SportModel } from '../../models/sport.model';
import { SportAddDialogComponent } from '../sport-add-dialog/sport-add-dialog.component';
import { CustomBreadcrumbsComponent } from '../../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';
import { ToastService } from '../../../common/services/toast/toast.service';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';

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

  ngOnInit(): void {
    this.loadingSubject.next(true);

    this.sportsService.loadSports().pipe(
      finalize(() => this.loadingSubject.next(false))
    ).subscribe();
  }

  private refreshData(): void {
    this.loadingSubject.next(false);
    this.sportsService.loadSports().pipe(
      finalize(() => this.loadingSubject.next(false))
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
        this.sportsService.addFullSports(sports);
        this.toast.success(
          `Imported ${sports.length} sport(s) with all nested entities.`,
          'Import completed'
        );
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
      }
    } catch (error) {
      this.toast.error('Unable to read the selected file. Please try again.', 'Import failed');
      console.error('Bulk import failed', error);
    } finally {
      input.value = '';
    }
  }

  trackByFn(index: number, sport: SportModel): string {
    return sport.id;
  }
}