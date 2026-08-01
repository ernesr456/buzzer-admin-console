import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SquadDetailComponent } from './squad-detail.component';

describe('SquadDetailComponent', () => {
  let component: SquadDetailComponent;
  let fixture: ComponentFixture<SquadDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SquadDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SquadDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
