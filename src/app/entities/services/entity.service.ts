import { Injectable } from '@angular/core';
import { SportModel } from '../../sports/models/sport.model';
import { OrganizationModel } from '../../organizations/model/organization.model';
import { SEED_DATA } from '../../common/data/seed-data';
import { EntityModel } from '../model/entity.model';

@Injectable({
  providedIn: 'root'
})
export class EntityService {

  private readonly STORAGE_KEY = 'sports_catalogue';

  constructor() {
    this.initializeStorage();
  }

  private loadData(): SportModel[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as SportModel[];
      } catch {
        return this.seedData();
      }
    }
    return this.seedData();
  }

  private saveData(data: SportModel[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private initializeStorage(): void {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      this.saveData(SEED_DATA);
    }
  }

  private seedData(): SportModel[] {
    return JSON.parse(JSON.stringify(SEED_DATA));
  }

  private generateId(prefix: string): string {
    const data = this.loadData();
    const allIds: string[] = [];
    data.forEach(sport => {
      sport.entities.forEach(entity => {
        allIds.push(entity.id);
      });
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

  getAllEntities(): EntityModel[] {
    const data = this.loadData();
    const entities: EntityModel[] = [];
    data.forEach(sport => {
      entities.push(...sport.entities);
    });
    return entities;
  }

  getEntitiesBySport(sportId: string): EntityModel[] {
    const data = this.loadData();
    const sport = data.find(s => s.id === sportId);
    return sport ? sport.entities : [];
  }

  getEntityById(entityId: string): EntityModel | undefined {
    const data = this.loadData();
    for (const sport of data) {
      const found = sport.entities.find(e => e.id === entityId);
      if (found) return found;
    }
    return undefined;
  }

  createEntity(sportId: string, entityData: Omit<EntityModel, 'id' | 'createdAt' | 'updatedAt'>): EntityModel {
    const data = this.loadData();
    const sport = data.find(s => s.id === sportId);
    if (!sport) {
      throw new Error(`Sport with id ${sportId} not found`);
    }

    const now = new Date().toISOString();
    const newEntity: EntityModel = {
      ...entityData,
      id: this.generateId('gb'),
      createdAt: now,
      updatedAt: now,
      organizations: entityData.organizations || []
    };

    sport.entities.push(newEntity);
    this.saveData(data);
    return newEntity;
  }

  updateEntity(sportId: string, entityId: string, updates: Partial<EntityModel>): EntityModel {
    const data = this.loadData();
    const sport = data.find(s => s.id === sportId);
    if (!sport) {
      throw new Error(`Sport with id ${sportId} not found`);
    }

    const index = sport.entities.findIndex(e => e.id === entityId);
    if (index === -1) {
      throw new Error(`Entity with id ${entityId} not found in sport ${sportId}`);
    }

    const existing = sport.entities[index];
    const updated: EntityModel = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      id: existing.id,
      createdAt: existing.createdAt,
    };

    sport.entities[index] = updated;
    this.saveData(data);
    return updated;
  }

  deleteEntity(sportId: string, entityId: string): void {
    const data = this.loadData();
    const sport = data.find(s => s.id === sportId);
    if (!sport) {
      throw new Error(`Sport with id ${sportId} not found`);
    }

    const index = sport.entities.findIndex(e => e.id === entityId);
    if (index === -1) {
      throw new Error(`Entity with id ${entityId} not found in sport ${sportId}`);
    }

    sport.entities.splice(index, 1);
    this.saveData(data);
  }
}