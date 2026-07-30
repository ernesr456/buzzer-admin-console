// src/app/organizations/resolvers/organization.resolver.ts

import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { OrganizationModel } from '../../organizations/model/organization.model';
import { OrganizationService } from '../../organizations/services/organization.service';

export const organizationResolver: ResolveFn<OrganizationModel> = (route) => {
  const organizationService = inject(OrganizationService);
  const orgId = route.paramMap.get('orgId');

  if (!orgId) {
    throw new Error('Missing required route parameter: orgId');
  }

  const organization = organizationService.getOrganizationById(orgId);
  if (!organization) {
    throw new Error(`Organization with id ${orgId} not found`);
  }

  return organization;
};