// app.ts
import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './common/services/theme/theme.service';
import { ToastContainerComponent } from './common/components/custom-toast/toast-container.component';
import { OrganizationService } from './organizations/services/organization.service';
import { DataService } from './core/services/data/data.service'; // or SportDataService
import { EntityService } from './entities/services/entity.service';
import { ParticipantService } from './participants/services.service';
import { SportsService } from './sports/services/sports/sports.service';

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
    private orgService: OrganizationService,
    private dataService: DataService,
    private entityService: EntityService,
    private participantService: ParticipantService,
    private sportsService: SportsService
  ) {}

  ngOnInit(): void {
    const sports = this.dataService.loadSports();
    this.orgService.initialize(sports);
    this.entityService.initialize(sports);
    this.participantService.initialize(sports);
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }
}