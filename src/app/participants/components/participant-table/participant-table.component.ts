import { Component, inject, ChangeDetectionStrategy, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, catchError, of, finalize } from 'rxjs';
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
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // Signals
  organizationId = signal('');
  participants = signal<ParticipantModel[]>([]);
  search = signal('');
  loading = signal(true);

  // Computed filtered participants
  filteredParticipants = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.participants();
    return this.participants().filter(p => p.name.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
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
    this.participantService.getParticipantsByOrganizationId(this.organizationId())
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          console.error('Failed to load participants', err);
          this.toast.error('Failed to load participants. Please refresh.', 'Error');
          return of([]);
        })
      )
      .subscribe(participants => {
        const list = Array.isArray(participants) ? participants : (participants ? [participants] : []);
        this.participants.set(list);
      });
  }

  onSearch(query: string): void {
    this.search.set(query);
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

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.participantService.deleteParticipant(participant).subscribe({
          next: () => {
            this.toast.success(`Participant "${participant.name}" deleted.`, 'Deleted');
            this.loadParticipants();
          },
          error: (err) => this.toast.error('Failed to delete participant', 'Error')
        });
      }
    });
  }
}