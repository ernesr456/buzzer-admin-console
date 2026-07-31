import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { SportModel, generateId } from '../../models/sport.model';
import { EntityModel } from '../../../entities/model/entity.model';
import { DataService } from '../../../core/services/data/data.service';
import { SEED_DATA } from '../../../common/data/seed-data';

@Injectable({ providedIn: 'root' })
export class SportsService {
  private sportsSubject = new BehaviorSubject<SportModel[]>([]);
  sports$ = this.sportsSubject.asObservable();

  totalSports$ = this.sports$.pipe(map(list => list.length));
  totalEntities$ = this.sports$.pipe(
    map(list => list.reduce((sum, s) => sum + (s.entities?.length ?? 0), 0))
  );
  totalOrganisations$ = this.sports$.pipe(
    map(list => list.reduce((sum, s) => sum + (s.entities ?? []).reduce(
      (gbSum, gb) => gbSum + (gb.organizations ?? []).length, 0
    ), 0))
  );
  totalParticipants$ = this.sports$.pipe(
    map(list => list.reduce((sum, sport) =>
      sum + (sport.entities ?? []).reduce((gbSum, gb) =>
        gbSum + (gb.organizations ?? []).reduce((orgSum, org) =>
          orgSum + (org.participants ?? []).length, 0
        ), 0
      ), 0
    ))
  );

  constructor(private dataService: DataService) {}

  initialize(sports: SportModel[]): void {
    this.sportsSubject.next(sports);
  }

  private persist(): void {
    this.dataService.saveSports(this.sportsSubject.value);
  }

  getSportById(id: string): Observable<SportModel | undefined> {
    return this.sports$.pipe(
      map(list => list.find(s => s.id === id))
    );
  }

  addSport(sport: Omit<SportModel, 'id' | 'entities'>): void {
    const newSport: SportModel = {
      id: generateId(),
      ...sport,
      entities: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const current = this.sportsSubject.value;
    this.sportsSubject.next([...current, newSport]);
    this.persist();
  }

  updateSport(id: string, updates: Partial<Omit<SportModel, 'id'>>): void {
    const current = this.sportsSubject.value;
    const updated = current.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );
    this.sportsSubject.next(updated);
    this.persist();
  }

  deleteSport(id: string): void {
    const current = this.sportsSubject.value;
    this.sportsSubject.next(current.filter(s => s.id !== id));
    this.persist();
  }

  resetToSeed(): void {
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
    this.sportsSubject.next(seedCopy);
    this.persist();
  }

  addEntity(sportId: string, entity: Omit<EntityModel, 'id'>): void {
    const current = this.sportsSubject.value;
    const newEntity: EntityModel = {
      id: generateId(),
      ...entity,
      organizations: [],
    };
    const updated = current.map(sport => {
      if (sport.id !== sportId) return sport;
      return {
        ...sport,
        entities: [...(sport.entities || []), newEntity],
        updatedAt: new Date().toISOString(),
      };
    });
    this.sportsSubject.next(updated);
    this.persist();
  }

  updateEntity(sportId: string, entityId: string, updates: Partial<Omit<EntityModel, 'id'>>): void {
    const current = this.sportsSubject.value;
    const updated = current.map(sport => {
      if (sport.id !== sportId) return sport;
      const entities = (sport.entities || []).map(e =>
        e.id === entityId ? { ...e, ...updates } : e
      );
      return { ...sport, entities, updatedAt: new Date().toISOString() };
    });
    this.sportsSubject.next(updated);
    this.persist();
  }

  deleteEntity(sportId: string, entityId: string): void {
    const current = this.sportsSubject.value;
    const updated = current.map(sport => {
      if (sport.id !== sportId) return sport;
      return {
        ...sport,
        entities: (sport.entities || []).filter(e => e.id !== entityId),
        updatedAt: new Date().toISOString(),
      };
    });
    this.sportsSubject.next(updated);
    this.persist();
  }
}