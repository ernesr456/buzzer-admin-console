import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd, RouterModule } from '@angular/router';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Breadcrumb } from '../models/breadcrumb.model';
import { SportsService } from '../../../sports/services/sports/sports.service';
import { EntityService } from '../../../entities/services/entity.service';
import { OrganizationService } from '../../../organizations/services/organization.service';

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
    private sportsService: SportsService,
    private entityService: EntityService,
    private organizationService: OrganizationService,
    private cdr: ChangeDetectorRef,
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
      });
  }

  private updateBreadcrumbs(): void {
    this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute);
    this.enhanceBreadcrumbs(this.breadcrumbs);
  }

  /**
   * Enhance breadcrumbs by replacing raw id segments with resolved names.
   * Fetches missing sport names when necessary.
   */
  private enhanceBreadcrumbs(crumbs: Breadcrumb[]): void {
    const uuidRe = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    for (let i = 0; i < crumbs.length; i++) {
      const crumb = crumbs[i];
      // If label already looks human (not a UUID), skip
      if (!uuidRe.test(crumb.label)) continue;

      const parts = crumb.url.split('/').filter(Boolean);
      // parts: [ 'sports', '<sportId>', '<entityId>', '<orgId>' ]

      // Sport level: /sports/:sportId
      if (parts.length === 2) {
        const sportId = parts[1];
        this.sportsService.getSportById(sportId).subscribe(s => {
          if (s && s.name) {
            crumb.label = s.name;
            this.cdr.markForCheck();
          }
        });
        continue;
      }

      // Entity level: /sports/:sportId/:entityId
      if (parts.length === 3) {
        const sportId = parts[1];
        const entityId = parts[2];
        this.entityService.getEntityById(sportId, entityId).subscribe(ent => {
          if (ent && ent.name) {
            crumb.label = ent.name;
            this.cdr.markForCheck();
          }
        });
        continue;
      }

      // Organization level: /sports/:sportId/:entityId/:orgId
      if (parts.length === 4) {
        const entityId = parts[2];
        const orgId = parts[3];
        this.organizationService.getOrganizationsById(entityId, orgId).subscribe(org => {
          if (org && org.name) {
            crumb.label = org.name;
            this.cdr.markForCheck();
          }
        });
        continue;
      }
    }
  }

  private buildBreadcrumbs(route: ActivatedRoute): Breadcrumb[] {
    const crumbs: Breadcrumb[] = [];
    let url = '';

    // Collect resolved entities (id -> name) from the entire route snapshot tree
    const resolvedNames: Record<string, string> = {};
    const collect = (snap: any) => {
      if (!snap) return;
      const data = snap.data || {};
      Object.keys(data).forEach(key => {
        const val = data[key];
        if (val && typeof val === 'object' && 'id' in val && 'name' in val) {
          resolvedNames[val.id] = val.name;
        }
      });
      (snap.children || []).forEach((c: any) => collect(c));
    };
    collect(route.root.snapshot);

    const labelMap: Record<string, string> = {
      'sports': 'Sports',
      'sport': 'Sports',
      'governing-body': 'Governing Bodies',
      'organisation': 'Organisations',
      'participant': 'Participants',
    };

    // Walk from the root activated route down the primary child chain
    let current = route.root;

    while (current) {
      const children = current.children;
      if (!children || children.length === 0) break;

      const primary = children.find(c => c.outlet === 'primary') || children[0];
      const segments = primary.snapshot.url.map((s: any) => s.path).filter(Boolean);

      for (const seg of segments) {
        url += `/${seg}`;

        let label = '';
        const data = primary.snapshot.data || {};

        // Prefer explicit breadcrumb from route data
        if (data['breadcrumb']) {
          label = data['breadcrumb'];
        }

        // If the segment itself is a resolved id, use the resolved name
        if (!label && resolvedNames[seg]) {
          label = resolvedNames[seg];
        }

        // If route resolver put an entity on data, prefer its name but only
        // when the resolved entity's id actually matches this URL segment.
        const entity = data['sport'] || data['governingBody'] || data['organisation'] || data['participant'];
        if (!label && entity && entity.name && entity.id === seg) {
          label = entity.name;
        }

        if (!label) {
          label = labelMap[seg] || seg;
        }

        crumbs.push({ label, url });
      }

      current = primary;
    }

    return crumbs;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}