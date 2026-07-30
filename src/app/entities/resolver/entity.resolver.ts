import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { EntityModel } from '../model/entity.model';
import { SportsService } from '../../sports/services/sports/sports.service';

export const entityResolver: ResolveFn<EntityModel> = (route) => {
  const sportService = inject(SportsService);
  const sportId = route.paramMap.get('sportId');
  const entityId = route.paramMap.get('entityId');

  if (!sportId || !entityId) {
    throw new Error('Missing required route parameters: sportId or entityId');
  }

  const sport = sportService.getSportById(sportId);
  if (!sport) {
    throw new Error(`Sport with id ${sportId} not found`);
  }

  const entity = sport.entities.find(e => e.id === entityId);
  if (!entity) {
    throw new Error(`Entity with id ${entityId} not found in sport ${sportId}`);
  }

  return entity;
};