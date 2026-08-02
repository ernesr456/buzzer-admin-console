import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, tap, throwError } from 'rxjs';
import { ParticipantModel } from '../model/participant.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { environment } from '../../../environment/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ParticipantService {
  private apiUrl = environment.apiBaseUrl + '/participants';
  participantSubject$ = new BehaviorSubject<ParticipantModel[]>([]);

  private authService = inject(AuthService);
  private http = inject(HttpClient);

  addParticipant(organizationId: string, participant: Partial<ParticipantModel>): Observable<ParticipantModel> {
    return this.http.post<ParticipantModel>(`${this.apiUrl}?organizationId=${organizationId}`, participant, { headers: this.authService.getAuthHeaders() }).pipe(
      tap((newParticipant) => {
        const current = this.participantSubject$.getValue();
        this.participantSubject$.next([...current, newParticipant]);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  getParticipantsByOrganizationId(organizationId: string): Observable<ParticipantModel[]> {
    return this.http.get<ParticipantModel[]>(`${this.apiUrl}?organizationId=${organizationId}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap((participants) => this.participantSubject$.next(participants)),
      catchError((err) => {
        if (err.status === 401) {
          this.authService.logout();
        } else {
          this.participantSubject$.next([]);
        }
        return of([]);
      })
    );
  }

  getParticipantById(participantId: string): Observable<ParticipantModel> {
    return this.http.get<ParticipantModel>(`${this.apiUrl}/${participantId}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError((err) => {
        if (err.status === 401) {
          this.authService.logout();
        }
        return throwError(() => err);
      })
    );
  }

  updateParticipant(organizationId: string, id: string, update: Partial<ParticipantModel>): Observable<ParticipantModel> {
    return this.http.patch<ParticipantModel>(`${this.apiUrl}/${id}`, update, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap((modified) => {
        const current = this.participantSubject$.getValue();
        const updated = current.map(p => p.id === id ? modified : p);
        this.participantSubject$.next(updated);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  deleteParticipant(participant: ParticipantModel): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${participant.id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        const current = this.participantSubject$.getValue();
        const filtered = current.filter(p => p.id !== participant.id);
        this.participantSubject$.next(filtered);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }
}