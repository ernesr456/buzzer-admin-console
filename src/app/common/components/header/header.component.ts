import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { Title } from '@angular/platform-browser';
import { Router,NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, OnDestroy {
  private titleService = inject(Title);
  private router = inject(Router);
  private routerSubscription?: Subscription;
  public sidebarService = inject(SidebarStateService);
public mobileSearchOpen = signal(false);

  ngOnInit(): void {
    this.updateTitle();

    this.routerSubscription = this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.updateTitle();
      });
  }

  pageTitle = signal('Sport Management');

  openMobileSearch(): void {
    this.mobileSearchOpen.set(true);
  }

  closeMobileSearch(): void {
    this.mobileSearchOpen.set(false);
  }

    ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private updateTitle(): void {
    const currentTitle = this.titleService.getTitle();
    this.pageTitle.set(currentTitle || 'Sport Management');
  }
}
