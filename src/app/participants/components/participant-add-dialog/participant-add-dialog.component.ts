// src/app/participants/components/participant-add-dialog/participant-add-dialog.component.ts

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ParticipantModel } from '../../model/participant.model';
import { ParticipantService } from '../../services.service';

export interface ParticipantDialogData {
  organizationId: string;
  participant?: ParticipantModel;
}

@Component({
  selector: 'app-participant-add-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './participant-add-dialog.component.html',
  styleUrls: ['./participant-add-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantAddDialogComponent {
  private dialogRef = inject(MatDialogRef<ParticipantAddDialogComponent>);
  private data = inject<ParticipantDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private participantService = inject(ParticipantService);

  participantForm = this.fb.group({
    name: [this.data.participant?.name ?? '', [Validators.required, Validators.minLength(2)]],
    logo: [this.data.participant?.logo ?? ''],
  });

  isEdit = !!this.data.participant;
  orgId = this.data.organizationId;

  get f() {
    return this.participantForm.controls;
  }

  submit(): void {
    if (this.participantForm.invalid) {
      this.participantForm.markAllAsTouched();
      return;
    }

    const { name, logo } = this.participantForm.value;

    if (this.isEdit && this.data.participant) {
      const updated = this.participantService.updateParticipant(
        this.orgId,
        this.data.participant.id,
        { name: name!, logo: logo || undefined }
      );
      this.dialogRef.close(updated);
    } else {
      const newParticipant = this.participantService.createParticipant(this.orgId, {
        name: name!,
        logo: logo || undefined,
      });
      this.dialogRef.close(newParticipant);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}