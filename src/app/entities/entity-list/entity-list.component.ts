import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CustomBreadcrumbsComponent } from '../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';

@Component({
  selector: 'app-governing-body-list',
  standalone: true,
  imports: [CustomBreadcrumbsComponent],
  templateUrl: './entity-list.component.html',
  styleUrl: './entity-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityListComponent {
  
}
