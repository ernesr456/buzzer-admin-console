import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';
import { SportModel } from '../models/sport.model';
import { SportsService } from '../services/sports/sports.service';

export const sportResolver: ResolveFn<SportModel | undefined> = (
  route: ActivatedRouteSnapshot
): Observable<SportModel | undefined> => {
  const sportService = inject(SportsService);
  const router = inject(Router);
  const id = route.paramMap.get('sportId');

  if (!id) {
    router.navigate(['/sports']);
    return of(undefined);
  }

  return sportService.getSportById(id).pipe(
    take(1),
    map(sport => {
      if (!sport) {
        router.navigate(['/sports']);
        return undefined;
      }
      return sport;
    }),
    catchError(() => {
      router.navigate(['/sports']);
      return of(undefined);
    })
  );
};