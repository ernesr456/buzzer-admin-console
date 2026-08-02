import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityDetailComponent } from './entity-detail.component';

describe('GoverningBodyDetailComponent', () => {
  let component: EntityDetailComponent;
  let fixture: ComponentFixture<EntityDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
