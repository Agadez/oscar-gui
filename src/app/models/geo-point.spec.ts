import { GeoPoint } from './geo-point';

describe('GeoPoint', () => {
  it('should create an instance', () => {
    expect(new GeoPoint(0.0, 0.0)).toBeTruthy();
  });
});
