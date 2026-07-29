import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SportsService } from '../../services/sports.service';
import { Sport } from '../../models/sport.model';

@Component({
  selector: 'app-sport-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sport-detail.component.html',
  styleUrls: ['./sport-detail.component.scss'],
})
export class SportDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sportsService = inject(SportsService);
  private fb = inject(FormBuilder);

  sport = signal<Sport | null>(null);
  isEditing = signal(false);

  sportForm!: FormGroup;

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
        this.initForm(found); // <-- build the form
      } else {
        this.router.navigate(['/sports']);
      }
    }
  }

  private initForm(sport: Sport): void {
    this.sportForm = this.fb.group({
      name: [sport.name, [Validators.required, Validators.minLength(2)]],
      emoji: [sport.emoji, Validators.required],
      color: [sport.color, Validators.required],
      governingBodies: [sport.governingBodies, [Validators.required, Validators.min(0)]],
      organisations: [sport.organisations, [Validators.required, Validators.min(0)]],
      participants: [sport.participants, [Validators.required, Validators.min(0)]],
    });
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
    if (this.isEditing()) {
      // Cancelling edit: reset form to original sport data
      const current = this.sport();
      if (current) {
        this.sportForm.patchValue({
          name: current.name,
          emoji: current.emoji,
          color: current.color,
          governingBodies: current.governingBodies,
          organisations: current.organisations,
          participants: current.participants,
        });
      }
    }
    this.isEditing.set(!this.isEditing());
  }

  get f() {
    return this.sportForm.controls;
  }

  saveChanges(): void {
    if (this.sportForm.invalid) {
      // Mark all fields as touched to display errors
      this.sportForm.markAllAsTouched();
      return;
    }

    const current = this.sport();
    if (!current) return;

    const updated = this.sportForm.value; // all fields are valid
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