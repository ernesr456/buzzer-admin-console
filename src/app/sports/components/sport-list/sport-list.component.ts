import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, combineLatest, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { SportsService } from '../../services/sports/sports.service';
import { SportModel } from '../../models/sport.model';
import { SportAddDialogComponent } from '../sport-add-dialog/sport-add-dialog.component';
import { CustomBreadcrumbsComponent } from '../../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';
import { ToastService } from '../../../common/services/toast/toast.service';
import { CustomDialogComponent, CustomDialogData } from '../../../common/components/custom-dialog/custom-dialog.component';

@Component({
  selector: 'app-sport-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomBreadcrumbsComponent],
  templateUrl: './sport-list.component.html',
  styleUrls: ['./sport-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportListComponent {
  private sportsService = inject(SportsService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private toast = inject(ToastService);

  private searchSubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchSubject.asObservable();

  filteredSports$ = combineLatest([
    this.sportsService.sports$,
    this.searchQuery$.pipe(startWith(''))
  ]).pipe(
    map(([sports, query]) => {
      const q = query.toLowerCase().trim();
      return q ? sports.filter(s => s.name.toLowerCase().includes(q)) : sports;
    })
  );

  totalSports$ = this.sportsService.totalSports$;
  totalEntities$ = this.sportsService.totalEntities$;
  totalOrganisations$ = this.sportsService.totalOrganisations$;
  totalParticipants$ = this.sportsService.totalParticipants$;

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.searchSubject.next('');
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(SportAddDialogComponent, {
      width: '450px',
      panelClass: 'dark-dialog',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sportsService.addSport(result);
        this.toast.success('Sport added successfully!', 'Added');
      }
    });
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

  navigateToDetail(sportId: string): void {
    this.router.navigate(['/sports', sportId]);
  }

  resetToSeed(): void {
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {
        title: 'Reset to Seed',
        message: 'This will discard all changes and restore the default sports catalogue. Are you sure?',
        confirmText: 'Reset',
        confirmColor: 'accent',
      } as CustomDialogData,
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.sportsService.resetToSeed();
        this.toast.success('Reset to seed data successfully.', 'Reset');
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
      }
    });
  }

  getOrganizationsCount(sport: SportModel): number {
    return (sport.entities ?? []).reduce(
      (sum, gb) => sum + (gb.organizations?.length ?? 0), 0
    );
  }

  getParticipantsCount(sport: SportModel): number {
    return (sport.entities ?? []).reduce(
      (sum, gb) => sum + (gb.organizations ?? []).reduce(
        (orgSum, org) => orgSum + (org.participants ?? []).length, 0
      ), 0
    );
  }

  trackByFn(index: number, sport: SportModel): string {
    return sport.id;
  }
}