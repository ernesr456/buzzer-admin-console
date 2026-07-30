import { Component, Input, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EntityModel } from '../../model/entity.model';
import { EntityAddDialogComponent } from '../entity-add-dialog/entity-add-dialog.component';

@Component({
  selector: 'app-entity-table',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './entity-table.component.html',
  styleUrls: ['./entity-table.component.scss']
})
export class EntityTableComponent {
  @Input() entities: EntityModel[] = [];
  @Input() sportId!: string;
  @Output() editEntity = new EventEmitter<EntityModel>();
  @Output() deleteEntity = new EventEmitter<EntityModel>();
  @Output() addEntity = new EventEmitter<EntityModel>();

  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  get tableRows() {
    return this.entities
      .filter(entity => entity != null)
      .map(entity => ({
        ...entity,
        competitions: entity.organizations?.length ?? 0,
        participants: (entity.organizations ?? []).reduce(
          (sum, org) => sum + (org.participants?.length ?? 0),
          0
        )
      }));
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(EntityAddDialogComponent, {
      width: '400px',
      data: { sportId: this.sportId }
    });

    dialogRef.afterClosed().subscribe((newEntity: EntityModel | undefined) => {
      if (newEntity) {
        this.addEntity.emit(newEntity);
        this.entities.push(newEntity);
        this.cdr.detectChanges();
      }
    });
  }

  openEditDialog(entity: EntityModel): void {
    const dialogRef = this.dialog.open(EntityAddDialogComponent, {
      width: '400px',
      data: {
        sportId: this.sportId,
        entity: entity
      }
    });

    dialogRef.afterClosed().subscribe((updatedEntity: EntityModel | undefined) => {
      if (updatedEntity) {
        // Emit to parent (optional)
        this.editEntity.emit(updatedEntity);
        // Find and replace the entity in the local array
        const index = this.entities.findIndex(e => e.id === updatedEntity.id);
        if (index !== -1) {
          this.entities[index] = updatedEntity;    // mutate in place
        }
        // Force view update
        this.cdr.detectChanges();
      }
    });
  }
}