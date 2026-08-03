// organization.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { OrganizationModel } from '../model/organization.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { environment } from '../../../environment/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private apiUrl = environment.apiBaseUrl + '/organisations';
  organizationSubject$ = new BehaviorSubject<OrganizationModel[]>([]);

  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  private normalizeOrganization(org: any): OrganizationModel {
    return {
      ...org,
      counts: org.counts ? {
        participants: org.counts.participants ?? 0,
        squads: org.counts.squads ?? 0,
        staff: org.counts.staff ?? 0,
      } : undefined,
      createdAt: org.createdAt ? new Date(org.createdAt) : new Date(),
      updatedAt: org.updatedAt ? new Date(org.updatedAt) : new Date(),
    };
  }

  addOrganization(entityId: string, organization: OrganizationModel): Observable<OrganizationModel> {
    return this.http.post<OrganizationModel>(`${this.apiUrl}?governingBodyId=${entityId}`, organization, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(org => this.normalizeOrganization(org)),
      tap((newOrg) => {
        const current = this.organizationSubject$.getValue();
        this.organizationSubject$.next([...current, newOrg]);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  getOrganizationByEntityId(entityId: string): Observable<OrganizationModel[]> {
    return this.http.get<OrganizationModel[]>(`${this.apiUrl}?governingBodyId=${entityId}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(orgs => orgs.map(o => this.normalizeOrganization(o))),
      tap((orgs) => this.organizationSubject$.next(orgs)),
      catchError((err) => {
        if (err.status === 401) {
          this.authService.logout();
        } else {
          console.error('Error loading organizations', err);
          this.organizationSubject$.next([]);
        }
        return of([]);
      })
    );
  }

  getOrganizationsById(organizationId: string): Observable<OrganizationModel> {
    return this.http.get<OrganizationModel>(`${this.apiUrl}/${organizationId}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(org => this.normalizeOrganization(org)),
      tap(org => { /* optional */ }),
      catchError((err) => {
        if (err.status === 401) {
          this.authService.logout();
        } else {
          console.error('Error loading organization', err);
        }
        return throwError(() => err);
      })
    );
  }

  updatesOrganization(updateOrganization: OrganizationModel): Observable<OrganizationModel> {
    return this.http.patch<OrganizationModel>(`${this.apiUrl}/${updateOrganization.id}`, updateOrganization, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(org => this.normalizeOrganization(org)),
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
}