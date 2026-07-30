import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomBreadcrumbsComponent } from './../../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';
import { ActivatedRoute, Router } from '@angular/router';
import { SportsService } from '../../services/sports/sports.service';
import { SportModel } from '../../models/sport.model';
import { SportAddDialogComponent } from '../sport-add-dialog/sport-add-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { SportConfirmDialogComponent, SportConfirmDialogData } from '../sport-confirm-dialog/sport-confirm-dialog.component';
import { ToastService } from './../../../common/services/toast/toast.service';
import { ChangeDetectorRef } from '@angular/core';
import { EntityTableComponent } from '../../../entities/components/entity-table/entity-table.component';
import { EntityModel } from '../../../entities/model/entity.model';

@Component({
  selector: 'app-sport-detail',
  standalone: true,
  imports: [CommonModule, CustomBreadcrumbsComponent, EntityTableComponent],
  templateUrl: './sport-detail.component.html',
  styleUrls: ['./sport-detail.component.scss'],
})
export class SportDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sportsService = inject(SportsService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  sport?: SportModel;

  get sportId(): string {
    return this.sport?.id ?? '';
  }

  get entities(): EntityModel[] {
    return this.sport?.entities ?? [];
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('sportId');
    if (id) {
      this.sport = this.sportsService.getSportById(id);
      if (!this.sport) {
        this.toast.error('Sport not found', 'Error');
        this.router.navigate(['/sports']);
      }
    }
    console.log(this.sport);
  }

  get totalCompetitions(): number {
    if (!this.sport?.entities) return 0;
    return this.sport.entities.reduce(
      (sum, gb) => sum + (gb?.organizations?.length ?? 0),
      0
    );
  }

  get totalParticipants(): number {
    if (!this.sport?.entities) return 0;
    return this.sport.entities.reduce((sum, gb) => {
      const orgs = gb?.organizations ?? [];
      return sum + orgs.reduce(
        (s, org) => s + (org?.participants?.length ?? 0),
        0
      );
    }, 0);
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
        this.sport = this.sportsService.getSportById(sport.id);
        this.toast.success(`Sport "${sport.name}" updated successfully!`, 'Updated');
        this.cdr.detectChanges();
      }
    });
  }

  deleteSport(sport: SportModel): void {
    const dialogRef = this.dialog.open(SportConfirmDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {
        title: 'Delete Sport',
        message: `Are you sure you want to delete <strong>${sport.name}</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      } as SportConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.sportsService.deleteSport(sport.id);
        this.toast.success(`Sport "${sport.name}" deleted successfully.`, 'Deleted');
        setTimeout(() => {
          this.router.navigate(['/sports']);
        }, 800);
      }
    });
  }

  onEntityAdded(newEntity: EntityModel): void {
    if (!this.sport) return;
    if (!this.sport.entities) {
      this.sport.entities = [];
    }
    this.sport.entities = [...this.sport.entities, newEntity];
    this.cdr.detectChanges();
  }

  editEntity(entity: any): void {
    console.log('Edit entity', entity);
  }

  deleteEntity(entity: any): void {
    console.log('Delete entity', entity);
  }
}