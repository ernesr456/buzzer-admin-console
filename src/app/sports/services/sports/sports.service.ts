// src/app/sports/services/sports/sports.service.ts
import { Injectable, signal, computed, effect } from '@angular/core';
import { SportModel, generateId } from '../../models/sport.model';
import { EntityModel } from '../../../entities/model/entity.model';
import { OrganizationModel } from '../../../organizations/model/organization.model';
import { SEED_DATA } from '../../../common/data/seed-data';

const STORAGE_KEY = 'sports_catalogue';

@Injectable({ providedIn: 'root' })
export class SportsService {
  private sportsSignal = signal<SportModel[]>([]);
  readonly sports = this.sportsSignal.asReadonly();
  readonly loading = signal(false); // for future async operations

  // Computed stats
  readonly totalSports = computed(() => this.sports().length);
  readonly totalEntities = computed(() =>
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

  addSport(sport: Omit<SportModel, 'id' | 'entities'>): void {
    const newSport: SportModel = {
      id: generateId(),
      ...sport,
      entities: [],
    };
    this.sportsSignal.update(list => [...list, newSport]);
  }

  updateSport(id: string, updates: Partial<Omit<SportModel, 'id'>>): void {
    this.sportsSignal.update(list =>
      list.map(s => (s.id === id ? { ...s, ...updates } : s))
    );
  }

  deleteSport(id: string): void {
    this.sportsSignal.update(list => list.filter(s => s.id !== id));
  }

  resetToSeed(): void {
    // Deep copy the seed data to avoid mutation
    const seedCopy = SEED_DATA.map(sport => ({
      ...sport,
      entities: sport.entities.map(gb => ({
        ...gb,
        organizations: gb.organizations.map(org => ({
          ...org,
          participants: org.participants ? [...org.participants] : []
        }))
      }))
    }));
    this.sportsSignal.set(seedCopy);
  }

  // --- Entity (Governing Body) CRUD ---
  addEntity(sportId: string, entity: Omit<EntityModel, 'id'>): void {
    this.sportsSignal.update(list =>
      list.map(sport => {
        if (sport.id !== sportId) return sport;
        const newEntity: EntityModel = {
          id: generateId(),
          ...entity,
          organizations: [],
        };
        return {
          ...sport,
          entities: [...(sport.entities || []), newEntity],
        };
      })
    );
  }

  updateEntity(sportId: string, entityId: string, updates: Partial<Omit<EntityModel, 'id'>>): void {
    this.sportsSignal.update(list =>
      list.map(sport => {
        if (sport.id !== sportId) return sport;
        const updatedEntities = (sport.entities || []).map(e =>
          e.id === entityId ? { ...e, ...updates } : e
        );
        return { ...sport, entities: updatedEntities };
      })
    );
  }

  deleteEntity(sportId: string, entityId: string): void {
    this.sportsSignal.update(list =>
      list.map(sport => {
        if (sport.id !== sportId) return sport;
        return {
          ...sport,
          entities: (sport.entities || []).filter(e => e.id !== entityId),
        };
      })
    );
  }

  // --- Organisation & Participant CRUD will follow similar pattern ---
  // (Add when needed)

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