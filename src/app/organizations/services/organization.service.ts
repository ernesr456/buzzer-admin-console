import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { OrganizationModel } from '../model/organization.model';
import { SportModel } from '../../sports/models/sport.model';
import { DataService } from '../../core/services/data/data.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { environment } from '../../../environment/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private organizationsMap = new Map<string, BehaviorSubject<OrganizationModel[]>>();
  private apiUrl = environment.apiBaseUrl + '/organisations';
  organizationSubject$ = new BehaviorSubject<OrganizationModel[]>([]);

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private http: HttpClient,
  ) {}


  addOrganization(entityId:string,organization: OrganizationModel): Observable<OrganizationModel> {
    return this.http.post<OrganizationModel>(`${this.apiUrl}?governingBodyId=${entityId}`,organization, { headers: this.authService.getAuthHeaders() }).pipe(
      tap((newOrganization) => {
        const currentorganization = this.organizationSubject$.getValue();
        this.organizationSubject$.next([...currentorganization, newOrganization]);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }
  
  getOrganizationByEntityId(entityId: string): Observable<OrganizationModel[]> {
    return this.http.get<OrganizationModel[]>(`${this.apiUrl}?organisationId=${entityId}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap((entities) => this.organizationSubject$.next(entities)),
      catchError((err) => {
        if (err.status === 401) {
          this.authService.logout();
        } else {
          console.error('Error loading entities', err);
          this.organizationSubject$.next([]);
        }
        return of([]);
      })
    );
  }
  getOrganizationsById(entityId:string,OrganizationId: string): Observable<OrganizationModel[]> {
    return this.http.get<OrganizationModel[]>(`${this.apiUrl}?governingBodyId=${entityId}/${OrganizationId}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap((entities) => this.organizationSubject$.next(entities)),
      catchError((err) => {
        if (err.status === 401) {
          this.authService.logout();
        } else {
          console.error('Error loading entities', err);
          this.organizationSubject$.next([]);
        }
        // Re-throw or return empty array to keep the observable alive
        return of([]);
      })
    );
  }

  updatesOrganization(updateOrganization: OrganizationModel): Observable<OrganizationModel> {
    return this.http.patch<OrganizationModel>(`${this.apiUrl}/${updateOrganization.id}`, updateOrganization, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap((modified) => {
        const current = this.organizationSubject$.getValue();
        const updated = current.map(s => s.id === updateOrganization.id ? modified : s);
        this.organizationSubject$.next(updated);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  deletesOrganization(deleteOrganization: OrganizationModel): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${deleteOrganization.id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        const current = this.organizationSubject$.getValue();
        const filtered = current.filter(s => s.id !== deleteOrganization.id);
        this.organizationSubject$.next(filtered);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }




































  initialize(sports: SportModel[]): void {
    this.organizationsMap.clear();
    for (const sport of sports) {
      for (const entity of sport.entities) {
        this.organizationsMap.set(entity.id, new BehaviorSubject<OrganizationModel[]>(entity.organizations || []));
      }
    }
  }

  getOrganizationsForEntity(entityId: string): Observable<OrganizationModel[]> {
    if (!this.organizationsMap.has(entityId)) {
      this.organizationsMap.set(entityId, new BehaviorSubject<OrganizationModel[]>([]));
    }
    return this.organizationsMap.get(entityId)!.asObservable();
  }

  getOrganizationById(entityId: string, orgId: string): Observable<OrganizationModel | undefined> {
    return this.getOrganizationsForEntity(entityId).pipe(
      map(orgs => orgs.find(o => o.id === orgId))
    );
  }

  refreshOrganization(entityId: string, orgId: string): void {
    const allSports = this.dataService.loadSports();
    for (const sport of allSports) {
      for (const entity of sport.entities) {
        if (entity.id === entityId) {
          const freshOrg = entity.organizations?.find(o => o.id === orgId);

          if (!freshOrg) return;

          const subject = this.organizationsMap.get(entityId);
          if (!subject) return;

          const current = subject.value;
          const index = current.findIndex(o => o.id === orgId);
          if (index === -1) return;

          const updated = [...current];
          updated[index] = freshOrg;
          subject.next(updated);
          return;
        }
      }
    }
  }

  private saveOrganization(entityId: string, organization: OrganizationModel): void {
    const subject = this.organizationsMap.get(entityId);
    if (!subject) return;
    const current = subject.value;
    const index = current.findIndex(o => o.id === organization.id);
    const updated = index >= 0
      ? [...current.slice(0, index), organization, ...current.slice(index + 1)]
      : [...current, organization];
    subject.next(updated);
    this.persistToStorage(entityId);
  }

  createOrganization(entityId: string, orgData: Partial<OrganizationModel>): OrganizationModel {
    const newOrg: OrganizationModel = {
      id: this.generateId(),
      name: orgData.name || '',
      participants: orgData.participants || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      onboardedAt: new Date(),
      ...orgData,
    };
    this.saveOrganization(entityId, newOrg);
    return newOrg;
  }

  updateOrganization(entityId: string, organization: OrganizationModel): void {
    const updatedOrg = {
      ...organization,
      updatedAt: new Date(),
    };
    this.saveOrganization(entityId, updatedOrg);
  }

  deleteOrganization(entityId: string, orgId: string): void {
    const subject = this.organizationsMap.get(entityId);
    if (!subject) return;
    const current = subject.value;
    const updated = current.filter(o => o.id !== orgId);
    subject.next(updated);
    this.persistToStorage(entityId);
  }

  private persistToStorage(entityId: string): void {
    const subject = this.organizationsMap.get(entityId);
    if (!subject) return;
    const updatedOrgs = subject.value;

    const allSports = this.dataService.loadSports();
    for (const sport of allSports) {
      for (const entity of sport.entities) {
        if (entity.id === entityId) {
          entity.organizations = updatedOrgs;
          this.dataService.saveSports(allSports);
          return;
        }
      }
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
}