import { Routes } from '@angular/router';
import { MainLayoutComponent } from './common/components/main-layout/main-layout.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './core/guards/auth/auth.guard';
import { SportListComponent } from './sports/components/sport-list/sport-list.component';
import { GoverningBodyDetailComponent } from './sports/components/governing-body-detail/governing-body-detail.component';
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
        children: [
          {
            path: 'governing-body/:gbId',
            component: GoverningBodyDetailComponent,
            title: 'Governing Body Management',
          }
        ]
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