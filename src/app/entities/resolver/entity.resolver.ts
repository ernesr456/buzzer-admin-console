// src/app/entities/resolver/entity.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';
import { EntityModel } from '../model/entity.model';
import { SportsService } from '../../sports/services/sports/sports.service';

export const entityResolver: ResolveFn<EntityModel | undefined> = (
  route: ActivatedRouteSnapshot
): Observable<EntityModel | undefined> => {
  const sportsService = inject(SportsService);
  const router = inject(Router);
  const sportId = route.paramMap.get('sportId');
  const entityId = route.paramMap.get('entityId');

  if (!sportId || !entityId) {
    router.navigate(['/sports']);
    return of(undefined);
  }

  return sportsService.getSportById(sportId).pipe(
    take(1),
    map(sport => {
      if (!sport) {
        router.navigate(['/sports']);
        return undefined;
      }
      const entity = sport.entities.find(e => e.id === entityId);
      if (!entity) {
        router.navigate(['/sports', sportId]);
        return undefined;
      }
      return entity;
    }),
    catchError(() => {
      router.navigate(['/sports']);
      return of(undefined);
    })
  );
};