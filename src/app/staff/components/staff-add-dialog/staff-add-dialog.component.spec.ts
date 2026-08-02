import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffAddDialogComponent } from './staff-add-dialog.component';

describe('StaffAddDialogComponent', () => {
  let component: StaffAddDialogComponent;
  let fixture: ComponentFixture<StaffAddDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffAddDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffAddDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
