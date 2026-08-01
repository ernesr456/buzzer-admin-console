import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportAddDialogComponent } from './sport-add-dialog.component';

describe('SportAddDialogComponent', () => {
  let component: SportAddDialogComponent;
  let fixture: ComponentFixture<SportAddDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportAddDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SportAddDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
