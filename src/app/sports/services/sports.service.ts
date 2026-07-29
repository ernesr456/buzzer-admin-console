import { Injectable, signal, computed, effect } from '@angular/core';
import { Sport, generateId } from '../models/sport.model';

const STORAGE_KEY = 'sports_catalogue';
const SEED_DATA: Sport[] = [
  { id: generateId(), name: 'Football', emoji: '⚽', color: '#FFB414', governingBodies: 5, organisations: 12, participants: 450 },
  { id: generateId(), name: 'Basketball', emoji: '🏀', color: '#EC193C', governingBodies: 3, organisations: 8, participants: 320 },
  { id: generateId(), name: 'Tennis', emoji: '🎾', color: '#2ED368', governingBodies: 2, organisations: 6, participants: 180 },
];

@Injectable({ providedIn: 'root' })
export class SportsService {
  // Internal signal holding the array
  private sportsSignal = signal<Sport[]>([]);

  // Expose readonly version
  readonly sports = this.sportsSignal.asReadonly();

  // Computed statistics
  readonly totalSports = computed(() => this.sports().length);
  readonly totalGoverningBodies = computed(() =>
    this.sports().reduce((sum, s) => sum + s.governingBodies, 0)
  );
  readonly totalOrganisations = computed(() =>
    this.sports().reduce((sum, s) => sum + s.organisations, 0)
  );
  readonly totalParticipants = computed(() =>
    this.sports().reduce((sum, s) => sum + s.participants, 0)
  );

  constructor() {
    this.loadFromStorage();
    effect(() => {
      this.saveToStorage(this.sports());
    });
  }

  addSport(sport: Omit<Sport, 'id'>): void {
    const newSport: Sport = {
      id: generateId(),
      ...sport,
    };
    this.sportsSignal.update(list => [...list, newSport]);
  }

  updateSport(id: string, updates: Partial<Omit<Sport, 'id'>>): void {
    this.sportsSignal.update(list =>
      list.map(s => (s.id === id ? { ...s, ...updates } : s))
    );
  }

  deleteSport(id: string): void {
    this.sportsSignal.update(list => list.filter(s => s.id !== id));
  }

  resetToSeed(): void {
    const seedCopy = SEED_DATA.map(s => ({ ...s, id: generateId() }));
    this.sportsSignal.set(seedCopy);
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Sport[];
        if (Array.isArray(parsed) && parsed.length) {
          this.sportsSignal.set(parsed);
          return;
        }
      } catch {

      }
    }
    this.resetToSeed();
  }
  getSportById(id: string): Sport | undefined {
    return this.sports().find(s => s.id === id);
  }

  private saveToStorage(data: Sport[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}