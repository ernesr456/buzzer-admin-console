import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-sport-add-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './sport-dialog.component.html',
  styleUrls: ['./sport-dialog.component.scss'], // can be empty
})
export class SportAddDialogComponent {
  private dialogRef = inject(MatDialogRef<SportAddDialogComponent>);

  name = '';
  emoji = '';
  color = '#FFB414';
  governingBodies = 0;
  organisations = 0;
  participants = 0;

  submit(): void {
    this.dialogRef.close({
      name: this.name,
      emoji: this.emoji,
      color: this.color,
      governingBodies: this.governingBodies,
      organisations: this.organisations,
      participants: this.participants,
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}