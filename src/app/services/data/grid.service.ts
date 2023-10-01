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
   */
  fitMaptoMinItems() {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    // problematic
    this.mapService._map.once("moveend", (event) => {
      this.buildGrid();
      // checking for all activated polygons
      if (this.polygonService.polyClientCalc) {
        this.polygonService.activatedPolygons.forEach((uuid) => {
          this.getPolygonItems(this.polygonService.polygonMapping.get(uuid));
        });
      }
    });

    for (const item of this.itemStoreService.items) {
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
      let gridBBox = new L.latLngBounds(
        L.latLng(minLat, minLng),
        L.latLng(maxLat, maxLng)
      );
      console.log(gridBBox);
      this.mapService.fitBounds(gridBBox);
    }
  }

  buildGrid() {
    this.globalGrid = new Grid(
      this.itemStoreService.items,
      this.mapService._map
      // 1
    );
    this.globalGrid.buildProjectedGrid();
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
  ): { items: OscarMinItem[]; cells: Cell[] } {
    if (!this.globalGrid) return { items: [], cells: [] };
    this.mapService.clearHeatMap();
    this.globalGrid.updateCurrentBBox(south, west, north, east);
    if (zoom != this.globalGrid.zoom) {
      this.localGrid = new Grid(
        this.globalGrid.getCurrentItems().items,
        this.mapService._map
      );
      this.localGrid.buildProjectedGrid();
      this.currentGrid = this.localGrid;
      return this.localGrid.getCurrentItems();
    } else this.currentGrid = this.globalGrid;
    return this.currentGrid.getCurrentItems();
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
