import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CustomBreadcrumbsComponent } from '../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';

@Component({
  selector: 'app-staff-list',
  imports: [CustomBreadcrumbsComponent],
  templateUrl: './staff-list.component.html',
  styleUrl: './staff-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffListComponent {

}
