import { Component, Input, Output, EventEmitter, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EntityModel } from '../../model/entity.model';
import { EntityAddDialogComponent } from '../entity-add-dialog/entity-add-dialog.component';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';
import { EntityService } from '../../services/entity.service';
import { ToastService } from '../../../common/services/toast/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-entity-table',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './entity-table.component.html',
  styleUrls: ['./entity-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityTableComponent {
  @Input() entities: EntityModel[] = [];
  @Input() sportId!: string;
  @Output() editEntity = new EventEmitter<EntityModel>();
  @Output() addEntity = new EventEmitter<EntityModel>();
  @Output() deleteEntityEvent = new EventEmitter<string>();  

  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private entityService = inject(EntityService);
  private toast = inject(ToastService);
  private router = inject(Router);

  
  

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
          this.entities[index] = updatedEntity;
        }
        
      }
    });
  }
  deleteEntity(entity: EntityModel): void {
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {
        title: 'Delete Sport',
        message: `Are you sure you want to delete <strong>${entity.name}</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      } as CustomDialogData,
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.entityService.deleteEntity(this.sportId, entity.id);
        this.deleteEntityEvent.emit(entity.id);        // ✅ now works
        this.entities = this.entities.filter(e => e.id !== entity.id);
        this.cdr.markForCheck();
        this.toast.success(`Sport "${entity.name}" deleted successfully.`, 'Deleted');
      }
    });
  }
  navigateToDetail(sportId:string,entityId:string): void {
    this.router.navigateByUrl(`/sports/${this.sportId}/${entityId}`);
  }
}