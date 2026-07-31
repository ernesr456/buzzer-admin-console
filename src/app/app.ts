// app.ts
import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './common/services/theme/theme.service';
import { ToastContainerComponent } from './common/components/custom-toast/toast-container.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  protected readonly title = signal('buzzer-admin-console');

  constructor(
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }
}