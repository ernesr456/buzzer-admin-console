import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environment/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private apiUrl = environment.apiBaseUrl + '/uploads/image';

  constructor(private authService: AuthService, private http: HttpClient) {}
  uploadImage(
    file: File | Blob,
    additionalData?: Record<string, any>,
    fieldName: string = 'file'
  ): Observable<any> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.authService.getToken()}`
    );

    return this.http.post(this.apiUrl, formData, { headers }).pipe(
      catchError((err) => {
        console.error('Upload error:', err);
        const message = err.error?.message || err.message || 'Server error';
        return throwError(() => new Error(message));
      })
    );
  }
}