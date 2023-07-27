export class OscarMinItem {
  id: number;
  lng: number;
  lat: number;
  boundingRadius: number;
  constructor(id: number, lng: number, lat: number, boundingRadius: number) {
    this.lat = lat;
    this.lng = lng;
    this.id = id;
    this.boundingRadius = boundingRadius;
  }
}
