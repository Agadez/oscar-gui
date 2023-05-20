export class OscarMinItem {
  id: number;
  lon: number;
  lat: number;
  boundingRadius: number;
  constructor(id: number, lon: number, lat: number, boundingRadius: number) {
    this.lat = lat;
    this.lon = lon;
    this.id = id;
    this.boundingRadius = boundingRadius;
  }
}
