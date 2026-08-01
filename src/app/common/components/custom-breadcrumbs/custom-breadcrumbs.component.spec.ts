import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomBreadcrumbsComponent } from './custom-breadcrumbs.component';

describe('CustomBreadcrumbsComponent', () => {
  let component: CustomBreadcrumbsComponent;
  let fixture: ComponentFixture<CustomBreadcrumbsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomBreadcrumbsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomBreadcrumbsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
