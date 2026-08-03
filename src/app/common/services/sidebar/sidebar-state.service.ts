// src/app/common/services/sidebar-state.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarStateService {
  // Desktop collapsed state (true = icon-only sidebar, false = expanded)
  collapsed = signal(false);

  // Mobile overlay open state (true = sidebar visible on mobile)
  mobileOpen = signal(false);

  /**
   * Toggle the desktop collapsed state
   */
  toggleCollapsed(): void {
    this.collapsed.update((c) => !c);
  }

  /**
   * Toggle the mobile sidebar open/closed
   */
  toggleMobile(): void {
    this.mobileOpen.update((o) => !o);
  }

  /**
   * Close the mobile sidebar (e.g., when clicking the backdrop)
   */
  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}