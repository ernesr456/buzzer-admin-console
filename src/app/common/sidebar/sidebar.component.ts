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
      title: 'Match Management',
      isOpen: true, // Open by default
      items: [
        { label: 'Matches', icon: 'Icons=ic_soccer_ball.svg', isActive: true },
        { label: 'Teams', icon: 'Icons=ic_users.svg' },
        { label: 'Tournaments', icon: 'Icons=ic_trophy.svg' },
        { label: 'Leagues', icon: 'Icons=ic_featured.svg' }
      ]
    },
    {
      title: 'Publishing',
      isOpen: true,
      items: [
        { label: 'Articles', icon: 'Icons=ic_documents.svg' },
        { label: 'Media & Highlights', icon: 'Icons=ic_videos.svg' },
        { label: 'Posts & Updates', icon: 'Icons=ic_posts.svg' }
      ]
    },
    {
      title: 'Finance',
      isOpen: true,
      items: [
        { label: 'Payments', icon: 'Icons=ic_currency.svg' },
        { label: 'Payouts', icon: 'Icons=ic_payments.svg' },
        { label: 'Invoices', icon: 'Icons=ic_order_money.svg' }
      ]
    },
    {
      title: 'System',
      isOpen: true,
      items: [
        { label: 'Settings', icon: 'Icons=ic_settings.svg' },
        { label: 'Audit Logs', icon: 'Icons=ic_report.svg' },
        { label: 'API Keys', icon: 'Icons=ic_locked.svg' }
      ]
    }
  ];
  // Toggle accordion group
  toggleGroup(group: MenuGroup): void {
    group.isOpen = !group.isOpen;
  }

  // Set clicked item as active
  setActive(group: MenuGroup, clickedItem: MenuItem): void {
    // Clear active state from all items
    this.menuGroups.forEach(g => g.items.forEach(item => item.isActive = false));
    // Set active state to clicked item
    clickedItem.isActive = true;
    // close mobile sidebar after navigating
    this.sidebarService.closeMobile();
  }
}
