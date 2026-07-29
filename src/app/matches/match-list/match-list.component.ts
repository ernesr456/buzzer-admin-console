import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-match-list',
  imports: [],
  templateUrl: './match-list.component.html',
  styleUrl: './match-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchListComponent {}
