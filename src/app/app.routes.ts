import { Routes } from '@angular/router';
import { MainLayoutComponent } from './common/components/main-layout/main-layout.component';
import { MatchListComponent } from './matches/match-list/match-list.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    title: 'Sport Management Dashboard',
    children: [
      {
        path: '',
        redirectTo: 'matches',
        pathMatch: 'full',
      },
      {
        path: 'matches',
        component: MatchListComponent,
        title: 'Matches | Sport Management',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];