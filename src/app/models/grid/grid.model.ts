import { OscarMinItem } from "../oscar/oscar-min-item";
import { Bounds, LatLngBounds } from "leaflet";
import { Polygon } from "src/app/models/polygon/polygon.model";
import { Point } from "src/app/models/ray/point.model";
import { Line } from "src/app/models/ray/line.model";
import { Cell } from "src/app/models/cell/cell.model";
import { indexOf, maxBy, mean, minBy } from "lodash";
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
  }

  buildProjectedGrid() {
    let size = this.map.getSize();
    this.zoom = this.map.getZoom();
    this.viewBound = this.map.getPixelBounds();
    this.viewBound.min.x = Math.round(this.viewBound.min.x);
    this.viewBound.min.y = Math.round(this.viewBound.min.y);
    this.gridX = Math.floor(size.x / this.scale);
    this.gridY = Math.floor(size.y / this.scale);
    console.log("gridX:", this.gridX, "gridY:", this.gridY);
    this.grid = Array.from({ length: this.gridX }, () =>
      Array.from({ length: this.gridY }, () => [])
    );
    this.currentMinXPos = 0;
    this.currentMaxXPos = this.gridX - 1;
    this.currentMinYPos = 0;
    this.currentMaxYPos = this.gridY - 1;
    for (const item of this.items) {
      const { xPos, yPos } = this.itemsWithoutRadius(item);
      if (xPos !== -1) this.grid[xPos][yPos].push(item);

      // const bounds = this.itemsWithRadius(item);
      // for (let xPos = bounds.minXPos; xPos <= bounds.maxXPos; xPos++) {
      //   for (let yPos = bounds.minYPos; yPos <= bounds.maxYPos; yPos++) {
      //     this.grid[xPos][yPos].push(item);
      //   }
      // }
    }
  }
  itemsWithoutRadius(item: OscarMinItem) {
    const { xPos, yPos } = this.latLngToXYPosition(item.lat, item.lng);
    if (
      xPos >= this.currentMinXPos &&
      xPos <= this.currentMaxXPos &&
      yPos >= this.currentMinYPos &&
      yPos <= this.currentMaxYPos
    )
      return { xPos, yPos };
    else return { xPos: -1, yPos: -1 };
  }
  itemsWithRadius(item: OscarMinItem) {
    const minX = item.lat - item.boundingRadius;
    const minY = item.lng - item.boundingRadius;
    const maxX = item.lat + item.boundingRadius;
    const maxY = item.lng + item.boundingRadius;
    let minXPos = 0;
    let minYPos = 0;
    let maxXPos = 0;
    let maxYPos = 0;
    let potenialBoundPositions: { xPos: number; yPos: number }[] = [];
    potenialBoundPositions = this.checkPosition(
      this.latLngToXYPosition(minX, minY)
    )
      ? [...potenialBoundPositions, this.latLngToXYPosition(minX, minY)]
      : potenialBoundPositions;

    potenialBoundPositions = this.checkPosition(
      this.latLngToXYPosition(minX, maxY)
    )
      ? [...potenialBoundPositions, this.latLngToXYPosition(minX, maxY)]
      : potenialBoundPositions;

    potenialBoundPositions = this.checkPosition(
      this.latLngToXYPosition(maxX, minY)
    )
      ? [...potenialBoundPositions, this.latLngToXYPosition(maxX, minY)]
      : potenialBoundPositions;

    potenialBoundPositions = this.checkPosition(
      this.latLngToXYPosition(maxX, maxY)
    )
      ? [...potenialBoundPositions, this.latLngToXYPosition(maxX, maxY)]
      : potenialBoundPositions;

    if (potenialBoundPositions.length > 0) {
      minXPos = minBy(potenialBoundPositions, "xPos").xPos;
      maxXPos = maxBy(potenialBoundPositions, "xPos").xPos;
      minYPos = minBy(potenialBoundPositions, "yPos").yPos;
      maxYPos = maxBy(potenialBoundPositions, "yPos").yPos;
    }

    return {
      minXPos: minXPos,
      maxXPos: maxXPos,
      minYPos: minYPos,
      maxYPos: maxYPos,
    };
  }
  checkPosition({ xPos, yPos }) {
    if (
      xPos >= this.currentMinXPos &&
      xPos <= this.currentMaxXPos &&
      yPos >= this.currentMinYPos &&
      yPos <= this.currentMaxYPos
    )
      return true;
    return false;
  }
  latLngToXYPosition(lat, lng) {
    const point = L.CRS.EPSG3857.latLngToPoint(L.latLng(lat, lng), this.zoom);
    return {
      xPos: this.getXPositionInGrid(point.x),
      yPos: this.getYPositionInGrid(point.y),
    };
  }
  getXPositionInGrid(x: number) {
    return Math.floor((x - this.viewBound.min.x) / this.scale);
  }
  getYPositionInGrid(y: number) {
    return Math.floor((y - this.viewBound.min.y) / this.scale);
  }
  getRandomCenter(x, y) {
    return L.CRS.EPSG3857.pointToLatLng(
      L.point(
        x * this.scale + this.viewBound.min.x + Math.random() * this.scale,
        y * this.scale + this.viewBound.min.y + Math.random() * this.scale
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
  getCurrentItems() {
    const currentCells: Cell[] = [];
    const currentMinItems: OscarMinItem[] = [];

    console.log(this.currentMinXPos, this.currentMaxXPos);
    for (let i = this.currentMinXPos + 1; i < this.currentMaxXPos; i++) {
      for (let j = this.currentMinYPos + 1; j < this.currentMaxYPos; j++) {
        let lats = [];
        let lngs = [];
        for (const item of this.grid[i][j]) {
          Cell;
          lats.push(item.lat);
          lngs.push(item.lng);
          currentMinItems.push(item);
        }
        if (lats.length !== 0) {
          // currentCells.push(
          //   new Cell(
          //     this.getRandomCenter(i, j).lat,
          //     this.getRandomCenter(i, j).lng,
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
        // currentCells.push(
        //   new Cell(
        //     this.getRandomCenter(this.currentMinXPos, j).lat,
        //     this.getRandomCenter(this.currentMinXPos, j).lng,
        //     lats.length
        //   )
        // );
        currentCells.push();
        currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
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
          // currentCells.push(
          //   new Cell(
          //     this.getRandomCenter(this.currentMaxXPos, j).lat,
          //     this.getRandomCenter(this.currentMaxXPos, j).lng,
          //     lats.length
          //   )
          // );
          currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
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
        // currentCells.push(
        //   new Cell(
        //     this.getRandomCenter(i, this.currentMinYPos).lat,
        //     this.getRandomCenter(i, this.currentMinYPos).lng,
        //     lats.length
        //   )
        // );
        currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
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
          // currentCells.push(
          //   new Cell(
          //     this.getRandomCenter(i, this.currentMaxYPos).lat,
          //     this.getRandomCenter(i, this.currentMaxYPos).lng,
          //     lats.length
          //   )
          // );
          currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
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
  checkInside(polygon: Polygon) {
    var polygonCoordinates: Point[] = [];
    var polygonTrueCoordinates: Point[] = [];
    polygon.polygonNodes.forEach((node) => {
      const gridPoint = L.CRS.EPSG3857.latLngToPoint(
        L.latLng(node.lat, node.lng),
        this.zoom
      );
      gridPoint.x = this.getXPositionInGrid(gridPoint.x);
      gridPoint.y = this.getYPositionInGrid(gridPoint.y);
      polygonCoordinates.push(gridPoint);
    });
    polygon.polygonNodes.forEach((node) => {
      const gridPoint = new Point();
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
            const endingPoint = new Point(10000, item.lng);
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
