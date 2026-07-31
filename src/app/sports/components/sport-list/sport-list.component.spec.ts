import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportListComponent } from './sport-list.component';

describe('SportListComponent', () => {
  let component: SportListComponent;
  let fixture: ComponentFixture<SportListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportListComponent]
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
});
