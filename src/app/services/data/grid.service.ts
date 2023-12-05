import { Injectable } from "@angular/core";
import { ItemCountComponent } from "src/app/components/item-count/item-count.component";
import { OscarMinItem } from "../../models/oscar/oscar-min-item";
import { ItemStoreService } from "./item-store.service";
import { LatLngBounds } from "leaflet";
import { Grid } from "src/app/models/grid/grid.model";
import { Polygon } from "src/app/models/polygon/polygon.model";
import { Cell } from "src/app/models/cell/cell.model";
import { MapService } from "../map/map.service";
import { PolygonService } from "../polygon-service.service";
declare var L;

@Injectable({
  providedIn: "root",
})
export class GridService {
  globalGrid: Grid;
  localGrid: Grid;
  currentGrid: Grid;
  currentCells: Cell[];
  currentItems: OscarMinItem[];
  constructor(
    private itemStoreService: ItemStoreService,
    private mapService: MapService,
    private polygonService: PolygonService
  ) {}

  /**
   * Build the grid
   * Todo: fix polygonService
   */
  fitMaptoMinItems(items) {
    // issues here
    if (this.polygonService.polyClientCalc) {
      this.buildGrid(items);
      this.polygonService.activatedPolygons.forEach((uuid) => {
        this.getPolygonItems(this.polygonService.polygonMapping.get(uuid));
      });
    } else {
      this.mapService._map.once("moveend", (event) => {
        this.buildGrid(items);
      });
    }
    const bBox = this.getBoundingBox(items);
    if (bBox != null) this.mapService.fitBounds(bBox);
  }
  getBoundingBox(items): L.LatLngBounds {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    for (const item of items) {
      if (item.lat - item.boundingRadius < minLat)
        minLat = item.lat - item.boundingRadius;

      if (item.lat + item.boundingRadius > maxLat)
        maxLat = item.lat + item.boundingRadius;

      if (item.lng - item.boundingRadius < minLng)
        minLng = item.lng - item.boundingRadius;

      if (item.lng + item.boundingRadius > maxLng)
        maxLng = item.lng + item.boundingRadius;
    }
    if (
      minLat !== Infinity &&
      minLng !== Infinity &&
      maxLat !== -Infinity &&
      maxLng !== -Infinity
    ) {
      return new L.latLngBounds(
        L.latLng(minLat, minLng),
        L.latLng(maxLat, maxLng)
      );
    }
    return null;
  }

  buildGrid(items) {
    this.globalGrid = new Grid(this.mapService._map);
    this.globalGrid.buildProjectedGrid(items);
    this.currentGrid = this.globalGrid;
    if (this.localGrid) delete this.localGrid;
  }

  /**
   * Function that returns the items inside the four given points, which declare a bounding box BBcurrent.
   * @param west
   * @param south
   * @param east
   * @param north
   * @param heatmap
   * @returns
   */
  getCurrentItems(
    south: number,
    west: number,
    north: number,
    east: number,
    zoom: number
  ): { ids: number[]; cells: Cell[] } {
    if (!this.globalGrid) return { ids: [], cells: [] };
    if (!this.currentGrid.isInsideBounds(south, west, north, east)) {
      this.currentGrid = this.globalGrid;
    }
    this.currentGrid.updateCurrentBBox(south, west, north, east);
    if (zoom > this.globalGrid.zoom) {
      this.localGrid = new Grid(this.mapService._map);
      this.localGrid.buildProjectedGrid(this.currentGrid.getItemsForNewGrid());
      this.currentGrid = this.localGrid;
      this.currentGrid.updateCurrentBBox(south, west, north, east);
    } else this.currentGrid = this.globalGrid;
    // this.mapService.clearHeatMap();
    return this.currentGrid.getItemsForVisualization();
  }
  getPolygonItems(polygon: Polygon) {
    this.itemStoreService.updateItems(this.globalGrid.checkInside(polygon));
  }
  deleteGrid() {
    delete this.currentGrid;
    delete this.globalGrid;
    delete this.localGrid;
  }
}
