import { Injectable } from "@angular/core";
import { ItemCountComponent } from "src/app/components/item-count/item-count.component";
import { OscarMinItem } from "../../models/oscar/oscar-min-item";
import { ItemStoreService } from "./item-store.service";
import { LatLngBounds } from "leaflet";
import { Grid } from "src/app/models/grid/grid.model";
import { Polygon } from "src/app/models/polygon/polygon.model";
declare var L;

@Injectable({
  providedIn: "root",
})
export class GridService {
  // Amount of cells
  gridX = 100;
  gridY = 100;

  resolutionX: number;
  resolutionY: number;

  gridBBox: LatLngBounds;

  minLat = 100000;
  minLon = 100000;
  maxLat = -100000;
  maxLon = -100000;

  globalGrid: Grid;
  localGrid: Grid;

  wantedDensity = 0.1;

  constructor(private itemStoreService: ItemStoreService) {}

  /**
   * Build the grid
   */
  buildGrid() {
    /**
     * Calculate the grid bounds is necessary before building the grid
     */
    this.getGridBounds();

    this.globalGrid = new Grid(
      this.itemStoreService.items,
      this.minLat,
      this.maxLat,
      this.minLon,
      this.maxLon,
      this.resolutionX,
      this.resolutionY,
      this.gridX,
      this.gridY,
      this.wantedDensity
    );
    if (this.localGrid) delete this.localGrid;
  }

  /**
   * Calculates the grid bounds and resolution based on the items received from the Server
   */
  getGridBounds() {
    this.minLon = this.minLat = 100000;
    this.maxLat = this.maxLon = -100000;
    /**
     * Determine the bounding box by iterating over all items
     */
    for (const item of this.itemStoreService.items) {
      if (item.lat < this.minLat) this.minLat = item.lat;

      if (item.lat > this.maxLat) this.maxLat = item.lat;

      if (item.lon < this.minLon) this.minLon = item.lon;

      if (item.lon > this.maxLon) this.maxLon = item.lon;
    }

    /**
     * Store the bounding box in the gridBBox variable
     * @type {L.LatLngBounds}
     */
    this.gridBBox = new L.latLngBounds(
      L.latLng(this.minLat, this.minLon),
      L.latLng(this.maxLat, this.maxLon)
    );
    /**
     * Calculate and store the X-axis resolution
     * @type {number}
     */
    let distanceLat = this.maxLat - this.minLat;
    this.resolutionX = distanceLat / (this.gridX - 1);

    /**
     * Calculate and store the Y-axis resolution
     * @type {number}
     */
    let distanceLon = this.maxLon - this.minLon;
    this.resolutionY = distanceLon / (this.gridY - 1);
  }

  /**
   * Function that returns the items inside the four given points, which declare a bounding box BBcurrent.
   * @param minLon
   * @param minLat
   * @param maxLon
   * @param maxLat
   * @param heatmap
   * @returns
   */
  getCurrentItems(
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number,
    zoom: number
  ): OscarMinItem[] {
    if (minLat < this.minLat) minLat = this.minLat;
    if (minLon < this.minLon) minLon = this.minLon;
    if (maxLat > this.maxLat) maxLat = this.maxLat;
    if (maxLon > this.maxLon) maxLon = this.maxLon;
    if (!this.globalGrid) return [];
    let insideLocalGrid = this.localGrid?.checkBounds(
      minLat,
      minLon,
      maxLat,
      maxLon
    );
    if (
      this.globalGrid.imprecise &&
      zoom >= 14 &&
      (!this.localGrid || !insideLocalGrid)
    ) {
      this.localGrid = new Grid(
        this.globalGrid.getCurrentItems(minLat, minLon, maxLat, maxLon, true),
        minLat,
        maxLat,
        minLon,
        maxLon,
        undefined,
        undefined,
        undefined,
        undefined,
        this.wantedDensity
      );
      console.log(this.localGrid.grid);
      return this.localGrid.getCurrentItems(
        minLat,
        minLon,
        maxLat,
        maxLon,
        true
      );
    }
    if (insideLocalGrid) {
      console.log("using localGrid");
      return this.localGrid.getCurrentItems(
        minLat,
        minLon,
        maxLat,
        maxLon,
        true
      );
    }
    return this.globalGrid.getCurrentItems(
      minLat,
      minLon,
      maxLat,
      maxLon,
      true
    );
  }
  getPolygonItems(polygon: Polygon) {
    this.itemStoreService.updateItems(this.globalGrid.checkInside(polygon));
  }
  deleteGrid() {
    delete this.globalGrid;
    delete this.localGrid;
  }
}
