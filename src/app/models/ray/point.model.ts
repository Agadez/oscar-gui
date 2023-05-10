export class Point {
  x: number;
  y: number;
  constructor(x?: number, y?: number) {
    if (x) this.x = x;
    if (y) this.y = y;
  }
}
