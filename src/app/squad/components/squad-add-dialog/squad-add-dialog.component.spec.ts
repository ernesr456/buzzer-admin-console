import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SquadAddDialogComponent } from './squad-add-dialog.component';

describe('SquadAddDialogComponent', () => {
  let component: SquadAddDialogComponent;
  let fixture: ComponentFixture<SquadAddDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SquadAddDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SquadAddDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
