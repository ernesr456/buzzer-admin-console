import { Injectable, signal, computed, effect } from '@angular/core';
import { SportModel, generateId } from '../../models/sport.model';
import { SEED_DATA } from '../../../common/data/seed-data';

const STORAGE_KEY = 'sports_catalogue';

@Injectable({ providedIn: 'root' })
export class SportsService {
  private sportsSignal = signal<SportModel[]>([]);

  readonly sports = this.sportsSignal.asReadonly();

  readonly totalSports = computed(() => this.sports().length);
  readonly totalentities = computed(() =>
    this.sports().reduce((sum, s) => sum + (s.entities?.length ?? 0), 0)
  );
  readonly totalOrganisations = computed(() =>
    this.sports().reduce(
      (sum, s) => sum + (s.entities ?? []).reduce(
        (gbSum, gb) => gbSum + (gb.organizations ?? []).length,
        0
      ),
      0
    )
  );

  readonly totalParticipants = computed(() =>
    this.sports().reduce((sum, sport) =>
      sum + (sport.entities ?? []).reduce((gbSum, gb) =>
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
  getSportById(id: string): SportModel | undefined {
    return this.sports().find(s => s.id === id);
  }

  addSport(sport: Omit<SportModel, 'id'>): void {
    const newSport: SportModel = {
      id: generateId(),
      ...sport,
    };
    this.sportsSignal.update(list => [...list, newSport]);
  }

  updateSport(id: string, updates: Partial<Omit<SportModel, 'id'>>): void {
    return this.sportsSignal.update(list =>
      list.map(s => (s.id === id ? { ...s, ...updates } : s))
    );
  }

  deleteSport(id: string): void {
    this.sportsSignal.update(list => list.filter(s => s.id !== id));
  }

  resetToSeed(): void {
    const seedCopy = SEED_DATA.map(sport => ({
      ...sport,
      entities: sport.entities.map(gb => ({ ...gb })),
    }));
    this.sportsSignal.set(seedCopy);
  }

  // --- Storage ---
  private loadFromStorage(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SportModel[];
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

  private saveToStorage(data: SportModel[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}