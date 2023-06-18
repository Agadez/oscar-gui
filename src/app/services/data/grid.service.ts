import { Injectable } from "@angular/core";
import { ItemCountComponent } from "src/app/components/item-count/item-count.component";
import { OscarMinItem } from "../../models/oscar/oscar-min-item";
import { ItemStoreService } from "./item-store.service";
import { Polygon } from "src/app/models/polygon/polygon.model";
import { Point } from "src/app/models/ray/point.model";
import { Line } from "src/app/models/ray/line.model";
import { LatLngBounds } from "leaflet";
import { Grid } from "src/app/models/grid/grid.model";
declare var L;

@Injectable({
  providedIn: "root",
})
export class GridService {
  // Amount of cells
  gridX = 100;
  gridY = 100;

  // grid: OscarMinItem[][][];
  // localGrid: OscarMinItem[][][];
  // localGridResolutionX: number;
  // localGridResolutionY: number;

  // localGridY: number;
  // localGridX: number;

  // localMinLat;
  // localMinLon;
  // localMaxLat;
  // localMaxLon;

  resolutionX: number;
  resolutionY: number;

  gridBBox: LatLngBounds;

  minLat = 100000;
  minLon = 100000;
  maxLat = -100000;
  maxLon = -100000;

  globalGrid: Grid;
  localGrid: Grid;

  wantedDensity = 0.01;

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
    /**
     * Initialize the grid as 2d array with OscarMinItem arrays as elements
     */
    // this.grid = Array.from({ length: this.gridX }, () =>
    //   Array.from({ length: this.gridY }, () => [])
    // );

