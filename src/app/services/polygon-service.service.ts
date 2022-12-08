import { Injectable } from "@angular/core";
import { GeoPoint } from "../models/geo-point";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class PolygonServiceService {
  constructor() {}
  polygon = new Subject<GeoPoint[]>();
}
