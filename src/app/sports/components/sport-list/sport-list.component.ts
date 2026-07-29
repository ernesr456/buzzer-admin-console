import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SportsService } from '../../services/sports.service';
import { Sport } from '../../models/sport.model';
import { SportAddDialogComponent } from '../sport-dialog/sport-dialog.component';

@Component({
  selector: 'app-sport-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sport-list.component.html',
  styleUrls: ['./sport-list.component.scss'],
})
export class SportListComponent {
  private sportsService = inject(SportsService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  searchQuery = signal('');

  filteredSports = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.sportsService.sports();
    return this.sportsService.sports().filter(s =>
      s.name.toLowerCase().includes(query)
    );
  });

  totalSports = this.sportsService.totalSports;
  totalGoverningBodies = this.sportsService.totalGoverningBodies;
  totalOrganisations = this.sportsService.totalOrganisations;
  totalParticipants = this.sportsService.totalParticipants;

  openAddDialog(): void {
    const dialogRef = this.dialog.open(SportAddDialogComponent, {
      width: '450px',
      panelClass: 'dark-dialog', // optional for dark theme
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sportsService.addSport(result);
      }
    });
  }
  openEditDialog(sport: Sport): void {
    const dialogRef = this.dialog.open(SportAddDialogComponent, {
      width: '450px',
      panelClass: 'dark-dialog',
      data: sport, // pass the existing sport for editing
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // result contains updated fields
        this.sportsService.updateSport(sport.id, result);
      }
    });
  }

  navigateToDetail(sportId: string): void {
    this.router.navigate(['/sports', sportId]);
  }

  resetToSeed(): void {
    if (confirm('Reset all sports to seed data? This will discard changes.')) {
      this.sportsService.resetToSeed();
    }
  }
  deleteSport(sport: Sport): void {
    if (confirm(`Are you sure you want to delete "${sport.name}"?`)) {
      this.sportsService.deleteSport(sport.id);
    }
  }
}