import { Injectable } from '@angular/core';
import { AuthService } from '../../core/services/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { UserModel } from '../models/user.model'

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiBaseUrl + '/users';
  userSubject$ = new BehaviorSubject<UserModel[]>([]);
  
  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  getUsers(orgId: string): Observable<UserModel[]> {
    return this.http.get<UserModel[]>(`${this.apiUrl}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap((users) => this.userSubject$.next(users)),
      catchError((err) => {
        if (err.status === 401) {
          this.authService.logout();
        } else {
          console.error('Error loading entities', err);
          this.userSubject$.next([]);
        }
        return of([]);
      })
    );
  }

}
