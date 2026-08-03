import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, finalize, of, takeUntil } from 'rxjs';
import { ParticipantService } from '../../services/participant.service';
import { ToastService } from '../../../common/services/toast/toast.service';
import { ParticipantModel } from '../../model/participant.model';
import { ParticipantAddDialogComponent } from '../participant-add-dialog/participant-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';

@Component({
  selector: 'app-participant-table',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './participant-table.component.html',
  styleUrls: ['./participant-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantTableComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private participantService = inject(ParticipantService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  organizationId = signal('');
  participants = signal<ParticipantModel[]>([]);
  search = signal('');
  loading = signal(true);

  pageSize = signal(10);
  currentPage = signal(0);
  pageSizeOptions = [5, 10, 25, 100];

  filteredParticipants = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.participants();
    return this.participants().filter((p) => p.name.toLowerCase().includes(q));
  });

  totalItems = computed(() => this.filteredParticipants().length);

  paginatedParticipants = computed(() => {
    const start = this.currentPage() * this.pageSize();
    const end = Math.min(start + this.pageSize(), this.totalItems());
    return this.filteredParticipants().slice(start, end);
  });

  pageStart = computed(() =>
    this.totalItems() === 0 ? 0 : this.currentPage() * this.pageSize() + 1
  );
  pageEnd = computed(() =>
    Math.min((this.currentPage() + 1) * this.pageSize(), this.totalItems())
  );
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.organizationId.set(params['orgId']);
      this.loadParticipants();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadParticipants(): void {
    this.loading.set(true);
    this.participantService
      .getParticipantsByOrganizationId(this.organizationId())
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          console.error('Failed to load participants', err);
          this.toast.error('Failed to load participants. Please refresh.', 'Error');
          return of([]);
        })
      )
      .subscribe((participants) => {
        const list = Array.isArray(participants) ? participants : participants ? [participants] : [];
        this.participants.set(list);
        this.resetPagination();
      });
  }

  onSearch(query: string): void {
    this.search.set(query);
    this.currentPage.set(0);
  }

  onPageSizeChange(event: Event): void {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    this.pageSize.set(value);
    this.currentPage.set(0);
  }

  goToPage(page: number): void {
    const maxPage = this.totalPages() - 1;
    if (page < 0 || page > maxPage) return;
    this.currentPage.set(page);
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

  private resetPagination(): void {
    this.currentPage.set(0);
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(ParticipantAddDialogComponent, {
      width: '400px',
      data: { organizationId: this.organizationId() },
    });

    dialogRef.afterClosed().subscribe((newParticipant: ParticipantModel | undefined) => {
      if (newParticipant) {
        this.toast.success(`Participant "${newParticipant.name}" created.`, 'Success');
        this.loadParticipants();
      }
    });
  }

  openEditDialog(participant: ParticipantModel): void {
    const dialogRef = this.dialog.open(ParticipantAddDialogComponent, {
      width: '400px',
      data: {
        organizationId: this.organizationId(),
        participant,
      },
    });

    dialogRef.afterClosed().subscribe((updatedParticipant: ParticipantModel | undefined) => {
      if (updatedParticipant) {
        this.toast.success(`Participant "${updatedParticipant.name}" updated.`, 'Success');
        this.loadParticipants();
      }
    });
  }

  deleteParticipant(participant: ParticipantModel): void {
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {
        title: 'Delete Participant',
        message: `Are you sure you want to delete <strong>${participant.name}</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      } as CustomDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.participantService.deleteParticipant(participant).subscribe({
          next: () => {
            this.toast.success(`Participant "${participant.name}" deleted.`, 'Deleted');
            this.loadParticipants();
          },
          error: () => this.toast.error('Failed to delete participant', 'Error'),
        });
      }
    });
  }
}