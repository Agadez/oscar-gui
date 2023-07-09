import { OscarMinItem } from "../oscar/oscar-min-item";
import { LatLngBounds } from "leaflet";
import { Polygon } from "src/app/models/polygon/polygon.model";
import { Point } from "src/app/models/ray/point.model";
import { Line } from "src/app/models/ray/line.model";
import { Cell } from "src/app/models/cell/cell.model";

export class Grid {
  grid: OscarMinItem[][][];
  gridX: number;
  gridY: number;

  minLat: number;
  maxLat: number;
  minLatPos: number;
  maxLatPos: number;

  minLon: number;
  maxLon: number;
  minLonPos: number;
  maxLonPos: number;

  resolutionX: number;
  resolutionY: number;
  minResolution: number;

  imprecise: boolean;

  distInMeters: number;

  items: OscarMinItem[];

  constructor(
    items: OscarMinItem[],
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number,
    resolutionX?: number,
    resolutionY?: number,
    gridX?: number,
    gridY?: number,
    minResolution?: number
  ) {
    this.items = items;
    this.minLat = minLat;
    this.maxLat = maxLat;
    this.minLon = minLon;
    this.maxLon = maxLon;

    if (gridX && gridY && minResolution) {
      this.resolutionX = resolutionX;
      this.resolutionY = resolutionY;
      this.gridX = gridX;
      this.gridY = gridY;
      this.imprecise =
        resolutionX > minResolution || resolutionY > minResolution;
    } else {
      this.minResolution = minResolution;
      let distanceLat = maxLat - minLat;
      let distanceLon = maxLon - minLon;
      
      this.gridX = Math.ceil(distanceLat / minResolution) + 1;
      this.gridY = Math.ceil(distanceLon / minResolution) + 1;
      this.resolutionX = distanceLat / (this.gridX - 1);
      this.resolutionY = distanceLon / (this.gridY - 1);
    }
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

      let minLonGridPos = this.getLonPositionInGrid(
        item.lon - item.boundingRadius
      );
      let maxLonGridPos = this.getLonPositionInGrid(
        item.lon + item.boundingRadius
      );

      for (let i = minLatGridPos; i <= maxLatGridPos; i++) {
        for (let j = minLonGridPos; j <= maxLonGridPos; j++) {
          let latGridPos = i;
          if (latGridPos >= this.gridX) latGridPos = this.gridX - 1;
          if (latGridPos < 0) latGridPos = 0;
          let lonGridPos = j;
          if (lonGridPos >= this.gridY) lonGridPos = this.gridY - 1;
          if (lonGridPos < 0) lonGridPos = 0;
          this.grid[latGridPos][lonGridPos].push(item);
        }
      }
    }
  }

  /**
   * Helper function to determine the right cell for an item in the grid
   * @param lat
   * @returns x index in the grid for the given latitude
   */
  getLatPositionInGrid(lat: number) {
    return Math.floor((lat - this.minLat) / this.resolutionX);
  }

  /**
   * Helper function to determine the right cell for an item in the grid
   * @param lon
   * @returns y index in the grid for the given longitude
   */
  getLonPositionInGrid(lon: number) {
    return Math.floor((lon - this.minLon) / this.resolutionY);
  }

  getLatCenter(gridLatPosition: number) {
    return (
      gridLatPosition * this.resolutionX + this.minLat + 0.5 * this.resolutionX
    );
  }
  getLonCenter(gridLonPosition: number) {
    return (
      gridLonPosition * this.resolutionY + this.minLon + 0.5 * this.resolutionY
    );
  }

  getCurrentItems(
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number,
    withBoundingRadius: boolean
  ) {
    const currentCells: Cell[] = [];
    const currentMinItems: OscarMinItem[] = [];
    let minLonPos = this.getLonPositionInGrid(minLon);
    let minLatPos = this.getLatPositionInGrid(minLat);
    let maxLonPos = this.getLonPositionInGrid(maxLon);
    let maxLatPos = this.getLatPositionInGrid(maxLat);
    for (let i = minLatPos + 1; i < maxLatPos; i++) {
      for (let j = minLonPos + 1; j < maxLonPos; j++) {
        const currentCell = new Cell(
          this.getLatCenter(i),
          this.getLonCenter(j),
          0
        );
        for (const item of this.grid[i][j]) {
          if (
            this.itemInside(
              item,
              minLat,
              minLon,
              maxLat,
              maxLon,
              withBoundingRadius
            )
          ) {
            currentCell.numObjects += 1;
            currentMinItems.push(item);
          }
        }
        currentCells.push(currentCell);
      }
    }
    for (let j = minLonPos; j <= maxLonPos; j++) {
      for (const item of this.grid[minLatPos][j]) {
        if (
          this.itemInside(
            item,
            minLat,
            minLon,
            maxLat,
            maxLon,
            withBoundingRadius
          )
        ) {
          currentMinItems.push(item);
        }
      }
      if (minLatPos !== maxLatPos) {
        for (const item of this.grid[maxLatPos][j]) {
          if (
            this.itemInside(
              item,
              minLat,
              minLon,
              maxLat,
              maxLon,
              withBoundingRadius
            )
          ) {
            currentMinItems.push(item);
          }
        }
      }
    }
    for (let i = minLatPos + 1; i <= maxLatPos - 1; i++) {
      for (const item of this.grid[i][minLonPos]) {
        if (
          this.itemInside(
            item,
            minLat,
            minLon,
            maxLat,
            maxLon,
            withBoundingRadius
          )
        ) {
          currentMinItems.push(item);
        }
      }
      if (minLonPos !== maxLonPos) {
        for (const item of this.grid[i][maxLonPos]) {
          if (
            this.itemInside(
              item,
              minLat,
              minLon,
              maxLat,
              maxLon,
              withBoundingRadius
            )
          ) {
            currentMinItems.push(item);
          }
        }
      }
    }

    return { items: currentMinItems, cells: currentCells };
  }
  itemInside(
    item: OscarMinItem,
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number,
    withBoundingRadius: boolean
  ) {
    // if (item.lat == 48.805492877960205) {
    //   console.log(
    //     item.lat - item.boundingRadius < maxLat &&
    //       item.lat + item.boundingRadius > minLat &&
    //       item.lon - item.boundingRadius < maxLon &&
    //       item.lon + item.boundingRadius > minLon
    //   );
    //   console.log(item, item.boundingRadius);
    //   console.log(minLat, minLon, maxLat, maxLon);
    // }
    if (
      withBoundingRadius &&
      item.lat - item.boundingRadius < maxLat &&
      item.lat + item.boundingRadius > minLat &&
      item.lon - item.boundingRadius < maxLon &&
      item.lon + item.boundingRadius > minLon
    ) {
      return true;
    }
    if (
      !withBoundingRadius &&
      item.lat < maxLat &&
      item.lat > minLat &&
      item.lon < maxLon &&
      item.lon > minLon
    ) {
      return true;
    }
    return false;
  }
  checkBounds(minLat: number, minLon: number, maxLat: number, maxLon: number) {
    if (
      minLat <= this.minLat ||
      minLon <= this.minLon ||
      maxLat >= this.maxLat ||
      maxLon >= this.maxLon
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
      gridPoint.y = (node.lon - this.minLon) / this.resolutionY;
      polygonCoordinates.push(gridPoint);
    });
    polygon.polygonNodes.forEach((node) => {
      var gridPoint = new Point();
      gridPoint.x = node.lat;
      gridPoint.y = node.lon;
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
            const startingPoint = new Point(item.lat, item.lon);
            const endingPoint = new Point(181, item.lon);
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
