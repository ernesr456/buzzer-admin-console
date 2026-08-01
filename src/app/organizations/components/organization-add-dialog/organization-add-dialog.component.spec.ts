import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationAddDialogComponent } from './organization-add-dialog.component';

describe('OrganizationAddDialogComponent', () => {
  let component: OrganizationAddDialogComponent;
  let fixture: ComponentFixture<OrganizationAddDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationAddDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationAddDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
