import { OscarMinItem } from "../oscar/oscar-min-item";
import { LatLngBounds } from "leaflet";
import { Polygon } from "src/app/models/polygon/polygon.model";
import { Point } from "src/app/models/ray/point.model";
import { Line } from "src/app/models/ray/line.model";
import { Cell } from "src/app/models/cell/cell.model";
import { max, mean } from "lodash";

declare var L;

export class Grid {
  grid: OscarMinItem[][][];
  gridBBox: LatLngBounds;
  gridX: number;
  gridY: number;
  cellDiameter: number;

  minLat: number = 100000;
  maxLat: number = -100000;
  minLng: number = 100000;
  maxLng: number = -100000;

  currentMinLat: number;
  currentMaxLat: number;
  currentMinLng: number;
  currentMaxLng: number;

  currentMinLatPos: number;
  currentMaxLatPos: number;
  currentMinLngPos: number;
  currentMaxLngPos: number;

  resolutionX: number;
  resolutionY: number;

  maxItemsCell: number;
  items: OscarMinItem[];

  constructor(items: OscarMinItem[], gridX: number, gridY: number) {
    this.items = items;
    this.gridX = gridX;
    this.gridY = gridY;
    if (this.items.length > 0) this.buildGrid();
  }

  /**
   * Calculates the grid bounds and resolution based on the items received from the Server
   */
  private buildGrid() {
    /**
     * Determine the bounding box by iterating over all items
     */
    for (const item of this.items) {
      if (item.lat - item.boundingRadius < this.minLat)
        this.minLat = item.lat - item.boundingRadius;

      if (item.lat + item.boundingRadius > this.maxLat)
        this.maxLat = item.lat + item.boundingRadius;

      if (item.lng - item.boundingRadius < this.minLng)
        this.minLng = item.lng - item.boundingRadius;

      if (item.lng + item.boundingRadius > this.maxLng)
        this.maxLng = item.lng + item.boundingRadius;
    }

    /**
     * Store the bounding box in the gridBBox variable
     * @type {L.LatLngBounds}
     */
    this.gridBBox = new L.latLngBounds(
      L.latLng(this.minLat, this.minLng),
      L.latLng(this.maxLat, this.maxLng)
    );
    /**
     * Calculate and store the X-axis resolution
     * @type {number}
     */

    let distanceLat = Math.abs(this.maxLat - this.minLat);
    this.resolutionX = distanceLat / (this.gridX - 1);

    /**
     * Calculate and store the Y-axis resolution
     * @type {number}
     */
    let distanceLng = Math.abs(this.maxLng - this.minLng);
    this.resolutionY = distanceLng / (this.gridY - 1);

    this.cellDiameter =
      2000 * 111.3 * max([this.resolutionX, this.resolutionY]);

    this.grid = Array.from({ length: this.gridX }, () =>
      Array.from({ length: this.gridY }, () => [])
    );
    for (const item of this.items) {
      let minLatGridPos = this.getLatPositionInGrid(
        item.lat - item.boundingRadius
      );
      let maxLatGridPos = this.getLatPositionInGrid(
        item.lat + item.boundingRadius
      );

      let minLngGridPos = this.getLngPositionInGrid(
        item.lng - item.boundingRadius
      );
      let maxLngGridPos = this.getLngPositionInGrid(
        item.lng + item.boundingRadius
      );

      for (let i = minLatGridPos; i <= maxLatGridPos; i++) {
        for (let j = minLngGridPos; j <= maxLngGridPos; j++) {
          let latGridPos = i;
          if (latGridPos >= this.gridX) latGridPos = this.gridX - 1;
          if (latGridPos < 0) latGridPos = 0;
          let lngGridPos = j;
          if (lngGridPos >= this.gridY) lngGridPos = this.gridY - 1;
          if (lngGridPos < 0) lngGridPos = 0;
          this.grid[latGridPos][lngGridPos].push(item);
        }
      }
    }
    // for (const item of this.items) {
    //   let latGridPos = this.getLatPositionInGrid(item.lat);
    //   let lngGridPos = this.getLngPositionInGrid(item.lng);

    //   this.grid[latGridPos][lngGridPos].push(item);
    // }
  }

