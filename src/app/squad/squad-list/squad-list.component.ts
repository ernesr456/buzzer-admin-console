import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CustomBreadcrumbsComponent } from '../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';

@Component({
  selector: 'app-squad-list',
  imports: [CustomBreadcrumbsComponent],
  templateUrl: './squad-list.component.html',
  styleUrl: './squad-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SquadListComponent {

}