    /**
     * Iterating over all items and storing them in the right cell of the grid
     */
    // for (const item of this.itemStoreService.items) {
    //   const latGridPos = this.getLatPositionInGrid(item.lat);
    //   const lonGridPos = this.getLonPositionInGrid(item.lon);
    //   this.grid[latGridPos][lonGridPos].push(item);
    // }
    // this.localGridResolutionX = this.resolutionX;
    // this.localGridResolutionY = this.resolutionY;
    // this.localGrid = this.grid;
    // this.localMinLat = this.minLat;
    // this.localMinLon = this.minLon;
    // this.localMaxLat = this.maxLat;
    // this.localMaxLon = this.maxLon;
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
    console.log(`x ${this.resolutionX}, y ${this.resolutionY}`);
  }

  /**
   * Helper function to determine the right cell for an item in the grid
   * @param lat
   * @returns x index in the grid for the given latitude
   */
  getLatPositionInGrid(lat: number): number {
    return Math.floor((lat - this.minLat) / this.resolutionX);
  }

  /**
   * Helper function to determine the right cell for an item in the grid
   * @param lon
   * @returns y index in the grid for the given longitude
   */
  getLonPositionInGrid(lon: number): number {
    return Math.floor((lon - this.minLon) / this.resolutionY);
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
    heatmap: boolean,
    zoom: number
  ): OscarMinItem[] {
    if (minLat < this.minLat) minLat = this.minLat;
    if (minLon < this.minLon) minLon = this.minLon;
    if (maxLat > this.maxLat) maxLat = this.maxLat;
    if (maxLon > this.maxLon) maxLon = this.maxLon;

    let insideLocalGrid = this.localGrid?.checkBounds(
      minLat,
      minLon,
      maxLat,
      maxLon
    );
    if (
      this.globalGrid.imprecise &&
      zoom >= 15 &&
      (!this.localGrid || !insideLocalGrid)
    ) {
      console.log("jojojo");
      this.localGrid = new Grid(
        this.globalGrid.getCurrentItems(minLat, minLon, maxLat, maxLon),
        minLat,
        maxLat,
        minLon,
        maxLon,
        this.resolutionX,
        this.resolutionY,
        undefined,
        undefined,
        this.wantedDensity
      );
      console.log(this.localGrid.grid);
      return this.globalGrid.getCurrentItems(minLat, minLon, maxLat, maxLon);
    }
    if (insideLocalGrid) {
      return this.localGrid.getCurrentItems(minLat, minLon, maxLat, maxLon);
    }
    return this.globalGrid.getCurrentItems(minLat, minLon, maxLat, maxLon);
    // const currentMinItems: OscarMinItem[] = [];
    // var wantedResolution = 0.001;
    // /**
    //  * Check whether the corners of BBcurrent are outside the grids bounding box and puts them on the edge of the grid if so.
    //  */
    // if (minLat < this.minLat) minLat = this.minLat;
    // if (minLon < this.minLon) minLon = this.minLon;
    // if (maxLat > this.maxLat) maxLat = this.maxLat;
    // if (maxLon > this.maxLon) maxLon = this.maxLon;

    // const minLonPos = this.getLonPositionInGrid(minLon);
    // const minLatPos = this.getLatPositionInGrid(minLat);
    // const maxLonPos = this.getLonPositionInGrid(maxLon);
    // const maxLatPos = this.getLatPositionInGrid(maxLat);

    // let distanceLatPos = maxLatPos - minLatPos;
    // let distanceLonPos = maxLonPos - minLonPos;

    // if (
    //   (this.localGridResolutionX >= wantedResolution ||
    //     this.localGridResolutionY >= wantedResolution) &&
    //   distanceLatPos * distanceLonPos <= 2
    // ) {
    //   console.log(minLat, maxLat);
    //   this.localMinLat = minLat;
    //   this.localMinLon = minLon;
    //   this.localMaxLat = maxLat;
    //   this.localMaxLon = maxLon;
    //   let distanceLat = maxLat - minLat;
    //   let distanceLon = maxLon - minLon;

    //   this.localGridX = Math.ceil(distanceLat / wantedResolution + 1);
    //   this.localGridY = Math.ceil(distanceLon / wantedResolution + 1);
    //   this.localGridResolutionX = distanceLat / (this.localGridX - 1);
    //   this.localGridResolutionY = distanceLon / (this.localGridY - 1);
    //   console.log(
    //     this.localGridX,
    //     this.localGridY,
    //     this.localGridResolutionX,
    //     this.localGridResolutionY,
    //     wantedResolution
    //   );

    //   this.localGrid = Array.from({ length: this.localGridX }, () =>
    //     Array.from({ length: this.localGridY }, () => [])
    //   );
    //   console.log(this.localGrid);
    //   for (let i = minLatPos; i <= maxLatPos; i++) {
    //     for (let j = minLonPos; j <= maxLonPos; j++) {
    //       for (const item of this.grid[i][j]) {
    //         const latGridPos = Math.floor(
    //           (item.lat - minLat) / this.localGridResolutionX
    //         );
    //         const lonGridPos = Math.floor(
    //           (item.lon - minLon) / this.localGridResolutionY
    //         );

    //         this.localGrid[latGridPos][lonGridPos].push(item);
    //       }
    //     }
    //   }
    //   return currentMinItems;
  }
  /**
   * Determine the positions of the corners inside the grid.
   */

  // adding all items that are in the bounding box
  //   const minLocalLonPos = Math.floor(
  //     (minLon - this.localMinLon) / this.localGridResolutionY
  //   );

  //   const minLocalLatPos = Math.floor(
  //     (minLat - this.localMinLat) / this.localGridResolutionX
  //   );

  //   const maxLocalLonPos = Math.floor(
  //     (maxLon - this.localMinLon) / this.localGridResolutionY
  //   );
  //   const maxLocalLatPos = Math.floor(
  //     (maxLat - this.localMinLat) / this.localGridResolutionX
  //   );

  //   if (distanceLatPos * distanceLonPos <= 2) {
  //     console.log(this.localGrid);
  //     console.log(
  //       minLocalLatPos,
  //       maxLocalLatPos,
  //       minLocalLonPos,
  //       maxLocalLonPos
  //     );
  //     for (let i = minLocalLatPos; i <= maxLocalLatPos; i++) {
  //       for (let j = minLocalLonPos; j <= maxLocalLonPos; j++) {
  //         for (const item of this.localGrid[i][j]) {
  //           currentMinItems.push(item);
  //         }
  //       }
  //     }
  //   } else {
  //     for (let i = minLatPos; i <= maxLatPos; i++) {
  //       for (let j = minLonPos; j <= maxLonPos; j++) {
  //         for (const item of this.grid[i][j]) {
  //           currentMinItems.push(item);
  //         }
  //       }
  //     }
  //   }

  //   return currentMinItems;
  // }

  // checkInside(polygon: Polygon) {
  //   var polygonCoordinates: Point[] = [];
  //   polygon.polygonNodes.forEach((node) => {
  //     var gridPoint = new Point();
  //     gridPoint.x = (node.lat - this.minLat) / this.resolutionX;
  //     gridPoint.y = (node.lon - this.minLon) / this.resolutionY;
  //     polygonCoordinates.push(gridPoint);
  //   });
  //   for (let i = 0; i < this.grid.length; i++) {
  //     for (let j = 0; j < this.grid[i].length; j++) {
  //       var counter = 0;
  //       var startingPoint = new Point(i, j);
  //       var endingPoint = new Point(this.gridX + 1, j);
  //       var infiniteLine = new Line(startingPoint, endingPoint);
  //       for (var k = 0; k < polygonCoordinates.length; k++) {
  //         var border = new Line(
  //           polygonCoordinates[k],
  //           polygonCoordinates[(k + 1) % polygonCoordinates.length]
  //         );

  //         if (this.checkIntersect(infiniteLine, border)) {
  //           counter++;
  //         }
  //       }

  //       if (counter % 2 == 0) {
  //         this.grid[i][j] = [];
  //       }
  //     }
  //   }
  //   let itemsInGrid: OscarMinItem[] = [];
  //   for (let i = 0; i < this.grid.length; i++) {
  //     for (let j = 0; j < this.grid[i].length; j++) {
  //       for (let k = 0; k < this.grid[i][j].length; k++) {
  //         itemsInGrid.push(this.grid[i][j][k]);
  //       }
  //     }
  //   }
  //   this.itemStoreService.updateItems(itemsInGrid);
  // }
  // checkIntersect(infiniteLine: Line, border: Line) {
  //   let dir1 = this.orientation(
  //     infiniteLine.startingPoint,
  //     infiniteLine.endingPoint,
  //     border.startingPoint
  //   );
  //   let dir2 = this.orientation(
  //     infiniteLine.startingPoint,
  //     infiniteLine.endingPoint,
  //     border.endingPoint
  //   );
  //   let dir3 = this.orientation(
  //     border.startingPoint,
  //     border.endingPoint,
  //     infiniteLine.startingPoint
  //   );
  //   let dir4 = this.orientation(
  //     border.startingPoint,
  //     border.endingPoint,
  //     infiniteLine.endingPoint
  //   );

  //   // When intersecting
  //   if (dir1 != dir2 && dir3 != dir4) return true;

  //   // When p2 of line2 are on the line1
  //   if (dir1 == 0 && this.onLine(infiniteLine, border.startingPoint))
  //     return true;

  //   // When p1 of line2 are on the line1
  //   if (dir2 == 0 && this.onLine(infiniteLine, border.endingPoint)) return true;

  //   // When p2 of line1 are on the line2
  //   if (dir3 == 0 && this.onLine(border, infiniteLine.startingPoint))
  //     return true;

  //   // When p1 of line1 are on the line2
  //   if (dir4 == 0 && this.onLine(border, infiniteLine.endingPoint)) return true;

  //   return false;
  // }
  // orientation(a, b, c) {
  //   var val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);

  //   if (val == 0) return 0;
  //   return val > 0 ? 1 : 2;
  // }
  // onLine(l1, p) {
  //   if (
  //     p.x <= Math.max(l1.startingPoint.x, l1.endingPoint.x) &&
  //     p.x <= Math.min(l1.startingPoint.x, l1.endingPoint.x) &&
  //     p.y <= Math.max(l1.startingPoint.y, l1.endingPoint.y) &&
  //     p.y <= Math.min(l1.startingPoint.y, l1.endingPoint.y)
  //   )
  //     return true;

  //   return false;
  // }

  // deleteGrid() {
  //   this.globalGrid.delete();
  // }
}
