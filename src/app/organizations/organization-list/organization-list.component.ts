import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CustomBreadcrumbsComponent } from '../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';

@Component({
  selector: 'app-organization-list',
  imports: [CustomBreadcrumbsComponent],
  templateUrl: './organization-list.component.html',
  styleUrl: './organization-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationListComponent {

}
