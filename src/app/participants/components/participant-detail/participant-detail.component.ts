import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-participant-detail',
  standalone: true,
  imports: [],
  templateUrl: './participant-detail.component.html',
  styleUrl: './participant-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParticipantDetailComponent {

}
