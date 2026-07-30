import { Injectable, signal, computed, effect } from '@angular/core';
import { Sport, generateId } from '../../models/sport.model';
import { SEED_SPORTS } from '../../data/seed-data';

const STORAGE_KEY = 'sports_catalogue';

@Injectable({ providedIn: 'root' })
export class SportsService {
  private sportsSignal = signal<Sport[]>([]);

  readonly sports = this.sportsSignal.asReadonly();

  readonly totalSports = computed(() => this.sports().length);
  readonly totalGoverningBodies = computed(() =>
    this.sports().reduce((sum, s) => sum + (s.governingBodies?.length ?? 0), 0)
  );
  readonly totalOrganisations = computed(() =>
    this.sports().reduce(
      (sum, s) => sum + (s.governingBodies ?? []).reduce(
        (gbSum, gb) => gbSum + (gb.organizations ?? []).length,
        0
      ),
      0
    )
  );

  readonly totalParticipants = computed(() =>
    this.sports().reduce((sum, sport) =>
      sum + (sport.governingBodies ?? []).reduce((gbSum, gb) =>
        gbSum + (gb.organizations ?? []).reduce((orgSum, org) =>
          orgSum + (org.participants ?? []).length,
          0
        ),
        0
      ),
      0
    )
  );

  constructor() {
    this.loadFromStorage();
    effect(() => this.saveToStorage(this.sports()));
  }

  // --- Sport CRUD ---
  getSportById(id: string): Sport | undefined {
    return this.sports().find(s => s.id === id);
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

  // --- Storage ---
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
        // ignore
      }
    }
    this.resetToSeed();
  }

  private saveToStorage(data: Sport[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}