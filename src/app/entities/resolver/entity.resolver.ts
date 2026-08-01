// src/app/entities/resolver/entity.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';
import { EntityModel } from '../model/entity.model';
import { SportsService } from '../../sports/services/sports/sports.service';
import { EntityService } from '../services/entity.service';

export const entityResolver: ResolveFn<EntityModel | undefined> = (
  route: ActivatedRouteSnapshot
): Observable<EntityModel | undefined> => {
  const entityService = inject(EntityService);
  const router = inject(Router);
  const entityId = route.paramMap.get('entityId');
  if (!entityId) {
    router.navigate(['/sports']);
    return of(undefined);
  }
  return entityService.getEntityById(entityId).pipe(
    take(1),
    map(entity => {
      if (!entity) {
        router.navigate(['/sports']);
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