import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoverningBodyDetailComponent } from './governing-body-detail.component';

describe('GoverningBodyDetailComponent', () => {
  let component: GoverningBodyDetailComponent;
  let fixture: ComponentFixture<GoverningBodyDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoverningBodyDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoverningBodyDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
