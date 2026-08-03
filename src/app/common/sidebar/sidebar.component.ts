import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';   // ← add RouterLinkActive
import { MenuGroup, MenuItem } from '../../common/models/menu.model';
import { SidebarStateService } from '../services/sidebar/sidebar-state.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { MenuService } from '../services/menu/menu.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],   // ← import RouterLinkActive
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  public sidebarService = inject(SidebarStateService);
  private authService = inject(AuthService);
  private menuService = inject(MenuService);

  // Base menu from service (role‑filtered)
  readonly baseMenuGroups = this.menuService.menuGroups;

  // Local open/close state
  private openGroups = signal<Record<string, boolean>>({});

  // Derived menu with open/closed merged
  readonly menuGroups = computed(() => {
    const groups = this.baseMenuGroups();
    const openMap = this.openGroups();
    return groups.map(group => ({
      ...group,
      isOpen: openMap[group.title] ?? group.isOpen ?? true,
    }));
  });

  // User info
  readonly user = this.authService.currentUser;
  readonly userEmail = computed(() => this.user()?.email ?? '');
  readonly isCollapsed = this.sidebarService.collapsed;
  readonly userInitials = computed(() => {
    const email = this.user()?.email;
    return email ? email.charAt(0).toUpperCase() : '?';
  });

  toggleGroup(group: MenuGroup): void {
    const current = this.openGroups()[group.title] ?? group.isOpen ?? true;
    this.openGroups.update(map => ({
      ...map,
      [group.title]: !current,
    }));
  }

  // Only close mobile sidebar – no manual active state
  onItemClick(): void {
    this.sidebarService.closeMobile();
  }

  signOut(): void {
    this.authService.logout();
  }
}