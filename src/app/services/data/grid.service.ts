import { Injectable } from "@angular/core";
import { ItemCountComponent } from "src/app/components/item-count/item-count.component";
import { OscarMinItem } from "../../models/oscar/oscar-min-item";
import { ItemStoreService } from "./item-store.service";
import { LatLngBounds } from "leaflet";
import { Grid } from "src/app/models/grid/grid.model";
import { Polygon } from "src/app/models/polygon/polygon.model";
import { Cell } from "src/app/models/cell/cell.model";
declare var L;

@Injectable({
  providedIn: "root",
})
export class GridService {
  globalGrid: Grid;
  localGrid: Grid;

  globalX = 100;
  globalY = 100;

  localX = 100;
  localY = 100;

  hii = 0;

  currentGrid: Grid;
  currentCells: Cell[];
  currentItems: OscarMinItem[];

  constructor(private itemStoreService: ItemStoreService) {}

  /**
   * Build the grid
   */
  buildGrid() {
    this.globalGrid = new Grid(
      this.itemStoreService.items,
      this.globalX,
      this.globalY
    );
    if (this.localGrid) delete this.localGrid;
  }

  /**
   * Function that returns the items inside the four given points, which declare a bounding box BBcurrent.
   * @param minLng
   * @param minLat
   * @param maxLng
   * @param maxLat
   * @param heatmap
   * @returns
   */
  getCurrentItems(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
    zoom: number
  ): { items: OscarMinItem[]; cells: Cell[] } {
    if (!this.globalGrid) return { items: [], cells: [] };
    this.globalGrid.updateCurrentBBox(minLat, minLng, maxLat, maxLng);

    if (this.globalGrid.currentlyInsideLocalGridZone()) {
      let insideLocalGrid = this.localGrid?.checkBounds(
        minLat,
        minLng,
        maxLat,
        maxLng
      );
      if (!insideLocalGrid || !this.localGrid) {
        this.localGrid = new Grid(
          this.globalGrid.getCurrentItems().items,
          this.localX,
          this.localY
        );
      }
      this.localGrid.updateCurrentBBox(minLat, minLng, maxLat, maxLng);
      this.currentGrid = this.localGrid;
      return this.localGrid.getCurrentItems();
    }
    this.currentGrid = this.globalGrid;
    return this.globalGrid.getCurrentItems();
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
