import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SidebarStateService } from '../services/sidebar-state.service';
import { AuthService } from '../../core/services/auth/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  isActive?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  public sidebarService = inject(SidebarStateService);
  private authService = inject(AuthService);
  
  readonly user = this.authService.currentUser;
  readonly userEmail = computed(() => this.user()?.email ?? '');
  readonly isCollapsed = this.sidebarService.collapsed;

  menuGroups: MenuGroup[] = [
    {
      title: 'Sports',
      isOpen: true,
      items: [
        { label: 'Sports Catalogue', icon: 'sports', isActive: true },
        { label: 'Governing Bodies', icon: 'groups' },
        { label: 'Organisations', icon: 'business' },
        { label: 'Participants', icon: 'people' },
      ],
    },
    {
      title: 'Competitions',
      isOpen: true,
      items: [
        { label: 'Games', icon: 'sports_soccer' },
        { label: 'Tournaments', icon: 'emoji_events' },
        { label: 'Scheduling', icon: 'event' },
      ],
    },
    {
      title: 'Teams',
      isOpen: true,
      items: [
        { label: 'Clubs', icon: 'person_add' },
        { label: 'Athletes', icon: 'trending_up' },
        { label: 'Squad', icon: 'group' },
        { label: 'Staff', icon: 'person' },
      ],
    },
    {
      title: 'Media',
      isOpen: true,
      items: [
        { label: 'Events', icon: 'event' },
        { label: 'Clips', icon: 'videocam' },
      ],
    },
    {
      title: 'Finance',
      isOpen: true,
      items: [
        { label: 'Payments', icon: 'payments' },
        { label: 'Payment Settings', icon: 'settings' },
      ],
    },
    {
      title: 'System',
      isOpen: true,
      items: [
        { label: 'Users', icon: 'group' },
        { label: 'Configurations', icon: 'settings' },
        { label: 'Requests', icon: 'clear' },
        { label: 'History', icon: 'history' },
        { label: 'Sessions', icon: 'login' },
        { label: 'OAuth', icon: 'lock' },
        { label: 'Translations', icon: 'language' },
        { label: 'Feature Access', icon: 'verified' },
      ],
    },
  ];

  readonly userInitials = computed(() => {
    const email = this.user()?.email;
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  });

  toggleGroup(group: MenuGroup): void {
    group.isOpen = !group.isOpen;
  }

  setActive(group: MenuGroup, clickedItem: MenuItem): void {
    this.menuGroups.forEach(g => g.items.forEach(item => item.isActive = false));
    clickedItem.isActive = true;
    this.sidebarService.closeMobile();
  }

  signOut(): void {
    this.authService.logout();
  }
}