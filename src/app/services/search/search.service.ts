import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
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
import { GridService } from "../data/grid.service";
import { ItemStoreService } from "../data/item-store.service";

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
    private routingService: RoutingService,
    private gridService: GridService,
    private store: ItemStoreService
  ) {
    this.subscribeRefinements();
  }

  queryToDraw = new BehaviorSubject<string>("");
  readonly queryToDraw$ = this.queryToDraw.asObservable();

  displayRegion = new Subject<string>();

  clearItems = new Subject<string>();

  startSearch = new Subject<string>();

  markerThreshold = 200;

  maxItems = 1000000;

  localSearch = false;

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
  mapPolygonName(inputString: string, clientRenderingMode: boolean) {
    const polygonMapping = this.polygonService.polygonMapping;
    const nameMapping = this.polygonService.idUuidMap;
    this.polygonService.activatedPolygons = new Set();
    let activatedPolygons = this.polygonService.activatedPolygons;
    let newQueryString = "";
    if (clientRenderingMode) {
      newQueryString = inputString.replace(
        /\$polygon:(\w+)/g,
        function (_, p1) {
          const uuid = nameMapping.get(p1);
          activatedPolygons.add(uuid);
          return polygonMapping.get(uuid).boundingBoxString;
        }
      );
    } else {
      newQueryString = inputString.replace(
        /\$polygon:(\w+)/g,
        function (_, p1) {
          const uuid = nameMapping.get(p1);
          activatedPolygons.add(uuid);
          return polygonMapping.get(uuid).polygonQuery;
        }
      );
    }
    return newQueryString;
  }
  createQueryString(inputString: string, clientRenderingMode: boolean) {
    this.fullQueryString =
      this.idPrependix +
      ") " +
      this.keyPrependix +
      this.keyValuePrependix +
      this.parentPrependix +
      this.mapPolygonName(inputString, clientRenderingMode) +
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
          this.gridService.deleteGrid();
          this.store.updateItems([]);
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

  rerender() {
    this.queryToDraw.next(this.fullQueryString);
  }
  getItems(apxStats: OscarApxstats): boolean {
    this.displayRegion.next(null);
    this.mapService.clearRegions();
    if (apxStats.items < this.maxItems) {
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
  queryStringForLocalSearch(inputString: string, clientRenderingMode: boolean) {
    this.createQueryString(inputString, clientRenderingMode);
    const bounds = this.mapService.bounds;
    this.fullQueryString += ` $geo:${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    return this.fullQueryString;
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
    this.routeQueryString = this.getRouteQueryString();
  }
}
