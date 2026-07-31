// src/app/participants/services/participant.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { ParticipantModel } from './model/participant.model';
import { DataService } from '../core/services/data/data.service';
import { SportModel } from '../sports/models/sport.model';

@Injectable({ providedIn: 'root' })
export class ParticipantService {
  private participantsMap = new Map<string, BehaviorSubject<ParticipantModel[]>>();

  constructor(private dataService: DataService) {}

  initialize(sports: SportModel[]): void {
    this.participantsMap.clear();
    for (const sport of sports) {
      for (const entity of sport.entities) {
        for (const org of entity.organizations) {
          this.participantsMap.set(org.id, new BehaviorSubject<ParticipantModel[]>(org.participants || []));
        }
      }
    }
  }

  getParticipantsForOrganization(orgId: string): Observable<ParticipantModel[]> {
    if (!this.participantsMap.has(orgId)) {
      this.participantsMap.set(orgId, new BehaviorSubject<ParticipantModel[]>([]));
    }
    return this.participantsMap.get(orgId)!.asObservable();
  }

  getParticipantById(orgId: string, participantId: string): Observable<ParticipantModel | undefined> {
    return this.getParticipantsForOrganization(orgId).pipe(
      map(participants => participants.find(p => p.id === participantId))
    );
  }

  private saveParticipant(orgId: string, participant: ParticipantModel): void {
    const subject = this.participantsMap.get(orgId);
    if (!subject) return;
    const current = subject.value;
    const index = current.findIndex(p => p.id === participant.id);
    const updated = index >= 0
      ? [...current.slice(0, index), participant, ...current.slice(index + 1)]
      : [...current, participant];
    subject.next(updated);
    this.persistToStorage(orgId);
  }

  createParticipant(orgId: string, data: { name: string; logo?: string }): ParticipantModel {
    const newParticipant: ParticipantModel = {
      id: this.generateId('part'),
      name: data.name,
      logo: data.logo,
    };
    this.saveParticipant(orgId, newParticipant);
    return newParticipant;
  }

  updateParticipant(orgId: string, participantId: string, updates: Partial<ParticipantModel>): ParticipantModel {
    const subject = this.participantsMap.get(orgId);
    if (!subject) throw new Error(`Organization ${orgId} not found`);
    const current = subject.value;
    const index = current.findIndex(p => p.id === participantId);
    if (index === -1) throw new Error(`Participant ${participantId} not found`);
    const existing = current[index];
    const updated: ParticipantModel = { ...existing, ...updates };
    this.saveParticipant(orgId, updated);
    return updated;
  }

  deleteParticipant(orgId: string, participantId: string): void {
    const subject = this.participantsMap.get(orgId);
    if (!subject) return;
    const current = subject.value;
    const updated = current.filter(p => p.id !== participantId);
    subject.next(updated);
    this.persistToStorage(orgId);
  }

  private persistToStorage(orgId: string): void {
    const subject = this.participantsMap.get(orgId);
    if (!subject) return;
    const updatedParticipants = subject.value;

    const allSports = this.dataService.loadSports();
    for (const sport of allSports) {
      for (const entity of sport.entities) {
        const org = entity.organizations.find(o => o.id === orgId);
        if (org) {
          org.participants = updatedParticipants;
          this.dataService.saveSports(allSports);
          return;
        }
      }
    }
  }

  private generateId(prefix: string): string {
    const allSports = this.dataService.loadSports();
    const allIds: string[] = [];
    for (const sport of allSports) {
      for (const entity of sport.entities) {
        for (const org of entity.organizations) {
          for (const p of org.participants) {
            allIds.push(p.id);
          }
        }
      }
    }
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

  getOrganizationIdForParticipant(participantId: string): string | undefined {
    const allSports = this.dataService.loadSports();
    for (const sport of allSports) {
      for (const entity of sport.entities) {
        for (const org of entity.organizations) {
          const found = org.participants.find(p => p.id === participantId);
          if (found) return org.id;
        }
      }
    }
    return undefined;
  }
}