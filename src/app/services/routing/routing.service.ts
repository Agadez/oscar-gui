import { Injectable } from "@angular/core";
import { ConfigService } from "../../config/config.service";
import { GeoPoint } from "../../models/geo-point";
import { RoutingPath } from "../../models/routing/routing";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, Subject } from "rxjs";
import { Route } from "src/app/models/routing/route.model";

export enum RoutingType {
  Car = "car",
  Bike = "bike",
  Foot = "foot",
}
@Injectable({
  providedIn: "root",
})
export class RoutingService {
  currentRoute: RoutingPath;
  debounceTime: number = 150;
  routesEmpty = true;
  addRoutingPointEvent = new Subject<{
    point: GeoPoint;
    name: string;
  }>();
  constructor(private configService: ConfigService, private http: HttpClient) {}
  getRoute(
    points: GeoPoint[],
    maxCellDiagInM: number,
    routingType: RoutingType = RoutingType.Car
  ): Observable<RoutingPath> {
    let params = new HttpParams();
    let pointString = "[";
    let first = true;
    for (const point of points) {
      if (first) {
        first = false;
      } else {
        pointString += ",";
      }
      pointString += `[${point.lat},${point.lng}]`;
    }
    pointString += "]";
    params = params.append("q", pointString);
    params = params.append("d", String(maxCellDiagInM));
    params = params.append("t", routingType);
    return this.http.get<RoutingPath>(this.configService.getRoutingUrl(), {
      params,
    });
  }
  unpack(edgeIds: number[], minLength: number) {
    const params = new HttpParams();
    let edgeIdString = "[";
    let first = true;
    for (const point of edgeIds) {
      if (first) {
        first = false;
      } else {
        edgeIdString += ",";
      }
      edgeIdString += `${point}`;
    }
    params.append("q", edgeIdString);
    params.append("m", minLength.toString());
  }
}
