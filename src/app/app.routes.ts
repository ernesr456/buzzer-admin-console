import { Routes } from '@angular/router';
import { MainLayoutComponent } from './common/components/main-layout/main-layout.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './core/guards/auth/auth.guard';
import { SportListComponent } from './sports/sport-list/sport-list.component';
import { SportDetailComponent } from './sports/sport-detail/sport-detail.component';
import { EntityDetailComponent } from './entities/entity-detail/entity-detail.component';
import { sportResolver } from './sports/resolver/sport.resolver';
import { entityResolver } from './entities/resolver/entity.resolver';
import { OrganizationDetailComponent } from './organizations/organization-detail/organization-detail.component';
import { organizationResolver } from './organizations/resolver/organization.resolver';
import { EntityListComponent } from './entities/entity-list/entity-list.component'
import { OrganizationListComponent } from './organizations/organization-list/organization-list.component';
import { ParticipantListComponent } from './participants/participant-list/participant-list.component';
import { SquadListComponent } from './squad/squad-list/squad-list.component';
import { StaffListComponent } from './staff/staff-list/staff-list.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'sports',
        pathMatch: 'full',
      },
      {
        path: 'sports',
        component: SportListComponent,
        title: 'Sport Management',
        canActivate: [authGuard],
        data: { breadcrumb: 'Sports' },
      },
      {
        path: 'sports/:sportId',
        component: SportDetailComponent,
        title: 'Sport Management',
        canActivate: [authGuard],
        resolve: { sport: sportResolver },
      },
      {
        path: 'sports/:sportId/:entityId',
        component: EntityDetailComponent,
        title: 'Entity Management',
        canActivate: [authGuard],
        resolve: { entity: entityResolver },
      },
      {
        path: 'sports/:sportId/:entityId/:orgId',
        title: 'Organization Management',
        component: OrganizationDetailComponent,
        resolve: { organization: organizationResolver },
      },
      // {
      //   path: 'entities',
      //   component: EntityListComponent,
      //   title: 'Sport Management',
      //   canActivate: [authGuard],
      //   data: { breadcrumb: 'Entities' },
      // },
      // {
      //   path: 'entities/:sportId/:entityId',
      //   component: EntityDetailComponent,
      //   title: 'Entity Management',
      //   canActivate: [authGuard],
      //   resolve: { entity: entityResolver },
      // },
      // {
      //   path: 'entities/:sportId/:entityId/:orgId',
      //   title: 'Organization Management',
      //   component: OrganizationDetailComponent,
      //   resolve: { organization: organizationResolver },
      // },
      // {
      //   path: 'organizations',
      //   component: OrganizationListComponent,
      //   title: 'Sport Management',
      //   canActivate: [authGuard],
      //   data: { breadcrumb: 'Organizations' },
      // },
      // {
      //   path: 'organizations/:sportId/:entityId/:orgId',
      //   title: 'Organization Management',
      //   component: OrganizationDetailComponent,
      //   resolve: { organization: organizationResolver },
      // },
      // {
      //   path: 'participants',
      //   component: ParticipantListComponent,
      //   title: 'Sport Management',
      //   canActivate: [authGuard],
      //   data: { breadcrumb: 'Participants' },
      // },
      // {
      //   path: 'squads',
      //   component: SquadListComponent,
      //   title: 'Sport Management',
      //   canActivate: [authGuard],
      //   data: { breadcrumb: 'Squads' },
      // },
      // {
      //   path: 'staffs',
      //   component: StaffListComponent,
      //   title: 'Sport Management',
      //   canActivate: [authGuard],
      //   data: { breadcrumb: 'Staffs' },
      // },
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