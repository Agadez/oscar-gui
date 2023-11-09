import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { RefinementsService } from "../data/refinements.service";
import { MapService } from "../map/map.service";
import { OscarItemsService } from "../oscar/oscar-items.service";
import { PolygonService } from "../polygon-service.service";
import { RefinementType } from "../../models/gui/refinement";
import { TextUtil } from "../../util/text-util";
import { OscarItem } from "src/app/models/oscar/oscar-item";
import { RoutingDataStoreService } from "../data/routing-data-store.service";
import { RoutingService, RoutingType } from "../routing/routing.service";
import { OscarApxstats } from "src/app/models/oscar/oscar-apxstats";
import { GridService } from "../data/grid.service";
import { ItemStoreService } from "../data/item-store.service";
import { MatDialog } from "@angular/material/dialog";
import { DialogComponent } from "src/app/components/dialog/dialog.component";
@Injectable({
  providedIn: "root",
})
export class SearchService {
  constructor(
    private mapService: MapService,
    private oscarService: OscarItemsService,
    private polygonService: PolygonService,
    private refinementStore: RefinementsService,
    private routingDataStoreService: RoutingDataStoreService,
    private routingService: RoutingService,
    private gridService: GridService,
    private store: ItemStoreService,
    public dialog: MatDialog
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
          this.parentAppendix += `-"${refinement.value}" `;
        });
      this.startSearch.next("start");
    });
  }

  itemsOfPolygon(inputString: string) {
    const polygonMapping = this.polygonService.polygonMapping;
    const nameMapping = this.polygonService.idUuidMap;
    this.polygonService.activatedPolygons = new Map();
    let activatedPolygons = this.polygonService.activatedPolygons;
    let newQueryString = "";
    newQueryString = inputString.replace(
      /\$polygon:(\w+)/,
      function (_, p1, p2) {
        console.log(_);
        console.log(p1);
        console.log(p2);
        const uuid = nameMapping.get(p2);
        activatedPolygons.set(uuid, "");
        newQueryString = p1 + polygonMapping.get(uuid).boundingBoxString;
        console.log(newQueryString);
        console.log(p1);
        return newQueryString;
      }
    );
  }
  mapPolygonName(inputString: string, clientRenderingMode: boolean) {
    const polygonMapping = this.polygonService.polygonMapping;
    const nameMapping = this.polygonService.idUuidMap;
    this.polygonService.activatedPolygons = new Map();
    let activatedPolygons = this.polygonService.activatedPolygons;
    let newQueryString = "";
    if (clientRenderingMode) {
      newQueryString = inputString.replace(
        /\$polygon:(\w+)/g,
        function (_, p1) {
          const uuid = nameMapping.get(p1);
          activatedPolygons.set(uuid, "");
          return polygonMapping.get(uuid).boundingBoxString;
          // return polygonMapping.get(uuid).polygonQuery;
        }
      );
    } else {
      newQueryString = inputString.replace(
        /\$polygon:(\w+)/g,
        function (_, p1) {
          const uuid = nameMapping.get(p1);
          activatedPolygons.set(uuid, "");
          return polygonMapping.get(uuid).polygonQuery;
        }
      );
    }
    // if (activatedPolygons.size === 0) {
    //   newQueryString = "";
    // }
    return newQueryString;
  }
  createQueryString(inputString: string, clientRenderingMode: boolean) {
    let polygonString = this.mapPolygonName(inputString, clientRenderingMode);
    let routeString = this.getRouteQueryString(polygonString);
    this.fullQueryString =
      this.idPrependix +
      ") " +
      this.keyPrependix +
      this.keyValuePrependix +
      this.parentPrependix +
      routeString +
      this.keyAppendix +
      this.parentAppendix +
      this.keyValueAppendix;
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
  getItems(apxStats: OscarApxstats): Promise<boolean> {
    this.displayRegion.next(null);
    this.mapService.clearRegions();
    return new Promise<boolean>((resolve) => {
      if (apxStats.items <= this.maxItems) {
        this.queryToDraw.next(this.fullQueryString);
        resolve(true);
      }
      if (apxStats.items > this.maxItems) {
        const dialogRef = this.dialog.open(DialogComponent, {
          width: "500px",
          data: { maxItems: this.maxItems, returnedItems: apxStats.items },
        });
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.queryToDraw.next(this.fullQueryString);
            resolve(true);
          } else resolve(false);
        });
      }
    });
  }
  getRouteQueryString(inputString) {
    let newQueryString = inputString.replace(/\$route:(\w+)/g, (_, id) => {
      let route = this.routingDataStoreService.routesToAdd.get(id);
      let routingTypeIndicator = 0;
      let routeString = "$route(0," + routingTypeIndicator;
      for (const point of route.geoPoints) {
        routeString += `,${point.lat},${point.lng}`;
      }
      routeString += ")";
      return routeString;
    });
    return newQueryString;
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
  }
}
