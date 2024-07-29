import { Injectable } from '@angular/core';
import { GeoPoint } from '../../models/geo-point';
import { RoutingType } from '../routing/routing.service';

@Injectable({
  providedIn: 'root',
})
export class RoutingDataStoreService {
  routesToAdd = new Map<
    string,
    { geoPoints: GeoPoint[]; routingType: RoutingType }
  >();
  constructor() {}
}
