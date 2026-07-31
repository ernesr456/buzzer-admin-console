import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { CustomBreadcrumbsComponent } from '../../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';
import { SportsService } from '../../services/sports/sports.service';
import { SportModel } from '../../models/sport.model';
import { SportAddDialogComponent } from '../sport-add-dialog/sport-add-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ToastService } from '../../../common/services/toast/toast.service';
import { EntityTableComponent } from '../../../entities/components/entity-table/entity-table.component';
import { EntityModel } from '../../../entities/model/entity.model';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';

@Component({
  selector: 'app-sport-detail',
  standalone: true,
  imports: [CommonModule, CustomBreadcrumbsComponent, EntityTableComponent],
  templateUrl: './sport-detail.component.html',
  styleUrls: ['./sport-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sportsService = inject(SportsService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);
  private router = inject(Router);

  sport$!: Observable<SportModel | undefined>;
  sportId!: string;

  totalCompetitions$!: Observable<number>;
  totalParticipants$!: Observable<number>;

  ngOnInit(): void {
    this.sport$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('sportId');
        if (!id) {
          this.router.navigate(['/sports']);
          return of(undefined);
        }
        this.sportId = id;
        return this.sportsService.getSportById(id);
      })
    );

    this.totalCompetitions$ = this.sport$.pipe(
      map(sport => sport?.entities?.reduce((sum, gb) => sum + (gb?.organizations?.length ?? 0), 0) ?? 0)
    );

    this.totalParticipants$ = this.sport$.pipe(
      map(sport => sport?.entities?.reduce((sum, gb) => 
        sum + (gb?.organizations ?? []).reduce((s, org) => s + (org?.participants?.length ?? 0), 0), 0) ?? 0
      )
    );
  }

  openEditDialog(sport: SportModel): void {
    const dialogRef = this.dialog.open(SportAddDialogComponent, {
      width: '450px',
      panelClass: 'dark-dialog',
      data: sport,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sportsService.updateSport(sport.id, result);
        this.toast.success(`Sport "${sport.name}" updated successfully!`, 'Updated');
      }
    });
  }

  deleteSport(sport: SportModel): void {
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {
        title: 'Delete Sport',
        message: `Are you sure you want to delete <strong>${sport.name}</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      } as CustomDialogData,
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.sportsService.deleteSport(sport.id);
        this.toast.success(`Sport "${sport.name}" deleted successfully.`, 'Deleted');
        this.router.navigate(['/sports']);
      }
    });
  }

  // Entity CRUD handlers
  onEntityAdded(newEntity: EntityModel): void {
    if (!this.sportId) return;
    this.sportsService.addEntity(this.sportId, newEntity);
    this.toast.success(`Entity "${newEntity.name}" added successfully.`, 'Added');
  }

  // Accept 'any' to avoid strict type mismatches; actual value is EntityModel
  editEntity(entity: any): void {
    // TODO: implement edit entity dialog (similar to sport edit)
    this.toast.info('Edit entity feature coming soon.', 'Info');
  }

  deleteEntity(entity: any): void {
    if (!this.sportId) return;
    // entity is the EntityModel
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {
        title: 'Delete Entity',
        message: `Are you sure you want to delete <strong>${entity.name}</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      } as CustomDialogData,
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.sportsService.deleteEntity(this.sportId, entity.id);
        this.toast.success(`Entity "${entity.name}" deleted successfully.`, 'Deleted');
      }
    });
  }
}