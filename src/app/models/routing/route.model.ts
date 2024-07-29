import { GeoPoint } from '../geo-point';

export class Route {
  active: boolean;
  id: string;
  color: string;
  initialPoint: { point: GeoPoint; name: string };
  destroyed: boolean;

  constructor(
    active: boolean,
    id: string,
    color: string,
    initialPoint: { point: GeoPoint; name: string },
    destroyed: boolean
  ) {
    this.active = active;
    this.id = id;
    this.color = color;
    this.initialPoint = initialPoint;
    this.destroyed = destroyed;
  }
}
