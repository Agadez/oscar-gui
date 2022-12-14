import { v4 as uuidv4 } from "uuid";

export class GeoPointId {
  lat = 0;
  lon = 0;
  uuid = uuidv4();

  constructor(lat: number, lon: number, uuid: uuidv4) {
    this.lat = lat;
    this.lon = lon;
    this.uuid = uuid;
  }
}
