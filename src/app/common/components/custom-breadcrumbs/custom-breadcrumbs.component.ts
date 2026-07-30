// custom-breadcrumbs.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Breadcrumb } from '../models/breadcrumb.model';
@Component({
  selector: 'app-custom-breadcrumbs',
  templateUrl: './custom-breadcrumbs.component.html',
  styleUrls: ['./custom-breadcrumbs.component.scss'],
})
export class CustomBreadcrumbsComponent implements OnInit, OnDestroy {
  breadcrumbs: Breadcrumb[] = [];
  private subscription = new Subscription;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.subscription = this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
      });
  }

  private buildBreadcrumbs(route: ActivatedRoute): Breadcrumb[] {
    const breadcrumbs: Breadcrumb[] = [];
    let url = '';

    for (const child of route.pathFromRoot) {
      // Build the URL segment by segment
      const routeUrl = child.snapshot.url.map((segment) => segment.path).join('/');
      if (routeUrl) {
        url += `/${routeUrl}`;
      }

      // 1️⃣ Try to get a dynamic label from resolved data (e.g., sport.name)
      const resolvedData = child.snapshot.data;
      let label = '';

      // 👇 Add as many entity types as your app uses
      if (resolvedData['sport']) {
        label = resolvedData['sport'].name;
      } else if (resolvedData['governingBody']) {
        label = resolvedData['governingBody'].name;
      } else if (resolvedData['organisation']) {
        label = resolvedData['organisation'].name;
      } else if (resolvedData['participant']) {
        label = resolvedData['participant'].name;
      } else if (resolvedData['breadcrumb']) {
        // 2️⃣ Fallback to static breadcrumb label from route data
        label = resolvedData['breadcrumb'];
      }

      // 3️⃣ Last resort: use the first URL param value (e.g., '123')
      if (!label) {
        const params = child.snapshot.params;
        const keys = Object.keys(params);
        if (keys.length > 0) {
          label = params[keys[0]];
        }
      }

      if (label) {
        breadcrumbs.push({ label, url });
      }
    }

    return breadcrumbs;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}