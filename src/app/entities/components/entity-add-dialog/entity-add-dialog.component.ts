// src/app/entities/components/entity-add-dialog/entity-add-dialog.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EntityService } from '../../services/entity.service';
import { EntityModel } from '../../model/entity.model';

export interface EntityDialogData {
  sportId: string;
  entity?: EntityModel;
}

@Component({
  selector: 'app-entity-add-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './entity-add-dialog.component.html',
  styleUrls: ['./entity-add-dialog.component.scss'],
})
export class EntityAddDialogComponent {
  private dialogRef = inject(MatDialogRef<EntityAddDialogComponent>);
  private data = inject<EntityDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private entityService = inject(EntityService);

  entityForm = this.fb.group({
    name: [this.data.entity?.name ?? '', [Validators.required, Validators.minLength(2)]],
    logo: [this.data.entity?.logo ?? '', [Validators.required]],
  });

  isEdit = !!this.data.entity;
  sportId = this.data.sportId;

  get f() {
    return this.entityForm.controls;
  }

  submit(): void {
    if (this.entityForm.invalid) {
      this.entityForm.markAllAsTouched();
      return;
    }

    const { name, logo } = this.entityForm.value;

    if (this.isEdit && this.data.entity) {
      const updated = this.entityService.updateEntity(this.sportId, this.data.entity.id, { name, logo } as Partial<EntityModel>);
      this.dialogRef.close(updated);
    } else {
      const newEntity = this.entityService.createEntity(this.sportId, {
        name: name!,
        logo: logo!,
        organizations: [],
      });
      this.dialogRef.close(newEntity);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}