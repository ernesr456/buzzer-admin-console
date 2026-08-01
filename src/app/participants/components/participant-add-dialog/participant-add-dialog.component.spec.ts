import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantAddDialogComponent } from './participant-add-dialog.component';

describe('ParticipantAddDialogComponent', () => {
  let component: ParticipantAddDialogComponent;
  let fixture: ComponentFixture<ParticipantAddDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticipantAddDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParticipantAddDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
