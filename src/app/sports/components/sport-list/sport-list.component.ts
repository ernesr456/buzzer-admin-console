import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SportsService } from '../../services/sports/sports.service';
import { SportModel } from '../../models/sport.model';
import { SportAddDialogComponent } from '../sport-add-dialog/sport-add-dialog.component';
import { SportConfirmDialogComponent, SportConfirmDialogData } from '../sport-confirm-dialog/sport-confirm-dialog.component';
import { CustomBreadcrumbsComponent } from '../../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';
import { ToastService } from './../../../common/services/toast/toast.service';

@Component({
  selector: 'app-sport-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomBreadcrumbsComponent],
  templateUrl: './sport-list.component.html',
  styleUrls: ['./sport-list.component.scss'],
})
export class SportListComponent implements OnInit{
  private sportsService = inject(SportsService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private toast = inject(ToastService);

  ngOnInit() {
    console.log('ToastComponent instantiated with:', this.toast);
  }

  searchQuery = signal('');

  filteredSports = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.sportsService.sports();
    return this.sportsService.sports().filter(s =>
      s.name.toLowerCase().includes(query)
    );
  });

  totalSports = this.sportsService.totalSports;
  totalentities = this.sportsService.totalentities;
  totalOrganisations = this.sportsService.totalOrganisations;
  totalParticipants = this.sportsService.totalParticipants;

  openAddDialog(): void {
    const dialogRef = this.dialog.open(SportAddDialogComponent, {
      width: '450px',
      panelClass: 'dark-dialog',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sportsService.addSport(result);
      }
    });
  }

  openEditDialog(sport: SportModel): void {
    const dialogRef = this.dialog.open(SportAddDialogComponent, {
      width: '450px',
      panelClass: 'dark-dialog',
      data: sport, // pass the existing sport for editing
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // result contains updated fields
        this.sportsService.updateSport(sport.id, result);
        this.toast.success(`Sport "${sport.name}" updated successfully!`, 'Updated');
      }
    });
  }

  navigateToDetail(sportId: string): void {
    this.router.navigate(['/sports', sportId]);
  }

  resetToSeed(): void {
    const dialogRef = this.dialog.open(SportConfirmDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: {
        title: 'Reset to Seed',
        message: 'This will discard all changes and restore the default sports catalogue. Are you sure?',
        confirmText: 'Reset',
        confirmColor: 'accent',
      } as SportConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.sportsService.resetToSeed();
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
        confirmColor: 'warn', // red
      } as SportConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.sportsService.deleteSport(sport.id);
        this.toast.success(`Sport "${sport.name}" deleted successfully.`, 'Deleted');
        console.log('Toast success called');
      }
    });
  }

  getOrganizationsCount(sport: SportModel): number {
    return (sport.entities ?? []).reduce(
      (sum, gb) => sum + (gb.organizations?.length ?? 0),
      0
    );
  }
  getParticipantsCount(sport: SportModel): number {
    return (sport.entities ?? []).reduce(
      (sum, gb) => sum + (gb.organizations ?? []).reduce(
        (orgSum, org) => orgSum + (org.participants ?? []).length,
        0
      ),
      0
    );
  }
}