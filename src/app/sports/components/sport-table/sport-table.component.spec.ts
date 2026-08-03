import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportTableComponent } from './sport-table.component';

describe('SportTableComponent', () => {
  let component: SportTableComponent;
  let fixture: ComponentFixture<SportTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SportTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
