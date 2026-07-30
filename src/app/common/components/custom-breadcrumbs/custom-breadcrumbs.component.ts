import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd, RouterModule } from '@angular/router';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Breadcrumb } from '../models/breadcrumb.model';

@Component({
  selector: 'app-custom-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './custom-breadcrumbs.component.html',
  styleUrls: ['./custom-breadcrumbs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomBreadcrumbsComponent implements OnInit, OnDestroy {
  breadcrumbs: Breadcrumb[] = [];
  private subscription = new Subscription();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateBreadcrumbs();
    this.subscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.updateBreadcrumbs();
        this.cdr.detectChanges();
      });
  }

  private updateBreadcrumbs(): void {
    this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute);
  }

  private buildBreadcrumbs(route: ActivatedRoute): Breadcrumb[] {
    const segments = route.snapshot.url.map(seg => seg.path);
    const currentData = route.snapshot.data;
    const labelMap: Record<string, string> = {
      'sport': 'Sports',
      'governing-body': 'Governing Bodies',
      'organisation': 'Organisations',
      'participant': 'Participants',
    };

    const crumbs: Breadcrumb[] = [];
    let url = '';

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      url += `/${seg}`;

      let label = '';
      // Dynamic label for the last segment (if it has a resolved entity)
      if (i === segments.length - 1) {
        const entity = currentData['sport'] || currentData['governingBody'] || currentData['organisation'] || currentData['participant'];
        if (entity) label = entity.name;
      }
      // Fallback to static map or the segment itself
      if (!label) {
        label = labelMap[seg] || seg;
      }

      crumbs.push({ label, url });
    }

    return crumbs;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}