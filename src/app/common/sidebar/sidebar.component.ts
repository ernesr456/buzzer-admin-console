import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SidebarStateService } from '../services/sidebar-state.service';

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
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  public sidebarService = inject(SidebarStateService);

  menuGroups: MenuGroup[] = [
    {
      title: 'Competitions',
      isOpen: true,
      items: [
        { label: 'Games', icon: 'Icons=ic_soccer_ball.svg', isActive: true },
        { label: 'Tournaments', icon: 'Icons=ic_trophy.svg' },
        { label: 'Scheduling', icon: 'Icons=ic_date.svg' },
      ],
    },
    {
      title: 'Teams',
      isOpen: true,
      items: [
        { label: 'Clubs', icon: 'Icons=ic_follow_user.svg' },
        { label: 'Athletes', icon: 'Icons=ic_trending.svg' },
        { label: 'Squad', icon: 'Icons=ic_users.svg' },
        { label: 'Staff', icon: 'Icons=ic_profile.svg' },
      ],
    },
    {
      title: 'Media',
      isOpen: true,
      items: [
        { label: 'Events', icon: 'Icons=ic_date.svg' },
        { label: 'Clips', icon: 'Icons=ic_video.svg' },
      ],
    },
    {
      title: 'Finance',
      isOpen: true,
      items: [
        { label: 'Payments', icon: 'Icons=ic_currency.svg' },
        { label: 'Payment Settings', icon: 'Icons=ic_settings.svg' },
      ],
    },
    {
      title: 'System',
      isOpen: true,
      items: [
        { label: 'Users', icon: 'Icons=ic_users.svg' },
        { label: 'Configurations', icon: 'Icons=ic_settings.svg' },
        { label: 'Requests', icon: 'Icons=ic_add_clear.svg' },
        { label: 'History', icon: 'Icons=ic_history.svg' },
        { label: 'Sessions', icon: 'Icons=ic_login.svg' },
        { label: 'OAuth', icon: 'Icons=ic_locked.svg' },
        { label: 'Translations', icon: 'Icons=ic_language.svg' },
        { label: 'Feature Access', icon: 'Icons=ic_verification.svg' },
        { label: 'Organizations', icon: 'Icons=ic_home.svg' },
      ],
    },
  ];

  toggleGroup(group: MenuGroup): void {
    group.isOpen = !group.isOpen;
  }

  setActive(group: MenuGroup, clickedItem: MenuItem): void {
    this.menuGroups.forEach(g => g.items.forEach(item => item.isActive = false));
    clickedItem.isActive = true;
    this.sidebarService.closeMobile();
  }
}