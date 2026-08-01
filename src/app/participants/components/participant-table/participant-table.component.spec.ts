import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantTableComponent } from './participant-table.component';

describe('ParticipantTableComponent', () => {
  let component: ParticipantTableComponent;
  let fixture: ComponentFixture<ParticipantTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticipantTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParticipantTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
