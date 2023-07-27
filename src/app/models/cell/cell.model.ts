export class Cell {
  lat: number;
  lng: number;
  numObjects: number;

  constructor(lat: number, lng: number, numObjects: number) {
    this.lat = lat;
    this.lng = lng;
    this.numObjects = numObjects;
  }
}
