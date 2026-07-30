import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { EntityModel } from '../model/entity.model';
import { SportsService } from '../../sports/services/sports/sports.service';

export const entityResolver: ResolveFn<EntityModel> = (route) => {
  const sportService = inject(SportsService);
  const sportId = route.paramMap.get('sportId');
  const gbId = route.paramMap.get('gbId');

  if (!sportId || !gbId) {
    throw new Error('Missing required route parameters: sportId or gbId');
  }

  const sport = sportService.getSportById(sportId);
  if (!sport) {
    throw new Error(`Sport with id ${sportId} not found`);
  }

  const entity = sport.entities.find(e => e.id === gbId);
  if (!entity) {
    throw new Error(`Entity with id ${gbId} not found in sport ${sportId}`);
  }

  return entity;
};