  /**
   * Helper function to determine the right cell for an item in the grid
   * @param lat
   * @returns x index in the grid for the given latitude
   */
  getLatPositionInGrid(lat: number) {
    return Math.floor(Math.abs(lat - this.minLat) / this.resolutionX);
  }

  /**
   * Helper function to determine the right cell for an item in the grid
   * @param lng
   * @returns y index in the grid for the given lnggitude
   */
  getLngPositionInGrid(lng: number) {
    return Math.floor(Math.abs(lng - this.minLng) / this.resolutionY);
  }

  getPositionInGrid(lng: number, lat: number) {
    return {
      x: Math.floor((lat - this.minLat) / this.resolutionX),
      y: Math.floor((lng - this.minLng) / this.resolutionY),
    };
  }

  getLatCenter(gridLatPosition: number) {
    return (
      gridLatPosition * this.resolutionX + this.minLat + 0.5 * this.resolutionX
    );
  }
  getLngCenter(gridLngPosition: number) {
    return (
      gridLngPosition * this.resolutionY + this.minLng + 0.5 * this.resolutionY
    );
  }

  updateCurrentBBox(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number
  ): void {
    if (minLat < this.minLat) minLat = this.minLat;
    else if (minLat > this.maxLat) minLat = this.maxLat;

    if (minLng < this.minLng) minLng = this.minLng;
    else if (minLng > this.maxLng) minLng = this.maxLng;

    if (maxLat > this.maxLat) maxLat = this.maxLat;
    else if (maxLat < this.minLat) maxLat = this.minLat;

    if (maxLng > this.maxLng) maxLng = this.maxLng;
    else if (maxLng < this.minLng) maxLng = this.minLng;

    this.currentMinLat = minLat;
    this.currentMinLng = minLng;
    this.currentMaxLat = maxLat;
    this.currentMaxLng = maxLng;

    this.currentMinLatPos = this.getLatPositionInGrid(this.currentMinLat);
    this.currentMinLngPos = this.getLngPositionInGrid(this.currentMinLng);
    this.currentMaxLatPos = this.getLatPositionInGrid(this.currentMaxLat);
    this.currentMaxLngPos = this.getLngPositionInGrid(this.currentMaxLng);
  }

  currentlyInsideLocalGridZone(): boolean {
    if (
      this.currentMaxLatPos - this.currentMinLatPos <= 10 &&
      this.currentMaxLngPos - this.currentMinLngPos <= 10
    ) {
      console.log("local");
      return true;
    }
    console.log("global");
    return false;
  }

  getCurrentItems() {
    const currentCells: Cell[] = [];
    const currentMinItems: OscarMinItem[] = [];

    for (let i = this.currentMinLatPos + 1; i < this.currentMaxLatPos; i++) {
      for (let j = this.currentMinLngPos + 1; j < this.currentMaxLngPos; j++) {
        let lats = [];
        let lngs = [];
        for (const item of this.grid[i][j]) {
          lats.push(item.lat);
          lngs.push(item.lng);
          currentMinItems.push(item);
        }
        if (lats.length !== 0)
          currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
      }
    }
    for (let j = this.currentMinLngPos; j <= this.currentMaxLngPos; j++) {
      let lats = [];
      let lngs = [];
      for (const item of this.grid[this.currentMinLatPos][j]) {
        if (item !== undefined && item !== null && this.itemInside(item)) {
          lats.push(item.lat);
          lngs.push(item.lng);
          currentMinItems.push(item);
        }
      }
      if (lats.length !== 0)
        currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));

