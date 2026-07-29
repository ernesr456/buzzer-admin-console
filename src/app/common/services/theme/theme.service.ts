// theme.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { OverlayContainer } from '@angular/cdk/overlay';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  darkMode$ = this.darkModeSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,   // <-- inject document
    private overlayContainer: OverlayContainer
  ) {
    if (isPlatformBrowser(this.platformId)) {
      // Read stored preference or fallback to system preference
      const stored = localStorage.getItem('theme');
      let isDark = false;
      if (stored) {
        isDark = stored === 'dark';
      } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      this.setDarkMode(isDark);

      // Listen for system preference changes (only if no manual override)
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.setDarkMode(e.matches);
        }
      });
    } else {
      // On the server, just set a default (light mode)
      this.darkModeSubject.next(false);
    }
  }

  setDarkMode(isDark: boolean): void {
    this.darkModeSubject.next(isDark);

    // Only touch DOM and localStorage in the browser
    if (isPlatformBrowser(this.platformId)) {
      const htmlElement = this.document.documentElement;
      if (isDark) {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }

      // Also ensure the CDK overlay container (mat dialogs, menus, tooltips) gets the same class
      try {
        const containerEl = this.overlayContainer.getContainerElement();
        if (isDark) {
          containerEl.classList.add('dark');
        } else {
          containerEl.classList.remove('dark');
        }
      } catch (e) {
        // overlay container may not be created yet; ignore silently
      }

      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  }

  toggleDarkMode(): void {
    this.setDarkMode(!this.darkModeSubject.value);
  }
}