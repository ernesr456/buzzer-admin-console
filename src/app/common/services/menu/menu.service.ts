// src/app/common/services/menu.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, tap, catchError } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MenuGroup } from '../../../common/models/menu.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private authService = inject(AuthService);

  private rawMenuGroups = signal<MenuGroup[]>([]);

  readonly menuGroups = computed(() => {
    const user = this.authService.currentUser();
    const userRole = user?.role ?? null;

    return this.rawMenuGroups()
      .map(group => {
        if (group.roles && !group.roles.includes(userRole ?? '')) {
          return null;
        }
        const filteredItems = group.items.filter(item =>
          !item.roles || item.roles.includes(userRole ?? '')
        );
        return filteredItems.length ? { ...group, items: filteredItems } : null;
      })
      .filter((g): g is MenuGroup => g !== null);
  });

  constructor() {
    this.loadMenus();
  }

  private loadMenus(): void {
    this.fetchMenuConfig().pipe(
      tap(config => this.rawMenuGroups.set(config)),
      catchError(err => {
        console.error('Failed to load menu config, using fallback', err);
        this.rawMenuGroups.set(this.getDefaultMenu());
        return of(null);
      })
    ).subscribe();
  }

  private fetchMenuConfig(): Observable<MenuGroup[]> {
    // Replace with actual HTTP call if needed
    return of(this.getDefaultMenu());
  }

  private getDefaultMenu(): MenuGroup[] {
    return [
      {
        title: 'Sports',
        isOpen: true,
        items: [
          { label: 'Sports Catalogue', icon: 'sports', route: '/sports' },
          { label: 'Governing Bodies', icon: 'groups', route: '/entities' },
          // Only users with role 'admin' can see this item
          { label: 'Organizations', icon: 'business', route: '/organizations', roles: ['admin'] },
          { label: 'Participants', icon: 'people', route: '/participants' },
        ],
      },
      {
        title: 'Teams',
        isOpen: true,
        items: [
          { label: 'Squad', icon: 'group', route: '/squads' },
          { label: 'Staff', icon: 'person', route: '/staffs' },
        ],
      },
    ];
  }

  refreshMenus(): void {
    this.loadMenus();
  }
}