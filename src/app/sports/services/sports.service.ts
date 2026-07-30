import { Injectable, signal, computed, effect } from '@angular/core';
import { GoverningBody, Sport, generateId } from '../models/sport.model';
import { SEED_SPORTS } from '../data/seed-data';

const STORAGE_KEY = 'sports_catalogue';

function makeDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString();
}

@Injectable({ providedIn: 'root' })
export class SportsService {
  private sportsSignal = signal<Sport[]>([]);

  readonly sports = this.sportsSignal.asReadonly();

  readonly totalSports = computed(() => this.sports().length);
  readonly totalGoverningBodies = computed(() =>
    this.sports().reduce((sum, s) => sum + s.governingBodies.length, 0)
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
    const seedCopy = SEED_SPORTS.map(sport => ({
      ...sport,
      governingBodies: sport.governingBodies.map(gb => ({ ...gb })),
    }));
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

  getGoverningBodyById(sportId: string, gbId: string): GoverningBody | undefined {
    const sport = this.getSportById(sportId);
    return sport?.governingBodies.find(gb => gb.id === gbId);
  }
}