import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { StaffModel } from '../mode/staff.model';
import { BehaviorSubject, catchError, Observable, of, tap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private orgApiUrl = environment.apiBaseUrl + '/organisations';
  private staffApiUrl = environment.apiBaseUrl + '/staff';
  staffSubject$ = new BehaviorSubject<StaffModel[]>([]);

  private authService = inject(AuthService);
  private http = inject(HttpClient);

  addStaff(orgId: string, staff: StaffModel): Observable<StaffModel> {
    staff.organisationId = orgId;
    return this.http.post<StaffModel>(`${this.orgApiUrl}/${orgId}/staff`, staff, { headers: this.authService.getAuthHeaders() }).pipe(
      tap((newStaff) => {
        const currentStaff = this.staffSubject$.getValue();
        this.staffSubject$.next([...currentStaff, newStaff]);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  getStaffByOrgId(orgId: string): Observable<StaffModel[]> {
    return this.http.get<StaffModel[]>(`${this.orgApiUrl}/${orgId}/staff`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap((staffs) => this.staffSubject$.next(staffs)),
      catchError((err) => {
        if (err.status === 401) {
          this.authService.logout();
        } else {
          console.error('Error loading staff', err);
          this.staffSubject$.next([]);
        }
        return of([]);
      })
    );
  }

  getStaffById(staffId: string, organizationId: string): Observable<StaffModel> {
    return this.http.get<StaffModel>(`${this.staffApiUrl}?governingBodyId=${staffId}/${organizationId}`, {
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

  updatesStaff(updateStaff: StaffModel): Observable<StaffModel> {
    return this.http.patch<StaffModel>(`${this.staffApiUrl}/${updateStaff.id}`, updateStaff, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap((modified) => {
        const current = this.staffSubject$.getValue();
        const updated = current.map(s => s.id === updateStaff.id ? modified : s);
        this.staffSubject$.next(updated);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }

  deletesStaff(deleteStaff: StaffModel): Observable<void> {
    return this.http.delete<void>(`${this.staffApiUrl}/${deleteStaff.id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        const current = this.staffSubject$.getValue();
        const filtered = current.filter(s => s.id !== deleteStaff.id);
        this.staffSubject$.next(filtered);
      }),
      catchError(this.authService.handleError.bind(this.authService))
    );
  }
}