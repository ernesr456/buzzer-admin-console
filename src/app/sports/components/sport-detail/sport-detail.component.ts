import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SportsService } from '../../services/sports.service';
import { Sport } from '../../models/sport.model';

@Component({
  selector: 'app-sport-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sport-detail.component.html',
  styleUrls: ['./sport-detail.component.scss'],
})
export class SportDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sportsService = inject(SportsService);

  sport = signal<Sport | null>(null);
  isEditing = signal(false);

  // Editable fields (copy of sport data)
  editName = '';
  editEmoji = '';
  editColor = '#FFB414';
  editGoverningBodies = 0;
  editOrganisations = 0;
  editParticipants = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const found = this.sportsService.getSportById(id);
      if (found) {
        this.sport.set(found);
        this.populateEditFields(found);
      } else {
        // navigate back if not found
        this.router.navigate(['/sports']);
      }
    }
  }

  private populateEditFields(sport: Sport): void {
    this.editName = sport.name;
    this.editEmoji = sport.emoji;
    this.editColor = sport.color;
    this.editGoverningBodies = sport.governingBodies;
    this.editOrganisations = sport.organisations;
    this.editParticipants = sport.participants;
  }

  toggleEdit(): void {
    this.isEditing.set(!this.isEditing());
    if (this.isEditing()) {
      // Reset fields to current sport values
      const current = this.sport();
      if (current) this.populateEditFields(current);
    }
  }

  saveChanges(): void {
    const current = this.sport();
    if (!current) return;
    const updated: Partial<Omit<Sport, 'id'>> = {
      name: this.editName,
      emoji: this.editEmoji,
      color: this.editColor,
      governingBodies: this.editGoverningBodies,
      organisations: this.editOrganisations,
      participants: this.editParticipants,
    };
    this.sportsService.updateSport(current.id, updated);
    // Update the local signal with new values
    this.sport.set({
      ...current,
      ...updated,
    });
    this.isEditing.set(false);
  }

  deleteSport(): void {
    const current = this.sport();
    if (!current) return;
    if (confirm(`Delete sport "${current.name}"?`)) {
      this.sportsService.deleteSport(current.id);
      this.router.navigate(['/sports']);
    }
  }

  goBack(): void {
    this.router.navigate(['/sports']);
  }
}