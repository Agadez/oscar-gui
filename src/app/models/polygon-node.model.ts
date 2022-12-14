import { GeoPointId } from "./geo-point-id.model";
import { v4 as uuidv4 } from "uuid";

export class PolygonNode {
  color: string;
  geoPoint: GeoPointId;
  name: string;
  leafletId?: number;
  uuid: uuidv4;
}
