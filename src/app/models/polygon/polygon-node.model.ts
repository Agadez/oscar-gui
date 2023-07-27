import { v4 as uuidv4 } from "uuid";

export class PolygonNode {
  lat = 0;
  lng = 0;
  uuid = uuidv4();
  color = "";

  constructor(lat: number, lng: number, uuid: uuidv4, color: string) {
    this.lat = lat;
    this.lng = lng;
    this.uuid = uuid;
    this.color = color;
  }
}
