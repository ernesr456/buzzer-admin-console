import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { EntityService } from '../../services/entity.service';
import { EntityModel } from '../../model/entity.model';
import { finalize } from 'rxjs';

export interface EntityDialogData {
  sportId?: string;
  entity?: EntityModel;
}

@Component({
  selector: 'app-entity-add-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './entity-add-dialog.component.html',
  styleUrls: ['./entity-add-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityAddDialogComponent {
  private dialogRef = inject(MatDialogRef<EntityAddDialogComponent>);
  private data = inject<EntityDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private entityService = inject(EntityService);
  private route = inject(ActivatedRoute);

  // Loading state
  loading = signal(false);

  sportId = this.route.snapshot.paramMap.get('sportId') ?? this.data.sportId ?? '';

  entityForm = this.fb.group({
    name: [this.data.entity?.name ?? '', [Validators.required, Validators.minLength(2)]],
    country: [this.data.entity?.country ?? '', [Validators.required]],
  });

  isEdit = !!this.data.entity;

  get f() {
    return this.entityForm.controls;
  }

  submit(): void {
    if (this.entityForm.invalid) {
      this.entityForm.markAllAsTouched();
      return;
    }

    if (!this.sportId) {
      console.error('No sportId available');
      return;
    }

    this.loading.set(true);
    const { name, country } = this.entityForm.value;

    if (this.isEdit && this.data.entity) {
      const updatedEntity: EntityModel = {
        ...this.data.entity,
        name: name!,
        country: country!,
        updatedAt: new Date(),
      };

      this.entityService.updatesEntity(this.data.entity.id, this.sportId, updatedEntity)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (result) => this.dialogRef.close(result),
          error: (err) => console.error('Update failed', err),
        });
    } else {
      const newEntity: EntityModel = {
        id: '',
        name: name!,
        country: country!,
        sportId: this.sportId,
        organizations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        onboardedAt: new Date(),
      };

      this.entityService.addEntity(this.sportId, newEntity)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (result) => this.dialogRef.close(result),
          error: (err) => console.error('Creation failed', err),
        });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}