import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { SportModel } from '../../models/sport.model';
import { EntityModel } from '../../../entities/model/entity.model';
import { DataService } from '../../../core/services/data/data.service';
import { generateId } from './../../../common/utils/id-generator.util';

@Injectable({ providedIn: 'root' })
export class SportsService {
  private sportsSubject = new BehaviorSubject<SportModel[]>([]);
  sports$ = this.sportsSubject.asObservable();

  private sportsMap = new Map<string, BehaviorSubject<SportModel>>();

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
    this.sportsMap.clear();
    for (const sport of sports) {
      this.sportsMap.set(sport.id, new BehaviorSubject<SportModel>(sport));
    }
    this.sportsSubject.next(sports);
  }

  private persist(): void {
    this.dataService.saveSports(this.sportsSubject.value);
  }

  getSportById(id: string): Observable<SportModel | undefined> {
    if (this.sportsMap.has(id)) {
      return this.sportsMap.get(id)!.asObservable();
    }
    return new BehaviorSubject<SportModel | undefined>(undefined).asObservable();
  }

  addSport(sport: Omit<SportModel, 'id' | 'entities'>): void {
    const newSport: SportModel = {
      id: generateId(),
      ...sport,
      entities: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const current = this.sportsSubject.value;
    this.sportsSubject.next([...current, newSport]);
    this.sportsMap.set(newSport.id, new BehaviorSubject<SportModel>(newSport));
    this.persist();
  }

  updateSport(id: string, updates: Partial<Omit<SportModel, 'id'>>): void {
    const current = this.sportsSubject.value;
    const updatedList = current.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
    );
    this.sportsSubject.next(updatedList);
    const sportSubject = this.sportsMap.get(id);
    if (sportSubject) {
      const updatedSport = updatedList.find(s => s.id === id)!;
      sportSubject.next(updatedSport);
    }
    this.persist();
  }

  deleteSport(id: string): void {
    const current = this.sportsSubject.value;
    const filtered = current.filter(s => s.id !== id);
    this.sportsSubject.next(filtered);
    this.sportsMap.delete(id);
    this.persist();
  }

  resetToSeed(): void {
    const seedData = this.dataService.resetToSeed();
    this.initialize(seedData);
  }

  addEntity(sportId: string, entity: Omit<EntityModel, 'id'>): void {
    const current = this.sportsSubject.value;
    const newEntity: EntityModel = {
      id: generateId(),
      ...entity,
      organizations: [],
    };
    const updatedList = current.map(sport => {
      if (sport.id !== sportId) return sport;
      return {
        ...sport,
        entities: [...(sport.entities || []), newEntity],
        updatedAt: new Date(),
      };
    });
    this.sportsSubject.next(updatedList);
    const sportSubject = this.sportsMap.get(sportId);
    if (sportSubject) {
      const updatedSport = updatedList.find(s => s.id === sportId)!;
      sportSubject.next(updatedSport);
    }
    this.persist();
  }

  updateEntity(sportId: string, entityId: string, updates: Partial<Omit<EntityModel, 'id'>>): void {
    const current = this.sportsSubject.value;
    const updatedList = current.map(sport => {
      if (sport.id !== sportId) return sport;
      const entities = (sport.entities || []).map(e =>
        e.id === entityId ? { ...e, ...updates } : e
      );
      return { ...sport, entities, updatedAt: new Date() };
    });
    this.sportsSubject.next(updatedList);
    const sportSubject = this.sportsMap.get(sportId);
    if (sportSubject) {
      const updatedSport = updatedList.find(s => s.id === sportId)!;
      sportSubject.next(updatedSport);
    }
    this.persist();
  }

  deleteEntity(sportId: string, entityId: string): void {
    const current = this.sportsSubject.value;
    const updatedList = current.map(sport => {
      if (sport.id !== sportId) return sport;
      return {
        ...sport,
        entities: (sport.entities || []).filter(e => e.id !== entityId),
        updatedAt: new Date(),
      };
    });
    this.sportsSubject.next(updatedList);
    const sportSubject = this.sportsMap.get(sportId);
    if (sportSubject) {
      const updatedSport = updatedList.find(s => s.id === sportId)!;
      sportSubject.next(updatedSport);
    }
    this.persist();
  }

  addFullSports(newSports: SportModel[]): void {
    const current = this.sportsSubject.value;
    const merged: SportModel[] = [...current];

    for (const sport of newSports) {
      // Use the provided ID, or generate one if missing
      const newSport: SportModel = {
        ...sport,
        id: sport.id || generateId(),
        createdAt: sport.createdAt || new Date(),
        updatedAt: sport.updatedAt || new Date(),
        entities: (sport.entities || []).map(entity => ({
          ...entity,
          id: entity.id || generateId(),
          createdAt: entity.createdAt || new Date(),
          updatedAt: entity.updatedAt || new Date(),
          onboardedAt: entity.onboardedAt || undefined,
          organizations: (entity.organizations || []).map(org => ({
            ...org,
            id: org.id || generateId(),
            createdAt: org.createdAt || new Date(),
            updatedAt: org.updatedAt || new Date(),
            onboardedAt: org.onboardedAt || undefined,
            participants: (org.participants || []).map(part => ({
              ...part,
              id: part.id || generateId(),
            })),
          })),
        })),
      };

      merged.push(newSport);
      this.sportsMap.set(newSport.id, new BehaviorSubject<SportModel>(newSport));
    }

    this.sportsSubject.next(merged);
    this.persist();
  }
}