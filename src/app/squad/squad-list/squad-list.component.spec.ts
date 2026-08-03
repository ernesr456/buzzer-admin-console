import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SquadListComponent } from './squad-list.component';

describe('SquadListComponent', () => {
  let component: SquadListComponent;
  let fixture: ComponentFixture<SquadListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SquadListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SquadListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
