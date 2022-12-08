import { TestBed } from '@angular/core/testing';

import { PolygonServiceService } from './polygon-service.service';

describe('PolygonServiceService', () => {
  let service: PolygonServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PolygonServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
