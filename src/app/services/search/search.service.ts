import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { RefinementsService } from "../data/refinements.service";
import { MapService } from "../map/map.service";
import { OscarItemsService } from "../oscar/oscar-items.service";
import { PolygonServiceService } from "../polygon-service.service";
import { RefinementType } from "../../models/gui/refinement";
import { TextUtil } from "../../util/text-util";
import { OscarItem } from "src/app/models/oscar/oscar-item";
import { RoutingDataStoreService } from "../data/routing-data-store.service";
import { RoutingService, RoutingType } from "../routing/routing.service";
import { OscarApxstats } from "src/app/models/oscar/oscar-apxstats";

@Injectable({
  providedIn: "root",
})
export class SearchService {
  constructor(
    private mapService: MapService,
    private oscarService: OscarItemsService,
    private polygonService: PolygonServiceService,
    private refinementStore: RefinementsService,
    private routingDataStoreService: RoutingDataStoreService,
    private routingService: RoutingService
  ) {}

  queryToDraw = new BehaviorSubject<string>("");
  readonly queryToDraw$ = this.queryToDraw.asObservable();

  displayRegion = new Subject<string>();

  clearItems = new Subject<string>();
  
  startSearch = new Subject<string>();

  fullQueryString = "";
  routeQueryString = "";
  idPrependix = "";
  keyPrependix = "";
  keyValuePrependix = "";
  parentPrependix = "";
  keyAppendix = "";
  keyValueAppendix = "";
  parentAppendix = "";

  subscribeRefinements() {
    this.refinementStore.refinements$.subscribe((refinements) => {
      this.keyValuePrependix = "";
      refinements
        .filter(
          (refinement) =>
            refinement.refinementType === RefinementType.KeyValue &&
            refinement.excluding === false
        )
        .forEach((refinement) => {
          this.keyValuePrependix += `@${refinement.key}:${refinement.value} `;
        });
      this.keyPrependix = "";
      refinements
        .filter(
          (refinement) =>
            refinement.refinementType === RefinementType.Key &&
            refinement.excluding === false
        )
        .forEach((refinement) => {
          this.keyValuePrependix += `@${refinement.key} `;
        });
      this.parentPrependix = "";
      refinements
        .filter(
          (refinement) =>
            refinement.refinementType === RefinementType.Parent &&
            refinement.excluding === false
        )
        .forEach((refinement) => {
          this.parentPrependix += `"${refinement.value}" `;
        });
      this.keyValueAppendix = "";
      refinements
        .filter(
          (refinement) =>
            refinement.refinementType === RefinementType.KeyValue &&
            refinement.excluding === true
        )
        .forEach((refinement) => {
          this.keyValueAppendix += `-@${refinement.key}:${refinement.value} `;
        });
      this.keyAppendix = "";
      refinements
        .filter(
          (refinement) =>
            refinement.refinementType === RefinementType.Key &&
            refinement.excluding === true
        )
        .forEach((refinement) => {
          this.keyAppendix += `-@${refinement.key} `;
        });
      this.parentAppendix = "";
      refinements
        .filter(
          (refinement) =>
            refinement.refinementType === RefinementType.Parent &&
            refinement.excluding === true
        )
        .forEach((refinement) => {
          this.parentAppendix += `-"${refinement}" `;
        });
        this.startSearch.next("start");
    });
  }
  mapPolygonName(inputString: string) {
    const polygonMapping = this.polygonService.polygonMapping;
    const nameMapping = this.polygonService.nameMapping;
    const newQueryString = inputString.replace(/§(\w+)/g, function (_, p1) {
      return polygonMapping.get(nameMapping.get(p1)).polygonQuery;
    });
    return newQueryString;
  }
  createQueryString(inputString: string) {
    this.fullQueryString =
      this.idPrependix +
      ") " +
      this.keyPrependix +
      this.keyValuePrependix +
      this.parentPrependix +
      this.mapPolygonName(inputString) +
      this.keyAppendix +
      this.parentAppendix +
      this.keyValueAppendix +
      this.routeQueryString;
    return this.fullQueryString;
  }
  searchForRegions(inputString: string, regions: OscarItem[]) {
    this.displayRegion.next(null);
    // check all properties for similarity to see if the region name is similar to the input in all languages
    if (regions && regions.length > 0) {
      for (const property of regions[0].properties.v) {
        const similarity = TextUtil.similarity(
          property,
          inputString.replaceAll('"', "")
        );
        if (similarity > 0.7) {
          this.clearItems.next("clear");
          this.mapService.drawRegion(regions[0]);
          const region = regions[0];
          this.displayRegion.next(OscarItem.getValue(region, "wikidata"));
          return true;
        }
      }
    }
    return false;
  }
  getItems(maxItems: number, apxStats: OscarApxstats): boolean {
    this.displayRegion.next(null);
    this.mapService.clearRegions();
    if (apxStats.items < maxItems) {
      this.queryToDraw.next(this.fullQueryString);
      return true;
    }
    return false;
  }
  getRouteQueryString() {
    let returnString = "";
    const routes = [];
    for (const route of this.routingDataStoreService.routesToAdd.values()) {
      routes.push(route);
    }
    if (!routes) {
      return returnString;
    }
    for (const route of routes) {
      let routingTypeIndicator = 0;
      switch (route.routingType) {
        case RoutingType.Car:
          routingTypeIndicator = 0;
          break;
        case RoutingType.Bike:
          routingTypeIndicator = 1;
          break;
        case RoutingType.Foot:
          routingTypeIndicator = 2;
          break;
      }
      returnString += " $route(0," + routingTypeIndicator;
      for (const point of route.geoPoints) {
        returnString += `,${point.lat},${point.lon}`;
      }
      returnString += ")";
    }
    return returnString;
  }
  globalSearch(inputString: string) {
    let fullQueryString = this.createQueryString(inputString);
    this.oscarService.getApxItemCount(fullQueryString).subscribe((apxStats) => {
      if (apxStats.items > 0) fullQueryString = fullQueryString;
      this.oscarService.getApxItemCount(fullQueryString).subscribe(() => {
        this.queryToDraw.next(fullQueryString);
      });
    });
  }
  queryStringForLocalSearch(inputString: string) {
    let fullQueryString = this.createQueryString(inputString);
    const bounds = this.mapService.bounds;
    const localString =
      fullQueryString +
      ` $geo:${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

    this.oscarService.getApxItemCount(localString).subscribe((apxStats) => {
      if (apxStats.items > 0) fullQueryString = localString;
    });
    // this.getRegions(fullQueryString);
  }
  addRoute() {
    this.idPrependix = "(";
    if (this.routingService.currentRoute) {
      let first = true;
      for (const cellId of this.routingService.currentRoute.cellIds) {
        if (!first) {
          this.idPrependix += " + ";
        }
        first = false;
        this.idPrependix += "$cell:" + cellId;
      }
    }
    this.getRouteQueryString();
  }
}
