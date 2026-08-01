import { TestBed } from '@angular/core/testing';

import { SquadService } from './squad.service';

describe('SquadService', () => {
  let service: SquadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SquadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
