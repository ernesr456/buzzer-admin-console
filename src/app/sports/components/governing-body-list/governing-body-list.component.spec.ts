import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoverningBodyListComponent } from './governing-body-list.component';

describe('GoverningBodyListComponent', () => {
  let component: GoverningBodyListComponent;
  let fixture: ComponentFixture<GoverningBodyListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoverningBodyListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoverningBodyListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
