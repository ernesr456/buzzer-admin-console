import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportConfirmDialogComponent } from './custom-dialog.component';

describe('SportConfirmDialogComponent', () => {
  let component: SportConfirmDialogComponent;
  let fixture: ComponentFixture<SportConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportConfirmDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SportConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
