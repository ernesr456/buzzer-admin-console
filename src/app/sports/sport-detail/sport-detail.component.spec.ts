import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportDetailComponent } from './sport-detail.component';

describe('SportDetailComponent', () => {
  let component: SportDetailComponent;
  let fixture: ComponentFixture<SportDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SportDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
