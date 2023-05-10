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
  gridMap = new Map<string, OscarMinItem[]>();
  gridSizeY = 3600;
  gridSizeX = 1800;
  private buildStatus = false;
  // divide lat and long fields by gridSize lat = [-90, +90] long = [-180,180]
  divLat = 18 / this.gridSizeX;
  divLon = 36 / this.gridSizeY;
  constructor(private itemStoreService: ItemStoreService) {}
  buildGrid() {
    this.gridMap = new Map<string, OscarMinItem[]>();
    for (const item of this.itemStoreService.items) {
      const latGridPos = this.getLatPositionInGrid(item.lat);
      const lonGridPos = this.getLonPositionInGrid(item.lon);
      if (
        !this.gridMap.has(JSON.stringify({ lat: latGridPos, lon: lonGridPos }))
      ) {
        this.gridMap.set(
          JSON.stringify({ lat: latGridPos, lon: lonGridPos }),
          new Array<OscarMinItem>()
        );
      }
      this.gridMap
        .get(JSON.stringify({ lat: latGridPos, lon: lonGridPos }))
        .push(item);
    }
    this.buildStatus = true;
  }
  getCurrentItems(
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number,
    heatmap: boolean
  ): OscarMinItem[] {
    const currentMinItems: OscarMinItem[] = [];
    const bbox = {
      minLonPos: minLon / this.divLon,
      minLatPos: minLat / this.divLat,
      maxLonPos: maxLon / this.divLon,
      maxLatPos: maxLat / this.divLat,
    };
    this.gridMap.forEach((value, key) => {
      const keyObj = JSON.parse(key) as { lat: number; lon: number };

      if (
        keyObj.lat >= bbox.minLatPos - 1 &&
        keyObj.lon >= bbox.minLonPos - 1 &&
        keyObj.lat <= bbox.maxLatPos &&
        keyObj.lon <= bbox.maxLonPos
      ) {
        if (
          keyObj.lat < bbox.minLatPos ||
          keyObj.lon < bbox.minLonPos ||
          keyObj.lat > bbox.maxLatPos - 1
        ) {
          value.forEach((item) => {
            if (item) {
              if (
                !heatmap &&
                item.lat + item.boundingRadius >= minLat &&
                item.lon + item.boundingRadius >= minLon &&
                item.lat - item.boundingRadius <= maxLat &&
                item.lon - item.boundingRadius <= maxLon
              ) {
                currentMinItems.push(item);
              }
              if (
                heatmap &&
                item.lat >= minLat &&
                item.lon >= minLon &&
                item.lat <= maxLat &&
                item.lon <= maxLon
              )
                currentMinItems.push(item);
            }
          });
        } else {
          currentMinItems.push(...value);
        }
      }
    });
    return currentMinItems;
  }
  getLatPositionInGrid(lat: number): number {
    // calculate distance from the first cell in the grid divided by the divisor("resolution") and rounded down
    return Math.round(lat / this.divLat);
  }
  getLonPositionInGrid(lon: number): number {
    // calculate distance from the first cell in the grid divided by the divisor("resolution") and rounded down
    return Math.round(lon / this.divLon);
  }
  getBBox(): L.LatLngBounds {
    let minLat = 100000;
    let minLon = 100000;
    let maxLat = -100000;
    let maxLon = -100000;
    this.gridMap.forEach((value, key) => {
      value.forEach((e) => {
        if (e.lat < minLat) {
          minLat = e.lat;
        }
        if (e.lon < minLon) {
          minLon = e.lon;
        }
        if (e.lat > maxLat) {
          maxLat = e.lat;
        }
        if (e.lon > maxLon) {
          maxLon = e.lon;
        }
      });
    });
    const southWest = L.latLng(minLat, minLon);
    const northEast = L.latLng(maxLat, maxLon);
    return new L.latLngBounds(southWest, northEast);
  }
  clearGridMap() {
    this.gridMap.clear();
  }
  //polygonCoordinates davor umwandeln
  checkInside(polygon: Polygon) {
    var polygonCoordinates: Point[] = [];
    polygon.polygonNodes.forEach((node) => {
      var gridPoint = new Point();
      // make a function
      // gridPoint.x = this.getLatPositionInGrid(node.lat);
      // gridPoint.y = this.getLonPositionInGrid(node.lon);`
      gridPoint.x = node.lat / this.divLat;
      gridPoint.y = node.lon / this.divLon;
      polygonCoordinates.push(gridPoint);
    });
    this.gridMap.forEach((value: OscarMinItem[], key: string) => {
      var counter = 0;
      var cellCoords = JSON.parse(key);
      var startingPoint = new Point(cellCoords.lat, cellCoords.lon);
      var endingPoint = new Point(1800, cellCoords.lon);
      var infiniteLine = new Line(startingPoint, endingPoint);
      for (var i = 0; i < polygonCoordinates.length; i++) {
        var border = new Line(
          polygonCoordinates[i],
          polygonCoordinates[(i + 1) % polygonCoordinates.length]
        );

        if (this.checkIntersect(infiniteLine, border)) {
          counter++;
        }
      }

      if (counter % 2 == 0) {
        this.gridMap.delete(key);
      }
    });
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
