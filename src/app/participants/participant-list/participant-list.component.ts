import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CustomBreadcrumbsComponent } from '../../common/components/custom-breadcrumbs/custom-breadcrumbs.component';

@Component({
  selector: 'app-participant-list',
  imports: [CustomBreadcrumbsComponent],
  templateUrl: './participant-list.component.html',
  styleUrl: './participant-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParticipantListComponent {

}
