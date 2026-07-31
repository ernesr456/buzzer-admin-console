import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SportListComponent } from './sport-list.component';
import { SportsService } from '../../services/sports/sports.service';

describe('SportListComponent', () => {
  let component: SportListComponent;
  let fixture: ComponentFixture<SportListComponent>;
  let sportsService: jasmine.SpyObj<SportsService>;

  beforeEach(async () => {
    sportsService = jasmine.createSpyObj('SportsService', ['loadSports'], {
      sports$: of([])
    });
    sportsService.loadSports.and.returnValue(of([]) as any);

    await TestBed.configureTestingModule({
      imports: [SportListComponent],
      providers: [{ provide: SportsService, useValue: sportsService }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SportListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should parse JSON bulk import payload into sports', () => {
    const sports = component.parseBulkImportData('[{"name":"Cricket","emoji":"🏏","color":"#FF0000"}]');

    expect(sports).toEqual([{ name: 'Cricket', emoji: '🏏', color: '#FF0000' }]);
  });

  it('should parse CSV bulk import payload into sports', () => {
    const sports = component.parseBulkImportData('name,emoji,color\nBadminton,🏸,#00FF00\nTennis,🎾,#0000FF');

    expect(sports).toEqual([
      { name: 'Badminton', emoji: '🏸', color: '#00FF00' },
      { name: 'Tennis', emoji: '🎾', color: '#0000FF' }
    ]);
  });

  it('should stop loading when the sports request completes', () => {
    let loadingState = true;

    component.loading$.subscribe((value) => {
      loadingState = value;
    });

    component.ngOnInit();

    expect(loadingState).toBeFalse();
  });
});
