// sport.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Sport } from '../models/sport.model';
import { SportsService } from '../services/sports/sports.service';

export const sportResolver: ResolveFn<Sport> = (route) => {
  const sportService = inject(SportsService);
  const id = route.paramMap.get('sportId');

  if (!id) {
    return {
      id: 'sports-list',
      name: 'Sports',
      emoji: '',
      color: '',
      organisations: 0,
      participants: 0,
      governingBodies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Sport;
  }

  // Detail route: fetch real sport
  const sport = sportService.getSportById(id);
  if (!sport) {
    throw new Error(`Sport with id ${id} not found`);
  }
  return sport;
};