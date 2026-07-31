// src/app/organizations/resolvers/organization.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { OrganizationModel } from '../model/organization.model';
import { OrganizationService } from '../services/organization.service';

export const organizationResolver: ResolveFn<OrganizationModel | undefined> = (
  route: ActivatedRouteSnapshot
): Observable<OrganizationModel | undefined> => {
  const organizationService = inject(OrganizationService);
  const entityId = route.paramMap.get('entityId');
  const orgId = route.paramMap.get('orgId');
  if (!entityId || !orgId) {
    return new Observable(subscriber => subscriber.next(undefined));
  }
  return organizationService.getOrganizationById(entityId, orgId);
};