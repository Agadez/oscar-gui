import { Point } from './point.model';
export class Line {
  startingPoint: Point;
  endingPoint: Point;

  constructor(startingPoint: Point, endingPoint: Point) {
    this.startingPoint = startingPoint;
    this.endingPoint = endingPoint;
  }
}
