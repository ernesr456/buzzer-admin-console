// src/app/participants/components/participant-table/participant-table.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ParticipantService } from '../../services/participant.service';
import { ToastService } from '../../../common/services/toast/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, finalize, map, Observable, of, Subject, takeUntil, tap } from 'rxjs';
import { ParticipantModel } from '../../model/participant.model';
import { ParticipantAddDialogComponent } from '../participant-add-dialog/participant-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';

@Component({
  selector: 'app-participant-table',
  standalone: true,
  imports: [CommonModule, MatDialogModule ],
  templateUrl: './participant-table.component.html',
  styleUrls: ['./participant-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantTableComponent implements OnInit, OnDestroy{
  private dialog = inject(MatDialog);
  private participantService = inject(ParticipantService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // Local source of truth for participants
  private participantsSubject = new BehaviorSubject<ParticipantModel[]>([]);
  participants$ = this.participantsSubject.asObservable();

  // Search
  private searchSubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchSubject.asObservable();

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  organizationId!: string;

  filteredparticipant$: Observable<ParticipantModel[]> = combineLatest([
    this.participants$,
    this.searchQuery$
  ]).pipe(
    map(([participants, query]) => {
      const search = query?.trim().toLowerCase() || '';
      if (!search) return participants;
      return participants.filter(participant =>
        participant.name.toLowerCase().includes(search)
      );
    })
  );
  
  ngOnInit(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        tap(params => {
          this.organizationId = params['orgId'];
          this.loadParticipants();
        })
      )
      .subscribe();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadParticipants(): void {
    this.loadingSubject.next(true);
    this.participantService.getParticipantsByOrganizationId(this.organizationId)
      .pipe(
        finalize(() => this.loadingSubject.next(false)),
        catchError((err) => {
          console.error('Failed to load participants', err);
          this.toast.error('Failed to load participants. Please refresh.', 'Error');
          return of([]);
        })
      )
      .subscribe(participants => {
        const list = Array.isArray(participants) ? participants : (participants ? [participants] : []);
        this.participantsSubject.next(list);
      });
  }
  onSearch(query: string): void {
    this.searchSubject.next(query);
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(ParticipantAddDialogComponent, {
      width: '400px',
      data: { organizationId: this.organizationId },   // ✅ correct key
    });

    dialogRef.afterClosed().subscribe((newParticipant: ParticipantModel | undefined) => {
      if (newParticipant) {
        this.toast.success(`Entity "${newParticipant.name}" created.`, 'Success');
        this.loadParticipants();  // refresh
      }
    });
  }

  openEditDialog(entity: ParticipantModel): void {
    const dialogRef = this.dialog.open(ParticipantAddDialogComponent, {
      width: '400px',
      data: {
        organizationId: this.organizationId,
        participant: entity,
      },
    });

    dialogRef.afterClosed().subscribe((updatedEntity: ParticipantModel | undefined) => {
      if (updatedEntity) {
        this.toast.success(`Entity "${updatedEntity.name}" updated.`, 'Success');
        this.loadParticipants();
      }
    });
  }

  deleteParticipant(participant: ParticipantModel): void {
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {
        title: 'Delete Entity',
        message: `Are you sure you want to delete <strong>${participant.name}</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      } as CustomDialogData,
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.participantService.deleteParticipant(participant).subscribe({
          next: () =>  this.toast.success(`Entity "${participant.name}" deleted.`, 'Deleted'),
          error: (err) => this.toast.error('Failed to delete entity', 'Error')
        });
        this.loadParticipants();
      }
    });
  }
}