import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ParticipantModel } from '../../model/participant.model';
import { ParticipantService } from '../../services/participant.service';

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
    role: [this.data.participant?.role ?? '', Validators.required],
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

    const { name, role } = this.participantForm.value;

    if (this.isEdit && this.data.participant) {
      const updatedParticipant: ParticipantModel = {
        ...this.data.participant,
        name: name!,
        role: role!,
      };
      this.participantService.updateParticipant(
        this.data.organizationId,
        this.data.participant.id,
        updatedParticipant
      ).subscribe({
        next: (res) => this.dialogRef.close(res),
        error: () => this.dialogRef.close(undefined)
      });
    } else {
      this.participantService.addParticipant(this.orgId, {
        name: name!,
        role: role!,
        organisationId:this.orgId
      }).subscribe({
        next: (res) => this.dialogRef.close(res),
        error: () => this.dialogRef.close(undefined)
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}