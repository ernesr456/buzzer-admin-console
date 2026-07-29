import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportDialogComponent } from './sport-dialog.component';

describe('SportDialogComponent', () => {
  let component: SportDialogComponent;
  let fixture: ComponentFixture<SportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
