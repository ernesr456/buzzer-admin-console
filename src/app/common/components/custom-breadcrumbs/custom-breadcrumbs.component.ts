import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-custom-breadcrumbs',
  standalone: true,
  imports: [],
  templateUrl: './custom-breadcrumbs.component.html',
  styleUrl: './custom-breadcrumbs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomBreadcrumbsComponent {

}
