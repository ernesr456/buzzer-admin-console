import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { OrganizationModel } from '../model/organization.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { environment } from '../../../environment/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private organizationsMap = new Map<string, BehaviorSubject<OrganizationModel[]>>();
  private apiUrl = environment.apiBaseUrl + '/organisations';
  organizationSubject$ = new BehaviorSubject<OrganizationModel[]>([]);
  
  constructor(
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
    return this.http.get<OrganizationModel[]>(`${this.apiUrl}?governingBodyId=${entityId}`, {
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

  getOrganizationsById(entityId: string, organizationId: string): Observable<OrganizationModel> {
    return this.http.get<OrganizationModel>(`${this.apiUrl}?governingBodyId=${entityId}/${organizationId}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(entity => {
      }),
      catchError((err) => {
        if (err.status === 401) {
          this.authService.logout();
        } else {
          console.error('Error loading entity', err);
        }
        return throwError(() => err);
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
}