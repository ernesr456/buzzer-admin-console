import { Injectable } from '@angular/core';
import { SportModel } from '../../sports/models/sport.model';
import { OrganizationModel } from '../model/organization.model';
import { SEED_DATA } from '../../common/data/seed-data';
import { EntityModel } from '../../entities/model/entity.model';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {

  private readonly STORAGE_KEY = 'sports_catalogue';

  constructor() {
    this.initializeStorage();
  }

  // ---------- Storage Helpers ----------
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

  // ---------- ID Generation ----------
  private generateId(prefix: string): string {
    const data = this.loadData();
    const allIds: string[] = [];
    data.forEach(sport => {
      sport.entities.forEach(entity => {
        entity.organizations.forEach(org => {
          allIds.push(org.id);
        });
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

    return `${prefix}-${String(max + 1).padStart(3, '0')}`;
  }

  // ---------- Read Operations ----------
  getAllOrganizations(): OrganizationModel[] {
    const data = this.loadData();
    const orgs: OrganizationModel[] = [];
    data.forEach(sport => {
      sport.entities.forEach(entity => {
        orgs.push(...entity.organizations);
      });
    });
    return orgs;
  }

  getOrganizationsByEntity(entityId: string): OrganizationModel[] {
    const data = this.loadData();
    for (const sport of data) {
      const entity = sport.entities.find(e => e.id === entityId);
      if (entity) {
        return entity.organizations;
      }
    }
    return [];
  }

  getOrganizationById(orgId: string): OrganizationModel | undefined {
    const data = this.loadData();
    for (const sport of data) {
      for (const entity of sport.entities) {
        const found = entity.organizations.find(o => o.id === orgId);
        if (found) return found;
      }
    }
    return undefined;
  }

  // ---------- Create ----------
  createOrganization(
    entityId: string,
    orgData: Omit<OrganizationModel, 'id' | 'createdAt' | 'updatedAt'>
  ): OrganizationModel {
    const data = this.loadData();

    let targetEntity: EntityModel | undefined;
    for (const sport of data) {
      const entity = sport.entities.find(e => e.id === entityId);
      if (entity) {
        targetEntity = entity;
        break;
      }
    }

    if (!targetEntity) {
      throw new Error(`Entity with id ${entityId} not found`);
    }

    const now = new Date().toISOString();
    const newOrg: OrganizationModel = {
      ...orgData,
      id: this.generateId('org'),
      createdAt: now,
      updatedAt: now,
      participants: orgData.participants || []
    };

    targetEntity.organizations.push(newOrg);
    this.saveData(data);
    return newOrg;
  }

  // ---------- Update ----------
  updateOrganization(
    entityId: string,
    orgId: string,
    updates: Partial<OrganizationModel>
  ): OrganizationModel {
    const data = this.loadData();

    let targetEntity: EntityModel | undefined;
    let orgIndex = -1;

    for (const sport of data) {
      const entity = sport.entities.find(e => e.id === entityId);
      if (entity) {
        const idx = entity.organizations.findIndex(o => o.id === orgId);
        if (idx !== -1) {
          targetEntity = entity;
          orgIndex = idx;
          break;
        }
      }
    }

    if (!targetEntity || orgIndex === -1) {
      throw new Error(`Organization with id ${orgId} not found in entity ${entityId}`);
    }

    const existing = targetEntity.organizations[orgIndex];
    const updated: OrganizationModel = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      id: existing.id,
      createdAt: existing.createdAt,
    };

    targetEntity.organizations[orgIndex] = updated;
    this.saveData(data);
    return updated;
  }

  // ---------- Delete ----------
  deleteOrganization(entityId: string, orgId: string): void {
    const data = this.loadData();

    let targetEntity: EntityModel | undefined;
    let orgIndex = -1;

    for (const sport of data) {
      const entity = sport.entities.find(e => e.id === entityId);
      if (entity) {
        const idx = entity.organizations.findIndex(o => o.id === orgId);
        if (idx !== -1) {
          targetEntity = entity;
          orgIndex = idx;
          break;
        }
      }
    }

    if (!targetEntity || orgIndex === -1) {
      throw new Error(`Organization with id ${orgId} not found in entity ${entityId}`);
    }

    targetEntity.organizations.splice(orgIndex, 1);
    this.saveData(data);
  }
}