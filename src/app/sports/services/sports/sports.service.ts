import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, lastValueFrom } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { SportModel } from '../../models/sport.model';
import { environment } from '../../../../environment/environment';
import {AuthService} from '../../../core/services/auth/auth.service'
import { EntityService } from '../../../entities/services/entity.service';
import { OrganizationService } from '../../../organizations/services/organization.service';
import { ParticipantService } from '../../../participants/services/participant.service';

interface Counts {
  entities: number;
  organizations: number;
  participants: number;
}

@Injectable({ providedIn: 'root' })
export class SportsService {
  private apiUrl = environment.apiBaseUrl + '/sports';

  // internal signals
  private _sports = signal<SportModel[]>([]);
  private _counts = signal<Record<string, Counts>>({});

  // Raw data from the API (BehaviorSubjects kept for Observable API compatibility)
  private rawSportsSubject = new BehaviorSubject<SportModel[]>([]);
  sports$ = this.rawSportsSubject.pipe(
    map(sports => sports.map(sport => ({ ...sport })))
  );
  totalSports$ = this.rawSportsSubject.pipe(map(list => list.length));

  // counts cache
  private countsCache = new Map<string, Counts>();
  private countsSubject = new BehaviorSubject<Record<string, Counts>>({});
  counts$ = this.countsSubject.asObservable();

  private sportsMap = new Map<string, BehaviorSubject<SportModel>>();
  sportSubject$ = new BehaviorSubject<SportModel[]>([]);

  // inject dependencies (use inject() per Developer Guide)
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private entityService = inject(EntityService);
  private organizationService = inject(OrganizationService);
  private participantService = inject(ParticipantService);

  // initialize: load sports at service construction
  private _init = (() => {
    // mirror signals into subjects initially
    this._sports.set(this.rawSportsSubject.value);
    this._counts.set(this.countsSubject.value);
    // kick off initial load
    this.loadSports().subscribe();
  })();

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

  updateSport(id: string, updateSport: SportModel): Observable<SportModel> {
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
      emoji: sport.emoji,
      color: sport.color,
      name: sport.name,
      createdAt: new Date(sport.createdAt),
      updatedAt: sport.updatedAt ? new Date(sport.updatedAt) : undefined,
      entities: [],
      counts: sport.counts ? {
        governingBodies: sport.counts.governingBodies ?? 0,
        organisations: sport.counts.organisations ?? 0,
        participants: sport.counts.participants ?? 0,
      } : undefined,
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

  /**
   * Compute counts for a sport and cache the result.
   */
  async computeAndCacheCounts(sportId: string): Promise<Counts> {
    // Return cached if present
    if (this.countsCache.has(sportId)) return this.countsCache.get(sportId)!;

    const counts: Counts = { entities: 0, organizations: 0, participants: 0 };

    try {
      const entitiesResp: any = await lastValueFrom(this.entityService.getEntityBySportId(sportId));
      const entities = Array.isArray(entitiesResp) ? entitiesResp : (entitiesResp ? [entitiesResp] : []);
      counts.entities = entities.length;

      for (const ent of entities) {
        try {
          const orgsResp: any = await lastValueFrom(this.organizationService.getOrganizationByEntityId(ent.id));
          const orgs = Array.isArray(orgsResp) ? orgsResp : (orgsResp ? [orgsResp] : []);
          counts.organizations += orgs.length;

          for (const org of orgs) {
            try {
              const partsResp: any = await lastValueFrom(this.participantService.getParticipantsByOrganizationId(org.id));
              const parts = Array.isArray(partsResp) ? partsResp : (partsResp ? [partsResp] : []);
              counts.participants += parts.length;
            } catch (pErr) {
              console.error('Failed to get participants for org', org.id, pErr);
            }
          }
        } catch (oErr) {
          console.error('Failed to get organizations for entity', ent.id, oErr);
        }
      }
    } catch (e) {
      console.error('Failed to get entities for sport', sportId, e);
    }

    // cache and emit
    this.countsCache.set(sportId, counts);
    const snapshot = this.countsSubject.value;
    this.countsSubject.next({ ...snapshot, [sportId]: counts });
    return counts;
  }

  getCountsForSport$(sportId: string) {
    return this.counts$.pipe(map(m => m[sportId]));
  }

  addFullSports(newSports: SportModel[]): void {
    const current = this.rawSportsSubject.value;
    const merged: SportModel[] = [...current];

    for (const sport of newSports) {
      const newSport: SportModel = {
        id: sport.id,
        name: sport.name,
        emoji: sport.emoji,
        color: sport.color,
        createdAt: sport.createdAt || new Date(),
        updatedAt: sport.updatedAt || new Date(),
        entities: []
      };
      merged.push(newSport);
    }
    this.updateCache(merged);
  }
}