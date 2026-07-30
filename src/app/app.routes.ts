import { Routes } from '@angular/router';
import { MainLayoutComponent } from './common/components/main-layout/main-layout.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './core/guards/auth/auth.guard';
import { SportListComponent } from './sports/components/sport-list/sport-list.component';
import { GoverningBodyDetailComponent } from './sports/components/governing-body-detail/governing-body-detail.component';
import { OrganizationListComponent } from './sports/components/organization-list/organization-list.component';
import { SportDetailComponent } from './sports/components/sport-detail/sport-detail.component';
import { ParticipantListComponent } from './sports/components/participant-list/participant-list.component';
export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    title: 'Sport Management Dashboard',
    children: [
      {
        path: '',
        redirectTo: 'sport',
        pathMatch: 'full',
      },
      {
        path: 'sport',
        component: SportListComponent,
        title: 'Sport Management',
        canActivate: [authGuard],
      },
      {
        path: 'sport/:sportId',
        component: SportDetailComponent,
        title: 'Sport Management',
        canActivate: [authGuard],
      },
      {
        path: 'sport/:sportId/governing-body/:gbId',
        component: GoverningBodyDetailComponent,
        title: 'Governing Body Management',
        canActivate: [authGuard],
      },
      {
        path: 'sport/:sportId/governing-body/:gbId/organization/:orgId',
        component: OrganizationListComponent,
        title: 'Organization Management',
        canActivate: [authGuard],
      },
      {
        path: 'sport/:sportId/governing-body/:gbId/organisation/:orgId/participant/:participantId',
        component: ParticipantListComponent,
        title: 'Participants Management',
        canActivate: [authGuard],
      }
    ],
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Buzzer Admin Console | Login',
  },
  {
    path: 'register',
    component: RegisterComponent,
    title: 'Buzzer Admin Console | Register',
  },
  { path: '**', redirectTo: '' },
];