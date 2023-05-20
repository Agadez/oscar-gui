import { Injectable } from "@angular/core";
import { ItemCountComponent } from "src/app/components/item-count/item-count.component";
import { OscarMinItem } from "../../models/oscar/oscar-min-item";
import { ItemStoreService } from "./item-store.service";
import { Polygon } from "src/app/models/polygon/polygon.model";
import { Point } from "src/app/models/ray/point.model";
import { Line } from "src/app/models/ray/line.model";
import { LatLngBounds } from "leaflet";
declare var L;

@Injectable({
  providedIn: "root",
})
export class GridService {
  // Amount of cells
  gridX = 100;
  gridY = 100;

  grid: OscarMinItem[][][];

  resolutionX: number;
  resolutionY: number;

  gridBBox: LatLngBounds;

  minLat = 100000;
  minLon = 100000;
  maxLat = -100000;
  maxLon = -100000;

  constructor(private itemStoreService: ItemStoreService) {}

  /**
   * Build the grid
   */
  buildGrid() {
    /**
     * Calculate the grid bounds is necessary before building the grid
     */
    this.getGridBounds();

    /**
     * Initialize the grid as 2d array with OscarMinItem arrays as elements
     */
    this.grid = Array.from({ length: this.gridX }, () =>
      Array.from({ length: this.gridY }, () => [])
    );

    /**
     * Iterating over all items and storing them in the right cell of the grid
     */
    for (const item of this.itemStoreService.items) {
      const latGridPos = this.getLatPositionInGrid(item.lat);
      const lonGridPos = this.getLonPositionInGrid(item.lon);
      this.grid[latGridPos][lonGridPos].push(item);
    }
  }

