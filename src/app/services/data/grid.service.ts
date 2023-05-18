import { Injectable } from "@angular/core";
import { ItemCountComponent } from "src/app/components/item-count/item-count.component";
import { OscarMinItem } from "../../models/oscar/oscar-min-item";
import { ItemStoreService } from "./item-store.service";
import { Polygon } from "src/app/models/polygon/polygon.model";
import { Point } from "src/app/models/ray/point.model";
import { Line } from "src/app/models/ray/line.model";
declare var L;

@Injectable({
  providedIn: "root",
})
export class GridService {
  gridX = 100;
  gridY = 100;
  grid: OscarMinItem[][][];
  resolutionX: number;
  resolutionY: number;
  gridBBox;
  minLat = 100000;
  minLon = 100000;
  maxLat = -100000;
  maxLon = -100000;

  constructor(private itemStoreService: ItemStoreService) {}

  getGridBounds() {
    for (const item of this.itemStoreService.items) {
      if (item.lat < this.minLat) this.minLat = item.lat;

      if (item.lat > this.maxLat) this.maxLat = item.lat;

      if (item.lon < this.minLon) this.minLon = item.lon;

      if (item.lon > this.maxLon) this.maxLon = item.lon;
    }
    this.gridBBox = new L.latLngBounds(
      L.latLng(this.minLat, this.minLon),
      L.latLng(this.maxLat, this.maxLon)
    );
    let distanceLat = this.maxLat - this.minLat;
    let distanceLon = this.maxLon - this.minLon;
    this.resolutionX = distanceLat / (this.gridX - 1);
    this.resolutionY = distanceLon / (this.gridY - 1);
  }

  buildGrid() {
    this.grid = Array.from({ length: this.gridX }, () =>
      Array.from({ length: this.gridY }, () => [])
    );
    console.time("bbox");
    this.getGridBounds();
    console.time("bbox");
    for (const item of this.itemStoreService.items) {
      const latGridPos = this.getLatPositionInGrid(item.lat);
      const lonGridPos = this.getLonPositionInGrid(item.lon);
      this.grid[latGridPos][lonGridPos].push(item);
    }
  }
  // gridMap = new Map<string, OscarMinItem[]>();
  // gridSizeY = 3600;
  // gridSizeX = 1800;
  // private buildStatus = false;
  // // divide lat and long fields by gridSize lat = [-90, +90] long = [-180,180]
  // divLat = 18 / this.gridSizeX;
  // divLon = 36 / this.gridSizeY;

  // buildGrid() {
  //   this.gridMap = new Map<string, OscarMinItem[]>();
  //   for (const item of this.itemStoreService.items) {
  //     const latGridPos = this.getLatPositionInGrid(item.lat);
  //     const lonGridPos = this.getLonPositionInGrid(item.lon);
  //     if (
  //       !this.gridMap.has(JSON.stringify({ lat: latGridPos, lon: lonGridPos }))
  //     ) {
  //       this.gridMap.set(
  //         JSON.stringify({ lat: latGridPos, lon: lonGridPos }),
  //         new Array<OscarMinItem>()
  //       );
  //     }
  //     this.gridMap
  //       .get(JSON.stringify({ lat: latGridPos, lon: lonGridPos }))
  //       .push(item);
  //   }
  //   this.buildStatus = true;
  // }
  getCurrentItems(
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number,
    heatmap: boolean
  ): OscarMinItem[] {
    const currentMinItems: OscarMinItem[] = [];
    if (minLat < this.minLat) minLat = this.minLat;
    if (minLon < this.minLon) minLon = this.minLon;
    if (maxLat > this.maxLat) maxLat = this.maxLat;
    if (maxLon > this.maxLon) maxLon = this.maxLon;

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
    for (let j = minLonPos; j < maxLonPos + 1; j++) {
      for (const item of this.grid[minLatPos][j]) {
        if (
          item.lat + item.boundingRadius > minLat &&
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
        if (item.lon + item.boundingRadius > minLon) {
          currentMinItems.push(item);
        }
      }
    }
    for (let i = minLatPos + 1; i < maxLatPos; i++) {
      for (const item of this.grid[i][maxLonPos]) {
        if (item.lon - item.boundingRadius < maxLon) {
          currentMinItems.push(item);
        }
      }
    }
    return currentMinItems;
  }
  getLatPositionInGrid(lat: number): number {
    // calculate distance from the first cell in the grid divided by the divisor("resolution") and rounded down
    // return Math.round(lat / this.divLat);
    return Math.round((lat - this.minLat) / this.resolutionX);
  }
  getLonPositionInGrid(lon: number): number {
    // calculate distance from the first cell in the grid divided by the divisor("resolution") and rounded down
    return Math.round((lon - this.minLon) / this.resolutionY);
  }
  // getBBox(): L.LatLngBounds {
  //   let minLat = 100000;
  //   let minLon = 100000;
  //   let maxLat = -100000;
  //   let maxLon = -100000;
  //   this.gridMap.forEach((value, key) => {
  //     value.forEach((e) => {
  //       if (e.lat < minLat) {
  //         minLat = e.lat;
  //       }
  //       if (e.lon < minLon) {
  //         minLon = e.lon;
  //       }
  //       if (e.lat > maxLat) {
  //         maxLat = e.lat;
  //       }
  //       if (e.lon > maxLon) {
  //         maxLon = e.lon;
  //       }
  //     });
  //   });
  //   const southWest = L.latLng(minLat, minLon);
  //   const northEast = L.latLng(maxLat, maxLon);
  //   return new L.latLngBounds(southWest, northEast);
  // }
  clearGridMap() {
    this.grid = [];
  }
  //polygonCoordinates davor umwandeln
  checkInside(polygon: Polygon) {
    var polygonCoordinates: Point[] = [];
    polygon.polygonNodes.forEach((node) => {
      var gridPoint = new Point();
      // make a function
      // gridPoint.x = this.getLatPositionInGrid(node.lat);
      // gridPoint.y = this.getLonPositionInGrid(node.lon);`
      gridPoint.x = this.getLatPositionInGrid(node.lat);
      gridPoint.y = this.getLonPositionInGrid(node.lon);
      polygonCoordinates.push(gridPoint);
    });
    for (let i = 0 + 1; i < this.grid.length; i++) {
      for (let j = 0 + 1; j < this.grid[i].length; j++) {
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
}
