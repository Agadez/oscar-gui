import { OscarMinItem } from "../oscar/oscar-min-item";
import { Bounds, LatLngBounds } from "leaflet";
import { Polygon } from "src/app/models/polygon/polygon.model";
import { Point } from "src/app/models/ray/point.model";
import { Line } from "src/app/models/ray/line.model";
import { Cell } from "src/app/models/cell/cell.model";
import { indexOf, max, mean } from "lodash";
import { Map as LeafletMap } from "leaflet";

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

  currentMinXPos: number;
  currentMaxXPos: number;
  currentMinYPos: number;
  currentMaxYPos: number;

  resolutionX: number;
  resolutionY: number;

  maxItemsCell: number;
  items: OscarMinItem[];

  map: LeafletMap;
  zoom: number;
  viewBound: Bounds;

  scale: number = 10;

  constructor(items: OscarMinItem[], map: LeafletMap) {
    this.items = items;
    this.map = map;
    // this.scale = scale;
    // if (this.items.length > 0) this.buildProjectedGrid();
  }

  buildProjectedGrid() {
    let size = this.map.getSize();
    this.zoom = this.map.getZoom();
    this.viewBound = this.map.getPixelBounds();
    this.viewBound.min.x = Math.round(this.viewBound.min.x);
    this.viewBound.min.y = Math.round(this.viewBound.min.y);
    console.log(size);
    this.gridX = Math.floor(size.x / this.scale);
    this.gridY = Math.floor(size.y / this.scale);
    this.grid = Array.from({ length: this.gridX }, () =>
      Array.from({ length: this.gridY }, () => [])
    );
    this.currentMinXPos = 0;
    this.currentMaxXPos = this.gridX - 1;
    this.currentMinYPos = 0;
    this.currentMaxYPos = this.gridY - 1;
    for (const item of this.items) {
      let point = L.CRS.EPSG3857.latLngToPoint(
        L.latLng(item.lat, item.lng),
        this.zoom
      );
      let xPos = this.getXPositionInGrid(point.x);
      let yPos = this.getYPositionInGrid(point.y);
      if (
        xPos >= this.currentMinXPos &&
        xPos <= this.currentMaxXPos &&
        yPos >= this.currentMinYPos &&
        yPos <= this.currentMaxYPos
      ) {
        this.grid[xPos][yPos].push(item);
      }
    }
  }

  getXPositionInGrid(x: number) {
    return Math.floor((x - this.viewBound.min.x) / this.scale);
  }
  getYPositionInGrid(y: number) {
    return Math.floor((y - this.viewBound.min.y) / this.scale);
  }
  getCenterFromX(x, y) {
    return L.CRS.EPSG3857.pointToLatLng(
      L.point(
        x * this.scale + this.viewBound.min.x + 0.5 * this.scale,
        y * this.scale + this.viewBound.min.y + 0.5 * this.scale
      ),
      this.zoom
    );
  }

  updateCurrentBBox(
    south: number,
    west: number,
    north: number,
    east: number
  ): void {
    this.currentMinLat = south;
    this.currentMinLng = west;
    this.currentMaxLat = north;
    this.currentMaxLng = east;

    let northWest = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(north, west),
      this.zoom
    );
    let southEast = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(south, east),
      this.zoom
    );
    this.currentMinXPos = this.getXPositionInGrid(Math.round(northWest.x));
    this.currentMinYPos = this.getYPositionInGrid(Math.round(northWest.y));
    this.currentMaxXPos = this.getXPositionInGrid(Math.round(southEast.x));
    this.currentMaxYPos = this.getYPositionInGrid(Math.round(southEast.y));
    this.adjustPositions();
  }
  adjustPositions() {
    this.currentMinXPos =
      this.currentMinXPos < 0
        ? 0
        : this.currentMinXPos > this.gridX - 1
        ? this.gridX - 1
        : this.currentMinXPos;
    this.currentMaxXPos =
      this.currentMaxXPos < 0
        ? 0
        : this.currentMaxXPos > this.gridX - 1
        ? this.gridX - 1
        : this.currentMaxXPos;

    if (
      this.currentMinYPos > this.gridY - 1 &&
      this.currentMaxYPos <= this.gridY - 1
    ) {
      this.currentMinYPos = 0;
    }
    if (
      this.currentMinYPos > this.gridY - 1 &&
      this.currentMaxYPos > this.gridY - 1
    ) {
      this.currentMinYPos = this.currentMaxYPos = 0;
    }
    if (
      this.currentMinYPos <= this.gridY - 1 &&
      this.currentMaxYPos > this.gridY - 1
    ) {
      this.currentMaxYPos = this.gridY - 1;
    }
    this.currentMinYPos = this.currentMinYPos < 0 ? 0 : this.currentMinYPos;
    this.currentMaxYPos = this.currentMaxYPos < 0 ? 0 : this.currentMaxYPos;
  }
  currentlyInsideLocalGridZone(): boolean {
    if (
      this.currentMaxXPos - this.currentMinXPos <= this.gridX &&
      this.currentMaxYPos - this.currentMinYPos <= this.gridY
    ) {
      console.log("local Zone");

      return true;
    }
    console.log(this.gridX, this.gridY);
    console.log("global Zone");
    return false;
  }
  getCurrentItems() {
    const currentCells: Cell[] = [];
    const currentMinItems: OscarMinItem[] = [];
    
    for (let i = this.currentMinXPos + 1; i < this.currentMaxXPos; i++) {
      for (let j = this.currentMinYPos + 1; j < this.currentMaxYPos; j++) {
        let lats = [];
        let lngs = [];
        for (const item of this.grid[i][j]) {
          lats.push(item.lat);
          lngs.push(item.lng);
          currentMinItems.push(item);
        }
        if (lats.length !== 0) {
          // currentCells.push(
          //   new Cell(
          //     this.getCenterFromX(i, j).lat,
          //     this.getCenterFromX(i, j).lng,
          //     lats.length
          //   )
          // );
          currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
        }
      }
    }
    for (let j = this.currentMinYPos; j <= this.currentMaxYPos; j++) {
      let lats = [];
      let lngs = [];
      for (const item of this.grid[this.currentMinXPos][j]) {
        if (item !== undefined && item !== null && this.itemInside(item)) {
          lats.push(item.lat);
          lngs.push(item.lng);
          currentMinItems.push(item);
        }
      }
      if (lats.length !== 0) {
        currentCells.push(
          new Cell(
            this.getCenterFromX(this.currentMinXPos, j).lat,
            this.getCenterFromX(this.currentMinXPos, j).lng,
            lats.length
          )
        );
        // currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
      }

      if (this.currentMinXPos !== this.currentMaxXPos) {
        let lats = [];
        let lngs = [];
        for (const item of this.grid[this.currentMaxXPos][j]) {
          if (item !== undefined && item !== null && this.itemInside(item)) {
            lats.push(item.lat);
            lngs.push(item.lng);
            currentMinItems.push(item);
          }
        }
        if (lats.length !== 0) {
          currentCells.push(
            new Cell(
              this.getCenterFromX(this.currentMaxXPos, j).lat,
              this.getCenterFromX(this.currentMaxXPos, j).lng,
              lats.length
            )
          );
          // currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
        }
      }
    }
    for (let i = this.currentMinXPos; i <= this.currentMaxXPos; i++) {
      let lats = [];
      let lngs = [];
      for (const item of this.grid[i][this.currentMinYPos]) {
        if (item !== undefined && item !== null && this.itemInside(item)) {
          lats.push(item.lat);
          lngs.push(item.lng);
          currentMinItems.push(item);
        }
      }
      if (lats.length !== 0) {
        currentCells.push(
          new Cell(
            this.getCenterFromX(i, this.currentMinYPos).lat,
            this.getCenterFromX(i, this.currentMinYPos).lng,
            lats.length
          )
        );
        // currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
      }

      if (this.currentMinYPos !== this.currentMaxYPos) {
        let lats = [];
        let lngs = [];
        for (const item of this.grid[i][this.currentMaxYPos]) {
          if (item !== undefined && item !== null && this.itemInside(item)) {
            lats.push(item.lat);
            lngs.push(item.lng);
            currentMinItems.push(item);
          }
        }
        if (lats.length !== 0) {
          currentCells.push(
            new Cell(
              this.getCenterFromX(i, this.currentMaxYPos).lat,
              this.getCenterFromX(i, this.currentMaxYPos).lng,
              lats.length
            )
          );
          // currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
        }
      }
    }
    return { items: currentMinItems, cells: currentCells };
  }
  itemInside(item: OscarMinItem) {
    if (
      item.lat - item.boundingRadius <= this.currentMaxLat &&
      item.lat + item.boundingRadius >= this.currentMinLat &&
      item.lng - item.boundingRadius <= this.currentMaxLng &&
      item.lng + item.boundingRadius >= this.currentMinLng
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
  haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const earthRadius = 6371000; // meters (mean radius of Earth)

    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = earthRadius * c;

    return distance;
  }
}
