export class Cell {
  lat: number;
  lon: number;
  numObjects: number;

  constructor(lat: number, lon: number, numObjects: number) {
    this.lat = lat;
    this.lon = lon;
    this.numObjects = numObjects;
  }
}
