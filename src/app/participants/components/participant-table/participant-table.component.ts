// src/app/participants/components/participant-table/participant-table.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { ParticipantModel } from '../../model/participant.model';
import { ParticipantAddDialogComponent } from '../participant-add-dialog/participant-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';
import { ToastService } from '../../../common/services/toast/toast.service';
import { ParticipantService } from '../../services.service';

@Component({
  selector: 'app-participant-table',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './participant-table.component.html',
  styleUrls: ['./participant-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantTableComponent {
  @Input() participants: ParticipantModel[] = [];
  @Input() organizationId!: string;
  @Input() sportId!: string;
  @Input() entityId!: string;

  @Output() addParticipant = new EventEmitter<ParticipantModel>();
  @Output() editParticipant = new EventEmitter<ParticipantModel>();
  @Output() deleteParticipantEvent = new EventEmitter<string>();
  @Output() viewParticipant = new EventEmitter<string>();

  private dialog = inject(MatDialog);
  private participantService = inject(ParticipantService);
  private toast = inject(ToastService);
  private router = inject(Router);

  openAddDialog(): void {
    const dialogRef = this.dialog.open(ParticipantAddDialogComponent, {
      width: '400px',
      data: { organizationId: this.organizationId },
    });

    dialogRef.afterClosed().subscribe((newParticipant: ParticipantModel | undefined) => {
      if (newParticipant) {
        this.addParticipant.emit(newParticipant);
        this.toast.success(`Participant "${newParticipant.name}" added successfully.`, 'Added');
      }
    });
  }

  openEditDialog(participant: ParticipantModel): void {
    const dialogRef = this.dialog.open(ParticipantAddDialogComponent, {
      width: '400px',
      data: {
        organizationId: this.organizationId,
        participant: participant,
      },
    });

    dialogRef.afterClosed().subscribe((updated: ParticipantModel | undefined) => {
      if (updated) {
        this.editParticipant.emit(updated);
        this.toast.success(`Participant "${updated.name}" updated successfully.`, 'Updated');
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
        this.participantService.deleteParticipant(this.organizationId, participant.id);
        this.deleteParticipantEvent.emit(participant.id);
        this.toast.success(`Participant "${participant.name}" deleted successfully.`, 'Deleted');
      }
    });
  }

  navigateToDetail(participant: ParticipantModel): void {
    this.router.navigate(['/sports', this.sportId, this.entityId, this.organizationId, participant.id]);
    this.viewParticipant.emit(participant.id);
  }
}