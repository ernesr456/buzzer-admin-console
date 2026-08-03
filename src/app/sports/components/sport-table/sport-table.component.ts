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
}