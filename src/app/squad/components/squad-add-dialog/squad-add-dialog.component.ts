import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { SquadModel } from '../../models/squad.model';
import { SquadService } from '../../services/squad.service';
import { UserService } from '../../../users/services/user.service';
import { UserModel } from '../../../users/models/user.model';

export interface SquadDialogData {
  orgId: string;
  squad?: SquadModel;
}

@Component({
  selector: 'app-squad-add-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  templateUrl: './squad-add-dialog.component.html',
  styleUrls: ['./squad-add-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SquadAddDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<SquadAddDialogComponent>);
  private data = inject<SquadDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private squadService = inject(SquadService);
  private userService = inject(UserService);

  userList: UserModel[] = [];
  isLoadingUsers = false;
  isEdit = !!this.data.squad;
  loading = false;

  squadForm = this.fb.group({
    userId: [this.data.squad?.userId ?? '', Validators.required],
    position: [this.data.squad?.position ?? '', Validators.required],
    agreementEnd: [this.data.squad?.agreementEnd ?? '', Validators.required],
  });

  get f() {
    return this.squadForm.controls;
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoadingUsers = true;
    this.userService.getUsers(this.data.orgId).subscribe({
      next: (users) => {
        this.userList = users;
        this.isLoadingUsers = false;
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.isLoadingUsers = false;
      },
    });
  }

  submit(): void {
    if (this.squadForm.invalid) {
      this.squadForm.markAllAsTouched();
      return;
    }

    const { userId, position, agreementEnd } = this.squadForm.value;
    this.loading = true;

    const baseSquad: Partial<SquadModel> = {
      userId: userId!,
      position: position!,
      agreementEnd: agreementEnd!,
    };

    if (this.isEdit && this.data.squad) {
      const updatedSquad: SquadModel = {
        ...this.data.squad,
        ...baseSquad,
        id: this.data.squad.id,
        organizationId: this.data.squad.organizationId,
        createdAt: this.data.squad.createdAt,
        updatedAt: new Date(),
      };
      console.log(updatedSquad);
      this.squadService.updatesSquad(updatedSquad).subscribe({
        next: (result) => {
          this.dialogRef.close(result);
          this.loading = false;
        },
        error: (err) => {
          console.error('Update failed:', err);
          alert('Failed to update squad member.');
          this.loading = false;
        },
      });
    } else {
      const newSquad: SquadModel = {
        id: '',
        organizationId: this.data.orgId,
        userId: userId!,
        position: position!,
        agreementEnd: agreementEnd!,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.squadService.addSquad(this.data.orgId, newSquad).subscribe({
        next: (result) => {
          this.dialogRef.close(result);
          this.loading = false;
        },
        error: (err) => {
          console.error('Add failed:', err);
          alert('Failed to create squad member.');
          this.loading = false;
        },
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}