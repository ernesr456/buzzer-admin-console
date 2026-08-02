import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-governing-body-list',
  standalone: true,
  imports: [],
  templateUrl: './entity-list.component.html',
  styleUrl: './entity-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityListComponent {
  
}
