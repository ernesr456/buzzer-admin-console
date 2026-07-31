import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { EntityModel } from '../model/entity.model';
import { SportModel } from '../../sports/models/sport.model';
import { DataService } from '../../core/services/data/data.service';

@Injectable({ providedIn: 'root' })
export class EntityService {
  private entitiesMap = new Map<string, BehaviorSubject<EntityModel[]>>();

  constructor(private dataService: DataService) {}

  initialize(sports: SportModel[]): void {
    this.entitiesMap.clear();
    for (const sport of sports) {
      this.entitiesMap.set(sport.id, new BehaviorSubject<EntityModel[]>(sport.entities || []));
    }
  }

  getEntitiesForSport(sportId: string): Observable<EntityModel[]> {
    if (!this.entitiesMap.has(sportId)) {
      this.entitiesMap.set(sportId, new BehaviorSubject<EntityModel[]>([]));
    }
    return this.entitiesMap.get(sportId)!.asObservable();
  }

  getEntityById(sportId: string, entityId: string): Observable<EntityModel | undefined> {
    return this.getEntitiesForSport(sportId).pipe(
      map(entities => entities.find(e => e.id === entityId))
    );
  }

  refreshEntity(sportId: string, entityId: string): void {
    const allSports = this.dataService.loadSports();
    const sport = allSports.find(s => s.id === sportId);
    if (!sport) return;

    const freshEntity = sport.entities.find(e => e.id === entityId);
    if (!freshEntity) return;

    const subject = this.entitiesMap.get(sportId);
    if (!subject) return;

    const current = subject.value;
    const index = current.findIndex(e => e.id === entityId);
    if (index === -1) return;

    const updated = [...current];
    updated[index] = freshEntity;
    subject.next(updated);
  }

  private saveEntity(sportId: string, entity: EntityModel): void {
    const subject = this.entitiesMap.get(sportId);
    if (!subject) return;
    const current = subject.value;
    const index = current.findIndex(e => e.id === entity.id);
    const updated = index >= 0
      ? [...current.slice(0, index), entity, ...current.slice(index + 1)]
      : [...current, entity];
    subject.next(updated);
    this.persistToStorage(sportId);
  }

  createEntity(sportId: string, entityData: Omit<EntityModel, 'id' | 'createdAt' | 'updatedAt' | 'onboardedAt'>): EntityModel {
    const now = new Date();
    const newEntity: EntityModel = {
      ...entityData,
      id: this.generateId('gb'),
      createdAt: now,
      updatedAt: now,
      onboardedAt: now,
      organizations: entityData.organizations || [],
    };
    this.saveEntity(sportId, newEntity);
    return newEntity;
  }

  updateEntity(sportId: string, entityId: string, updates: Partial<EntityModel>): EntityModel {
    const subject = this.entitiesMap.get(sportId);
    if (!subject) {
      throw new Error(`Sport with id ${sportId} not found in entity service`);
    }

    const current = subject.value;
    const index = current.findIndex(e => e.id === entityId);
    if (index === -1) {
      throw new Error(`Entity with id ${entityId} not found in sport ${sportId}`);
    }

    const existing = current[index];
    const updated: EntityModel = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
      id: existing.id,
      createdAt: existing.createdAt,
      onboardedAt: updates.onboardedAt ?? existing.onboardedAt,
      organizations: updates.organizations ?? existing.organizations,
    };

    this.saveEntity(sportId, updated);
    return updated;
  }

  deleteEntity(sportId: string, entityId: string): void {
    const subject = this.entitiesMap.get(sportId);
    if (!subject) return;
    const current = subject.value;
    const updated = current.filter(e => e.id !== entityId);
    subject.next(updated);
    this.persistToStorage(sportId);
  }

  private persistToStorage(sportId: string): void {
    const subject = this.entitiesMap.get(sportId);
    if (!subject) return;
    const updatedEntities = subject.value;

    const allSports = this.dataService.loadSports();
    const sport = allSports.find(s => s.id === sportId);
    if (!sport) {
      console.warn(`Sport ${sportId} not found in data service during persistence`);
      return;
    }
    sport.entities = updatedEntities;
    this.dataService.saveSports(allSports);
  }

  private generateId(prefix: string): string {
    const allSports = this.dataService.loadSports();
    const allIds: string[] = [];
    allSports.forEach(sport => {
      sport.entities.forEach(entity => allIds.push(entity.id));
    });
    let max = 0;
    const regex = new RegExp(`^${prefix}-(\\d+)$`);
    allIds.forEach(id => {
      const match = id.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    });
    const next = max + 1;
    return `${prefix}-${String(next).padStart(3, '0')}`;
  }

  getSportIdForEntity(entityId: string): string | undefined {
    const allSports = this.dataService.loadSports();
    for (const sport of allSports) {
      const found = sport.entities.find(e => e.id === entityId);
      if (found) return sport.id;
    }
    return undefined;
  }
}