// src/app/entities/resolver/entity.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';
import { OrganizationModel } from '../model/organization.model';
import {OrganizationService} from '../services/organization.service'

export const organizationResolver: ResolveFn<OrganizationModel | undefined> = (
  route: ActivatedRouteSnapshot
): Observable<OrganizationModel | undefined> => {
  const organizationService = inject(OrganizationService);
  const router = inject(Router);
  const orgId = route.paramMap.get('orgId');

  if (!orgId) {
    router.navigate(['/sports']);
    return of(undefined);
  }
  return organizationService.getOrganizationsById(orgId).pipe(
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