import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-entity-detail',
  standalone: true,
  imports: [],
  templateUrl: './entity-detail.component.html',
  styleUrl: './entity-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityDetailComponent {

}
