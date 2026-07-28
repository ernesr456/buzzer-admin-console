import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarStateService } from '../../services/sidebar-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  public sidebarService = inject(SidebarStateService);
  public mobileSearchOpen = false;

  openMobileSearch(): void {
    this.mobileSearchOpen = true;
  }

  closeMobileSearch(): void {
    this.mobileSearchOpen = false;
  }
}