  /**
   * Calculates the grid bounds and resolution based on the the items received from the Server
   */
  getGridBounds() {
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
   * Helper function to determine the right cell for an item in the grid
   * @param lat
   * @returns x index in the grid for the given latitude
   */
  getLatPositionInGrid(lat: number): number {
    return Math.round((lat - this.minLat) / this.resolutionX);
  }

  /**
   * Helper function to determine the right cell for an item in the grid
   * @param lon
   * @returns y index in the grid for the given longitude
   */
  getLonPositionInGrid(lon: number): number {
    return Math.round((lon - this.minLon) / this.resolutionY);
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
    heatmap: boolean
  ): OscarMinItem[] {
    const currentMinItems: OscarMinItem[] = [];

    /**
     * Check whether the corners of BBcurrent are outside the grids bounding box and puts them on the edge of the grid if so.
     */
    if (minLat < this.minLat) minLat = this.minLat;
    if (minLon < this.minLon) minLon = this.minLon;
    if (maxLat > this.maxLat) maxLat = this.maxLat;
    if (maxLon > this.maxLon) maxLon = this.maxLon;

    /**
     * Determine the positions of the corners inside the grid.
     */
    const minLonPos = this.getLonPositionInGrid(minLon);
    const minLatPos = this.getLatPositionInGrid(minLat);
    const maxLonPos = this.getLonPositionInGrid(maxLon);
    const maxLatPos = this.getLatPositionInGrid(maxLat);

    // adding all items that in the bounding box for sure
    for (let i = minLatPos + 1; i < maxLatPos; i++) {
      for (let j = minLonPos + 1; j < maxLonPos; j++) {
        for (const item of this.grid[i][j]) {
          currentMinItems.push(item);
        }
      }
    }
    /**
     * Check every item in the same cell as the corners of BBCurrent and determine whether they are inside or outside of it.
     * Add all items, which are inside of BBCurrent.
     */
    // let itemsOnEdge = this.grid[minLatPos].concat(
    //   this.grid[maxLatPos],
    //   this.grid[minLonPos],
    //   this.grid[maxLonPos]
    // );
    // console.log(itemsOnEdge);
    // for (const edgeArray of itemsOnEdge) {
    //   for (const item of edgeArray) {
    //     if (
    //       item.lat + item.boundingRadius > minLat &&
    //       item.lat - item.boundingRadius < maxLat &&
    //       item.lon - item.boundingRadius < maxLon &&
    //       item.lon + item.boundingRadius > minLon
    //     ) {
    //       currentMinItems.push(item);
    //     }
    //   }
    // }

    for (let j = minLonPos; j < maxLonPos + 1; j++) {
      for (const item of this.grid[minLatPos][j]) {
        if (
          item.lat + item.boundingRadius > minLat &&
          item.lat - item.boundingRadius < maxLat &&
          item.lon - item.boundingRadius < maxLon &&
          item.lon + item.boundingRadius > minLon
        ) {
          currentMinItems.push(item);
        }
      }
    }
    for (let j = minLonPos; j < maxLonPos + 1; j++) {
      for (const item of this.grid[maxLatPos][j]) {
        if (
          item.lat + item.boundingRadius > minLat &&
          item.lat - item.boundingRadius < maxLat &&
          item.lon - item.boundingRadius < maxLon &&
          item.lon + item.boundingRadius > minLon
        ) {
          currentMinItems.push(item);
        }
      }
    }
    for (let i = minLatPos + 1; i < maxLatPos; i++) {
      for (const item of this.grid[i][minLonPos]) {
        if (
          item.lat + item.boundingRadius > minLat &&
          item.lat - item.boundingRadius < maxLat &&
          item.lon - item.boundingRadius < maxLon &&
          item.lon + item.boundingRadius > minLon
        ) {
          currentMinItems.push(item);
        }
      }
    }
    for (let i = minLatPos + 1; i < maxLatPos; i++) {
      for (const item of this.grid[i][maxLonPos]) {
        if (
          item.lat + item.boundingRadius > minLat &&
          item.lat - item.boundingRadius < maxLat &&
          item.lon - item.boundingRadius < maxLon &&
          item.lon + item.boundingRadius > minLon
        ) {
          currentMinItems.push(item);
        }
      }
    }
    return currentMinItems;
  }

  checkInside(polygon: Polygon) {
    var polygonCoordinates: Point[] = [];
    polygon.polygonNodes.forEach((node) => {
      var gridPoint = new Point();
      // gridPoint.x = this.getLatPositionInGrid(node.lat);
      gridPoint.x = (node.lat - this.minLat) / this.resolutionX;
      // gridPoint.y = this.getLonPositionInGrid(node.lon);
      gridPoint.y = (node.lon - this.minLon) / this.resolutionY;
      polygonCoordinates.push(gridPoint);
      console.log(polygonCoordinates);
    });
    for (let i = 0; i < this.grid.length; i++) {
      for (let j = 0; j < this.grid[i].length; j++) {
        var counter = 0;
        var startingPoint = new Point(i, j);
        var endingPoint = new Point(110, j);
        var infiniteLine = new Line(startingPoint, endingPoint);
        for (var k = 0; k < polygonCoordinates.length; k++) {
          var border = new Line(
            polygonCoordinates[k],
            polygonCoordinates[(k + 1) % polygonCoordinates.length]
          );

          if (this.checkIntersect(infiniteLine, border)) {
            counter++;
          }
        }

        if (counter % 2 == 0) {
          this.grid[i][j] = [];
        }
      }
    }
  }
  checkIntersect(infiniteLine: Line, border: Line) {
    let dir1 = this.orientation(
      infiniteLine.startingPoint,
      infiniteLine.endingPoint,
      border.startingPoint
    );
    let dir2 = this.orientation(
      infiniteLine.startingPoint,
      infiniteLine.endingPoint,
      border.endingPoint
    );
    let dir3 = this.orientation(
      border.startingPoint,
      border.endingPoint,
      infiniteLine.startingPoint
    );
    let dir4 = this.orientation(
      border.startingPoint,
      border.endingPoint,
      infiniteLine.endingPoint
    );

    // When intersecting
    if (dir1 != dir2 && dir3 != dir4) return true;

    // When p2 of line2 are on the line1
    if (dir1 == 0 && this.onLine(infiniteLine, border.startingPoint))
      return true;

    // When p1 of line2 are on the line1
    if (dir2 == 0 && this.onLine(infiniteLine, border.endingPoint)) return true;

    // When p2 of line1 are on the line2
    if (dir3 == 0 && this.onLine(border, infiniteLine.startingPoint))
      return true;

    // When p1 of line1 are on the line2
    if (dir4 == 0 && this.onLine(border, infiniteLine.endingPoint)) return true;

    return false;
  }
  orientation(a, b, c) {
    var val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);

    if (val == 0) return 0;
    return val > 0 ? 1 : 2;
  }
  onLine(l1, p) {
    if (
      p.x <= Math.max(l1.startingPoint.x, l1.endingPoint.x) &&
      p.x <= Math.min(l1.startingPoint.x, l1.endingPoint.x) &&
      p.y <= Math.max(l1.startingPoint.y, l1.endingPoint.y) &&
      p.y <= Math.min(l1.startingPoint.y, l1.endingPoint.y)
    )
      return true;

    return false;
  }

  deleteGrid() {
    this.grid = [];
  }
}
