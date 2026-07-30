import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './common/services/theme/theme.service';
import { ToastContainerComponent } from './common/components/custom-toast/toast-container.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet,ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor(private themeService: ThemeService) {}
    toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }
  protected readonly title = signal('buzzer-admin-console');
}
