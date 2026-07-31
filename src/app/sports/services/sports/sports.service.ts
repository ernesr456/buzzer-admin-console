import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { SportModel } from '../../models/sport.model';
import { environment } from '../../../../environment/environment';
import {AuthService} from '../../../core/services/auth/auth.service'
@Injectable({ providedIn: 'root' })
export class SportsService {
  private apiUrl = environment.apiBaseUrl + '/sports';

  // Raw data from the API
  private rawSportsSubject = new BehaviorSubject<SportModel[]>([]);

  // Public observable (entities always empty)
  sports$ = this.rawSportsSubject.pipe(
    map(sports =>
      sports.map(sport => ({
        ...sport,
        entities: [] // API does not provide entities
      }))
    )
  );

  

  totalSports$ = this.rawSportsSubject.pipe(map(list => list.length));
  totalEntities$ = this.rawSportsSubject.pipe(map(() => 0));
  totalOrganisations$ = this.rawSportsSubject.pipe(map(() => 0));
  totalParticipants$ = this.rawSportsSubject.pipe(map(() => 0));

  private sportsMap = new Map<string, BehaviorSubject<SportModel>>();
  sportSubject$ = new BehaviorSubject<SportModel[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadSports().subscribe();
  }

  addSport(sport: SportModel): Observable<SportModel> {
    return this.http.post<SportModel>(this.apiUrl, sport, { headers: this.authService.getAuthHeaders() }).pipe(
      tap((newSport) => {
        const currentSport = this.sportSubject$.getValue();
        this.sportSubject$.next([...currentSport, newSport]);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

 getSport(): void {
    this.http.get<SportModel[]>(this.apiUrl, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (sports) => this.sportSubject$.next(sports),
      error: (err) => {
        if (err.status === 401) {
          this.authService.logout();
        } else {
          console.error('Error loading sports', err);
          this.sportSubject$.next([]);
        }
      }
    });
  }

  updatesSport(id: string, updateSport: SportModel): Observable<SportModel> {
    return this.http.patch<SportModel>(`${this.apiUrl}/${id}`, updateSport, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap((modified) => {
        const current = this.sportSubject$.getValue();
        const updated = current.map(s => s.id === id ? modified : s);
        this.sportSubject$.next(updated);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  deletesSport(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        const current = this.sportSubject$.getValue();
        const filtered = current.filter(s => s.id !== id);
        this.sportSubject$.next(filtered);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  loadSports(): Observable<SportModel[]> {
    return this.http
      .get<SportModel[]>(this.apiUrl)
      .pipe(
        map(sports => sports.map(s => this.normalizeSport(s))),
        tap(sports => this.updateCache(sports)),
        catchError(err => {
          console.error('Failed to load sports', err);
          this.updateCache([]);
          return of([]);
        })
      );
  }

  private normalizeSport(sport: any): SportModel {
    return {
      id: sport.id,
      name: sport.name,
      createdAt: new Date(sport.createdAt),
      updatedAt: sport.updatedAt ? new Date(sport.updatedAt) : undefined,
      entities: []
    };
  }

  private updateCache(sports: SportModel[]): void {
    this.rawSportsSubject.next(sports);
    this.sportsMap.clear();
    for (const sport of sports) {
      this.sportsMap.set(sport.id+"", new BehaviorSubject<SportModel>(sport));
    }
  }

  getSportById(id: string): Observable<SportModel | undefined> {
    if (this.sportsMap.has(id)) {
      return this.sportsMap.get(id)!.asObservable();
    }

    return this.http.get<SportModel>(`${this.apiUrl}/${id}`).pipe(
      map(sport => this.normalizeSport(sport)),
      tap(sport => {
        const current = this.rawSportsSubject.value;
        const existing = current.find(s => s.id+"" === id);
        if (existing) {
          const updated = current.map(s => (s.id+"" === id ? sport : s));
          this.updateCache(updated);
        } else {
          this.updateCache([...current, sport]);
        }
      }),
      catchError(() => of(undefined))
    );
  }

  // Accepts an object with an optional name (only name is sent to API)
  updateSport(id: string, updates: { name?: string }): void {
    const payload: any = {};
    if (updates.name) payload.name = updates.name;

    // If no name change, nothing to do
    if (!payload.name) {
      return;
    }

    this.http
      .patch<SportModel>(`${this.apiUrl}/${id}`, payload)
      .pipe(map(updated => this.normalizeSport(updated)))
      .subscribe(updatedSport => {
        const current = this.rawSportsSubject.value;
        const index = current.findIndex(s => s.id+"" === id);
        if (index !== -1) {
          updatedSport.entities = [];
          const updatedList = [...current];
          updatedList[index] = updatedSport;
          this.updateCache(updatedList);
        }
      });
  }

  deleteSport(id: string): void {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
      const current = this.rawSportsSubject.value;
      const filtered = current.filter(s => s.id+"" !== id);
      this.updateCache(filtered);
    });
  }

  resetToSeed(): void {
    this.loadSports().subscribe();
  }

  // Bulk import – only name is used; emoji/color are ignored
  addFullSports(newSports: SportModel[]): void {
    const current = this.rawSportsSubject.value;
    const merged: SportModel[] = [...current];

    for (const sport of newSports) {
      const newSport: SportModel = {
        id: sport.id,
        name: sport.name,
        createdAt: sport.createdAt || new Date(),
        updatedAt: sport.updatedAt || new Date(),
        entities: []
      };
      merged.push(newSport);
    }
    this.updateCache(merged);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}