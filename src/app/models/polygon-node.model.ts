import { GeoPoint } from "./geo-point";
import { v4 as uuidv4 } from "uuid";

export class PolygonNode {
  color: string;
  geoPoint: GeoPoint;
  name: string;
  leafletId?: number;
  uuid: uuidv4;
}
