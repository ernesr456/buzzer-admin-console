import { Routes } from '@angular/router';
import { MainLayoutComponent } from './common/components/main-layout/main-layout.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './core/guards/auth/auth.guard';
import { SportListComponent } from './sports/components/sport-list/sport-list.component';
import { SportDetailComponent } from './sports/components/sport-detail/sport-detail.component';
import { EntityDetailComponent } from './entities/components/entity-detail/entity-detail.component'
import { sportResolver } from './sports/resolver/sport.resolver';
import { entityResolver } from './entities/resolver/entity.resolver';
import { OrganizationDetailComponent } from './organizations/components/organization-detail/organization-detail.component'
export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    title: 'Sport Management Dashboard',
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
        data: { breadcrumb: 'Sports' }
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
        resolve: {sport: entityResolver}
      },
      {
        path: 'sports/:sportId/:entityId/:orgId',
        component: OrganizationDetailComponent,
        title: 'Organization Management',
        canActivate: [authGuard],
      },
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