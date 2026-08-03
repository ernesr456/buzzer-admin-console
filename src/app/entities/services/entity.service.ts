import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { EntityModel } from '../model/entity.model';
import { SportModel } from '../../sports/models/sport.model';
import { environment } from '../../../environment/environment';
import { AuthService } from '../../core/services/auth/auth.service';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class EntityService {
  private entitiesMap = new Map<string, BehaviorSubject<EntityModel[]>>();
  private apiUrl = environment.apiBaseUrl + '/governing-bodies';
  entitySubject$ = new BehaviorSubject<EntityModel[]>([]);
  private rawSportsSubject = new BehaviorSubject<SportModel[]>([]);

  entities$ = this.rawSportsSubject.pipe(
    map(entities =>
      entities.map(entity => ({
        ...entity,
      }))
    )
  );
  
  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {}
  
  addEntity(sportId:string,entity: EntityModel): Observable<EntityModel> {
    return this.http.post<EntityModel>(`${this.apiUrl}?sportId=${sportId}`,entity, { headers: this.authService.getAuthHeaders() }).pipe(
      tap((newEntity) => {
        const currentEntity = this.entitySubject$.getValue();
        this.entitySubject$.next([...currentEntity, newEntity]);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  getEntityBySportId(sportId: string): Observable<EntityModel[]> {
    return this.http.get<EntityModel[]>(`${this.apiUrl}?sportId=${sportId}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap((entities) => this.entitySubject$.next(entities)),
      catchError((err) => {
        if (err.status === 401) {
          this.authService.logout();
        } else {
          console.error('Error loading entities', err);
          this.entitySubject$.next([]);
        }
        // Re-throw or return empty array to keep the observable alive
        return of([]);
      })
    );
  }
  getEntityById(entityId: string): Observable<EntityModel> {
    return this.http.get<EntityModel>(`${this.apiUrl}/${entityId}`, {
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

  updatesEntity(updateEntity: EntityModel): Observable<EntityModel> {
    return this.http.patch<EntityModel>(`${this.apiUrl}/${updateEntity.id}`, updateEntity, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap((modified) => {
        const current = this.entitySubject$.getValue();
        const updated = current.map(s => s.id === updateEntity.id ? modified : s);
        this.entitySubject$.next(updated);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  deletesEntity(deleteEntity: EntityModel): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${deleteEntity.id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        const current = this.entitySubject$.getValue();
        const filtered = current.filter(s => s.id !== deleteEntity.id);
        this.entitySubject$.next(filtered);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }
}