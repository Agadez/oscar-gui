import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { MapService } from "./map/map.service";
import { SearchService } from "./search/search.service";
import { RoutingService } from "./routing/routing.service";
import { PolygonService } from "./polygon-service.service";
import { GridService } from "./data/grid.service";

@Injectable({
  providedIn: "root",
})
export class QueryParamsService {
  setMap = new Subject<boolean>();
  setQuery = new Subject<boolean>();
  lat: number;
  lng: number;
  zoom: number;
  queryString: string;
  maxItems: number;
  localSearch: boolean;
  markerThreshold: number;
  debounceTime: number;
  polyClientCalc: boolean;
  gridX: number;
  gridY: number;
  constructor(
    private mapService: MapService,
    private searchService: SearchService,
    private routingService: RoutingService,
    private polygonService: PolygonService,
    private gridService: GridService
  ) {}

  paramsFromQuery(params: object) {
    this.searchService.maxItems = this.maxItems = !isNaN(
      parseInt(params["maxItems"])
    )
      ? parseInt(params["maxItems"])
      : 1000000;
    this.searchService.markerThreshold = this.markerThreshold = !isNaN(
      parseInt(params["markerThreshold"])
    )
      ? parseInt(params["markerThreshold"])
      : 200;
    this.routingService.debounceTime = this.debounceTime = !isNaN(
      parseInt(params["dt"])
    )
      ? parseInt(params["dt"])
      : 150;
    this.gridService.globalX = this.gridX = !isNaN(parseInt(params["gridX"]))
      ? parseInt(params["gridX"])
      : 100;
    this.gridService.globalY = this.gridY = !isNaN(parseInt(params["gridY"]))
      ? parseInt(params["gridY"])
      : 100;
    this.lat = !isNaN(parseFloat(params["lat"]))
      ? parseFloat(params["lat"])
      : 48.43379;
    this.lng = !isNaN(parseFloat(params["lng"]))
      ? parseFloat(params["lng"])
      : 9.00203;
    this.zoom = !isNaN(parseInt(params["zoom"])) ? parseInt(params["zoom"]) : 7;
    this.searchService.localSearch = this.localSearch =
      params["localSearch"] === "true";
    this.polygonService.polyClientCalc = this.polyClientCalc =
      params["pCC"] === "true";
    this.queryString = params["query"] !== undefined ? params["query"] : "";
    this.setMap.next(true);
  }
  getCurrentState(inputString: string) {
    const center = this.mapService._map.getCenter();
    const zoom = this.mapService._map.getZoom();
    const maxItems = this.searchService.maxItems;
    const localSearch = this.searchService.localSearch;
    const markerThreshold = this.searchService.markerThreshold;
    const debounceTime = this.routingService.debounceTime;
    const polyClientCalc = this.polygonService.polyClientCalc;
    const gridX = this.gridService.globalX;
    const gridY = this.gridService.globalY;

    const uri = new URL(window.location.href);
    uri.searchParams.set("maxItems", String(maxItems));
    uri.searchParams.set("localSearch", String(localSearch));
    uri.searchParams.set("markerThreshold", String(markerThreshold));
    uri.searchParams.set("dt", String(debounceTime));
    uri.searchParams.set("pCC", String(polyClientCalc));
    uri.searchParams.set("gridX", String(gridX));
    uri.searchParams.set("gridY", String(gridY));
    uri.searchParams.set("lat", String(center.lat));
    uri.searchParams.set("lng", String(center.lng));
    uri.searchParams.set("zoom", String(zoom));
    uri.searchParams.set("query", inputString);

    return uri.toString();
  }
}
