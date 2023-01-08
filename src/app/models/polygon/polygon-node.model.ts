import { v4 as uuidv4 } from "uuid";

export class PolygonNode {
  lat = 0;
  lon = 0;
  uuid = uuidv4();
  color = "";

  constructor(lat: number, lon: number, uuid: uuidv4, color: string) {
    this.lat = lat;
    this.lon = lon;
    this.uuid = uuid;
    this.color = color;
  }
}
