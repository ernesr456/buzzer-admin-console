import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityAddDialogComponent } from './entity-add-dialog.component';

describe('EntityAddDialogComponent', () => {
  let component: EntityAddDialogComponent;
  let fixture: ComponentFixture<EntityAddDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityAddDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityAddDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
