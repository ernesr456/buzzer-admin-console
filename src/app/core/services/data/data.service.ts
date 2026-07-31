import { Injectable } from "@angular/core";
import { SportModel } from "../../../sports/models/sport.model";
import { SEED_DATA } from "../../../common/data/seed-data";
import { EntityModel } from "../../../entities/model/entity.model";
import { OrganizationModel } from "../../../organizations/model/organization.model";

export const SPORTS_STORAGE_KEY = 'sports_catalogue';

@Injectable({ providedIn: 'root' })
export class DataService {
  loadSports(): SportModel[] {
    const raw = localStorage.getItem(SPORTS_STORAGE_KEY);
    if (!raw) {
      const seedCopy = this.cloneDeep(SEED_DATA);
      const converted = this.convertDates(seedCopy) as SportModel[];
      this.saveSports(converted);
      return converted;
    }

    try {
      const parsed = JSON.parse(raw);
      return this.convertDates(parsed) as SportModel[];
    } catch (error) {
      console.error('Failed to parse sports data from localStorage', error);
      const seedCopy = this.cloneDeep(SEED_DATA);
      const converted = this.convertDates(seedCopy) as SportModel[];
      this.saveSports(converted);
      return converted;
    }
  }

  saveSports(sports: SportModel[]): void {
    try {
      localStorage.setItem(SPORTS_STORAGE_KEY, JSON.stringify(sports));
    } catch (error) {
      console.error('Failed to save sports data to localStorage', error);
    }
  }

  resetToSeed(): SportModel[] {
    const seedCopy = this.cloneDeep(SEED_DATA);
    const converted = this.convertDates(seedCopy) as SportModel[];
    this.saveSports(converted);
    return converted;
  }

  getSportById(sportId: string): SportModel | undefined {
    const sports = this.loadSports();
    return sports.find(sport => sport.id === sportId);
  }

  getEntityById(entityId: string): EntityModel | undefined {
    const sports = this.loadSports();
    for (const sport of sports) {
      const found = sport.entities.find(entity => entity.id === entityId);
      if (found) return found;
    }
    return undefined;
  }

  getOrganizationById(orgId: string): OrganizationModel | undefined {
    const sports = this.loadSports();
    for (const sport of sports) {
      for (const entity of sport.entities) {
       const found = entity.organizations?.find(org => org.id === orgId);
        if (found) return found;
      }
    }
    return undefined;
  }

  private convertDates(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertDates(item));
    }

    const result: any = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (
        (key === 'createdAt' || key === 'updatedAt' || key === 'onboardedAt') &&
        typeof value === 'string' &&
        value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      ) {
        result[key] = new Date(value);
      } else if (value && typeof value === 'object') {
        result[key] = this.convertDates(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private cloneDeep<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
  }
}