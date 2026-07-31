import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { SportModel } from '../models/sport.model';
import { SportsService } from '../services/sports/sports.service';

export const sportResolver: ResolveFn<SportModel> = (route) => {
  const sportService = inject(SportsService);
  const id = route.paramMap.get('sportId');

  if (!id) {
    return {
      id: 'sports-list',
      name: 'Sports',
      emoji: '',
      color: '',
      organizations: 0,
      participants: 0,
      entities: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as SportModel;
  }

  const sport = sportService.getSportById(id);
  if (!sport) {
    throw new Error(`Sport with id ${id} not found`);
  }
  return sport;
};