      if (this.currentMinLatPos !== this.currentMaxLatPos) {
        let lats = [];
        let lngs = [];
        for (const item of this.grid[this.currentMaxLatPos][j]) {
          if (item !== undefined && item !== null && this.itemInside(item)) {
            lats.push(item.lat);
            lngs.push(item.lng);
            currentMinItems.push(item);
          }
        }
        if (lats.length !== 0)
          currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
      }
    }
    for (
      let i = this.currentMinLatPos + 1;
      i <= this.currentMaxLatPos - 1;
      i++
    ) {
      let lats = [];
      let lngs = [];
      for (const item of this.grid[i][this.currentMinLngPos]) {
        if (item !== undefined && item !== null && this.itemInside(item)) {
          lats.push(item.lat);
          lngs.push(item.lng);
          currentMinItems.push(item);
        }
      }
      if (lats.length !== 0)
        currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));

      if (this.currentMinLngPos !== this.currentMaxLngPos) {
        let lats = [];
        let lngs = [];
        for (const item of this.grid[i][this.currentMaxLngPos]) {
          if (item !== undefined && item !== null && this.itemInside(item)) {
            lats.push(item.lat);
            lngs.push(item.lng);
            currentMinItems.push(item);
          }
        }
        if (lats.length !== 0)
          currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
      }
    }
    return { items: currentMinItems, cells: currentCells };
  }
  itemInside(item: OscarMinItem) {
    if (
      item.lat - item.boundingRadius < this.currentMaxLat &&
      item.lat + item.boundingRadius > this.currentMinLat &&
      item.lng - item.boundingRadius < this.currentMaxLng &&
      item.lng + item.boundingRadius > this.currentMinLng
    ) {
      return true;
    }

    return false;
  }
  checkBounds(minLat: number, minLng: number, maxLat: number, maxLng: number) {
    if (
      minLat <= this.minLat ||
      minLng <= this.minLng ||
      maxLat >= this.maxLat ||
      maxLng >= this.maxLng
    ) {
      return false;
    }
    return true;
  }
  checkInside(polygon: Polygon) {
    var polygonCoordinates: Point[] = [];
    var polygonTrueCoordinates: Point[] = [];
    polygon.polygonNodes.forEach((node) => {
      var gridPoint = new Point();
      gridPoint.x = (node.lat - this.minLat) / this.resolutionX;
      gridPoint.y = (node.lng - this.minLng) / this.resolutionY;
      polygonCoordinates.push(gridPoint);
    });
    polygon.polygonNodes.forEach((node) => {
      var gridPoint = new Point();
      gridPoint.x = node.lat;
      gridPoint.y = node.lng;
      polygonTrueCoordinates.push(gridPoint);
    });
    for (let i = 0; i < this.grid.length; i++) {
      for (let j = 0; j < this.grid[i].length; j++) {
        let cornerInside = 0;
        for (let a = i; a <= i + 1; a++) {
          for (let b = j; b <= j + 1; b++) {
            var counter = 0;
            const startingPoint = new Point(a, b);
            const endingPoint = new Point(this.gridX + 1, b);
            const infiniteLine = new Line(startingPoint, endingPoint);
            for (var k = 0; k < polygonCoordinates.length; k++) {
              var border = new Line(
                polygonCoordinates[k],
                polygonCoordinates[(k + 1) % polygonCoordinates.length]
              );

              if (this.checkIntersect(infiniteLine, border)) {
                counter++;
              }
            }

            if (counter % 2 == 1) {
              cornerInside++;
            }
          }
        }
        if (cornerInside == 0) {
          this.grid[i][j] = [];
        } else if (cornerInside < 4) {
          let elementsOutside = [];
          for (const item of this.grid[i][j]) {
            var counter = 0;
            const startingPoint = new Point(item.lat, item.lng);
            const endingPoint = new Point(181, item.lng);
            const infiniteLine = new Line(startingPoint, endingPoint);
            for (var k = 0; k < polygonTrueCoordinates.length; k++) {
              var border = new Line(
                polygonTrueCoordinates[k],
                polygonTrueCoordinates[(k + 1) % polygonTrueCoordinates.length]
              );

              if (this.checkIntersect(infiniteLine, border)) {
                counter++;
              }
            }

            if (counter % 2 == 0) {
              elementsOutside.push(item);
            }
          }
          this.grid[i][j] = this.grid[i][j].filter(
            (el) => !elementsOutside.includes(el)
          );
        }
      }
    }
    let itemsInGrid: OscarMinItem[] = [];
    for (let i = 0; i < this.grid.length; i++) {
      for (let j = 0; j < this.grid[i].length; j++) {
        for (let k = 0; k < this.grid[i][j].length; k++) {
          itemsInGrid.push(this.grid[i][j][k]);
        }
      }
    }
    return itemsInGrid;
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
}
