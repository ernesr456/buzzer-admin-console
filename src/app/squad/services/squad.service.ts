import { Injectable } from '@angular/core';
import { AuthService } from '../../core/services/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { SquadModel } from '../models/squad.model'
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class SquadService {
  private orgApiUrl = environment.apiBaseUrl + '/organisations';
  private squadApiUrl = environment.apiBaseUrl + '/squad';
  squadSubject$ = new BehaviorSubject<SquadModel[]>([]);
  
  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  addSquad(orgId:string,squad: SquadModel): Observable<SquadModel> {
    return this.http.post<SquadModel>(`${this.orgApiUrl}/${orgId}/squad`,squad, { headers: this.authService.getAuthHeaders() }).pipe(
      tap((newSquad) => {
        const currentSquad = this.squadSubject$.getValue();
        this.squadSubject$.next([...currentSquad, newSquad]);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }
  
  getSquadByOrgId(orgId: string): Observable<SquadModel[]> {
    return this.http.get<SquadModel[]>(`${this.orgApiUrl}/${orgId}/squad`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap((squads) => this.squadSubject$.next(squads)),
      catchError((err) => {
        if (err.status === 401) {
          this.authService.logout();
        } else {
          console.error('Error loading entities', err);
          this.squadSubject$.next([]);
        }
        return of([]);
      })
    );
  }

  updatesSquad(updateSquad: SquadModel): Observable<SquadModel> {
    console.log(updateSquad);
    return this.http.patch<SquadModel>(`${this.squadApiUrl}/${updateSquad.id}`, updateSquad, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap((modified) => {
        const current = this.squadSubject$.getValue();
        const updated = current.map(s => s.id === updateSquad.id ? modified : s);
        this.squadSubject$.next(updated);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  deletesSquad(deleteSquad: SquadModel): Observable<void> {
    return this.http.delete<void>(`${this.squadApiUrl}/${deleteSquad.id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        const current = this.squadSubject$.getValue();
        const filtered = current.filter(s => s.id !== deleteSquad.id);
        this.squadSubject$.next(filtered);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }
}
