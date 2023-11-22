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
  ids: Uint32Array;
  lats: Float32Array;
  lngs: Float32Array;
  boundingRadius: Float32Array;
  helperArray: Int32Array;

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

  maxBoundingRadius = 0;
  constructor(items: OscarMinItem[], map: LeafletMap) {
    this.items = items;
    this.map = map;
  }
  setArraySizes() {
    this.ids = new Uint32Array(this.items.length);
    this.lats = new Float32Array(this.items.length);
    this.lngs = new Float32Array(this.items.length);
    this.boundingRadius = new Float32Array(this.items.length);
    this.helperArray = new Int32Array(this.gridX * this.gridY + 1);
  }
  addItemToArrays(item: OscarMinItem, itemIndex: number) {
    this.ids[itemIndex] = item.id;
    this.lats[itemIndex] = item.lat;
    this.lngs[itemIndex] = item.lng;
    this.boundingRadius[itemIndex] = item.boundingRadius;
    if (item.boundingRadius > this.maxBoundingRadius)
      this.maxBoundingRadius = item.boundingRadius;
  }
  buildProjectedGrid() {
    let size = this.map.getSize();
    this.zoom = this.map.getZoom();

    //temporary
    let bounds = this.map.getBounds();
    this.currentMinLat = bounds.getNorth();
    this.currentMaxLat = bounds.getSouth();
    this.currentMinLng = bounds.getWest();
    this.currentMaxLng = bounds.getEast();

    this.viewBound = this.map.getPixelBounds();
    this.viewBound.min.x = Math.round(this.viewBound.min.x);
    this.viewBound.min.y = Math.round(this.viewBound.min.y);
    this.gridX = Math.ceil(size.x / this.scale);
    this.gridY = Math.ceil(size.y / this.scale);
    console.log("gridX:", this.gridX, "gridY:", this.gridY);
    this.grid = Array.from({ length: this.gridX }, () =>
      Array.from({ length: this.gridY }, () => [])
    );
    this.currentMinXPos = 0;
    this.currentMaxXPos = this.gridX - 1;
    this.currentMinYPos = 0;
    this.currentMaxYPos = this.gridY - 1;
    // set for counting cells

    for (const item of this.items) {
      const { xPos, yPos } = this.itemsWithoutRadius(item);
      if (xPos !== -1) {
        this.grid[xPos][yPos].push(item);
      }
    }
    this.setArraySizes();
    let helperArrayIndex = 0;
    let offset = 0;
    let itemIndex = 0;
    for (let j = 0; j < this.gridY; j++) {
      for (let i = 0; i < this.gridX; i++) {
        this.helperArray[helperArrayIndex] = offset;
        offset += this.grid[i][j].length;
        helperArrayIndex++;
        for (const item of this.grid[i][j]) {
          this.addItemToArrays(item, itemIndex);
          itemIndex++;
        }
      }
    }
    this.helperArray[this.gridX * this.gridY] = offset;
    this.grid = [];
    this.items = [];
    // const bounds = this.itemsWithRadius(item);
    // for (let xPos = bounds.minXPos; xPos <= bounds.maxXPos; xPos++) {
    //   for (let yPos = bounds.minYPos; yPos <= bounds.maxYPos; yPos++) {
    //     this.grid[xPos][yPos].push(item);
    //   }
    // }
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
    this.currentMinXPos = this.getXPositionInGrid(
      Math.floor(northWest.x - this.maxBoundingRadius)
    );
    this.currentMinYPos = this.getYPositionInGrid(
      Math.floor(northWest.y - this.maxBoundingRadius)
    );
    this.currentMaxXPos = this.getXPositionInGrid(
      Math.ceil(southEast.x + this.maxBoundingRadius)
    );
    this.currentMaxYPos = this.getYPositionInGrid(
      Math.ceil(southEast.y + this.maxBoundingRadius)
    );
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

  boundsInside(south: number, west: number, north: number, east: number) {
    let northWest = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(north, west),
      this.zoom
    );
    let southEast = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(south, east),
      this.zoom
    );
    if (
      this.getXPositionInGrid(northWest.x) >= 0 &&
      this.getYPositionInGrid(northWest.y) >= 0 &&
      this.getXPositionInGrid(southEast.x) < this.gridX &&
      this.getYPositionInGrid(southEast.y) < this.gridY
    )
      return true;
    return false;
  }

  getCurrentItems() {
    const currentMinItems: OscarMinItem[] = [];
    for (let i = this.currentMinXPos + 1; i < this.currentMaxXPos; i++) {
      for (let j = this.currentMinYPos + 1; j < this.currentMaxYPos; j++) {
        let firstItemIndex = this.helperArray[j * this.gridX + i];
        let offset = this.helperArray[j * this.gridX + i + 1] - firstItemIndex;
        for (let k = 0; k < offset; k++) {
          let itemIndex = firstItemIndex + k;
          currentMinItems.push(
            new OscarMinItem(
              this.ids[itemIndex],
              this.lngs[itemIndex],
              this.lats[itemIndex],
              this.boundingRadius[itemIndex]
            )
          );
        }
      }
    }
    for (let j = this.currentMinYPos; j <= this.currentMaxYPos; j++) {
      let firstItemIndex =
        this.helperArray[j * this.gridX + this.currentMinXPos];
      let offset =
        this.helperArray[j * this.gridX + this.currentMinXPos + 1] -
        firstItemIndex;
      for (let k = 0; k < offset; k++) {
        let itemIndex = firstItemIndex + k;
        let lat = this.lats[itemIndex];
        let lng = this.lngs[itemIndex];
        if (this.itemInside(lat, lng, this.boundingRadius[itemIndex])) {
          currentMinItems.push(
            new OscarMinItem(
              this.ids[itemIndex],
              this.lngs[itemIndex],
              this.lats[itemIndex],
              this.boundingRadius[itemIndex]
            )
          );
        }
      }

      if (this.currentMinXPos !== this.currentMaxXPos) {
        let firstItemIndex =
          this.helperArray[j * this.gridX + this.currentMaxXPos];
        let offset =
          this.helperArray[j * this.gridX + this.currentMaxXPos + 1] -
          firstItemIndex;
        for (let k = 0; k < offset; k++) {
          let itemIndex = firstItemIndex + k;
          let lat = this.lats[itemIndex];
          let lng = this.lngs[itemIndex];
          if (this.itemInside(lat, lng, this.boundingRadius[itemIndex])) {
            currentMinItems.push(
              new OscarMinItem(
                this.ids[itemIndex],
                this.lngs[itemIndex],
                this.lats[itemIndex],
                this.boundingRadius[itemIndex]
              )
            );
          }
        }
      }
    }
    for (let i = this.currentMinXPos; i <= this.currentMaxXPos; i++) {
      let firstItemIndex =
        this.helperArray[this.currentMinYPos * this.gridX + i];
      let offset =
        this.helperArray[this.currentMinYPos * this.gridX + i + 1] -
        firstItemIndex;
      for (let k = 0; k < offset; k++) {
        let itemIndex = firstItemIndex + k;
        let lat = this.lats[itemIndex];
        let lng = this.lngs[itemIndex];
        if (this.itemInside(lat, lng, this.boundingRadius[itemIndex])) {
          currentMinItems.push(
            new OscarMinItem(
              this.ids[itemIndex],
              this.lngs[itemIndex],
              this.lats[itemIndex],
              this.boundingRadius[itemIndex]
            )
          );
        }
      }

      if (this.currentMinYPos !== this.currentMaxYPos) {
        let firstItemIndex =
          this.helperArray[this.currentMaxYPos * this.gridX + i];
        let offset =
          this.helperArray[this.currentMaxYPos * this.gridX + i + 1] -
          firstItemIndex;
        for (let k = 0; k < offset; k++) {
          let itemIndex = firstItemIndex + k;
          let lat = this.lats[itemIndex];
          let lng = this.lngs[itemIndex];
          if (this.itemInside(lat, lng, this.boundingRadius[itemIndex])) {
            currentMinItems.push(
              new OscarMinItem(
                this.ids[itemIndex],
                this.lngs[itemIndex],
                this.lats[itemIndex],
                this.boundingRadius[itemIndex]
              )
            );
          }
        }
      }
    }

    return currentMinItems;
  }

  getVisualization() {
    const currentCells: Cell[] = [];
    // improvement with only index?
    // const currentMinItems: OscarMinItem[] = [];
    const currentOscarIDs: number[] = [];

    for (let i = this.currentMinXPos + 1; i < this.currentMaxXPos; i++) {
      for (let j = this.currentMinYPos + 1; j < this.currentMaxYPos; j++) {
        let lats = [];
        let lngs = [];
        let firstItemIndex = this.helperArray[j * this.gridX + i];
        let offset = this.helperArray[j * this.gridX + i + 1] - firstItemIndex;
        for (let k = 0; k < offset; k++) {
          let itemIndex = firstItemIndex + k;
          lats.push(this.lats[itemIndex]);
          lngs.push(this.lngs[itemIndex]);
          currentOscarIDs.push(this.ids[itemIndex]);
          // currentMinItems.push(
          //   new OscarMinItem(
          //     this.ids[itemIndex],
          //     this.lngs[itemIndex],
          //     this.lats[itemIndex],
          //     this.boundingRadius[itemIndex]
          //   )
          // );
        }
        if (lats.length !== 0) {
          currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
        }
      }
    }
    for (let j = this.currentMinYPos; j <= this.currentMaxYPos; j++) {
      let lats = [];
      let lngs = [];
      let firstItemIndex =
        this.helperArray[j * this.gridX + this.currentMinXPos];
      let offset =
        this.helperArray[j * this.gridX + this.currentMinXPos + 1] -
        firstItemIndex;
      for (let k = 0; k < offset; k++) {
        let itemIndex = firstItemIndex + k;
        let lat = this.lats[itemIndex];
        let lng = this.lngs[itemIndex];
        if (this.itemInside(lat, lng, this.boundingRadius[itemIndex])) {
          lats.push(lat);
          lngs.push(lng);
          currentOscarIDs.push(this.ids[itemIndex]);
        }
      }
      if (lats.length !== 0) {
        currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
      }

      if (this.currentMinXPos !== this.currentMaxXPos) {
        let lats = [];
        let lngs = [];
        let firstItemIndex =
          this.helperArray[j * this.gridX + this.currentMaxXPos];
        let offset =
          this.helperArray[j * this.gridX + this.currentMaxXPos + 1] -
          firstItemIndex;
        for (let k = 0; k < offset; k++) {
          let itemIndex = firstItemIndex + k;
          let lat = this.lats[itemIndex];
          let lng = this.lngs[itemIndex];
          if (this.itemInside(lat, lng, this.boundingRadius[itemIndex])) {
            lats.push(lat);
            lngs.push(lng);
            currentOscarIDs.push(this.ids[itemIndex]);
          }
        }
        if (lats.length !== 0) {
          currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
        }
      }
    }
    for (let i = this.currentMinXPos; i <= this.currentMaxXPos; i++) {
      let lats = [];
      let lngs = [];
      let firstItemIndex =
        this.helperArray[this.currentMinYPos * this.gridX + i];
      let offset =
        this.helperArray[this.currentMinYPos * this.gridX + i + 1] -
        firstItemIndex;
      for (let k = 0; k < offset; k++) {
        let itemIndex = firstItemIndex + k;
        let lat = this.lats[itemIndex];
        let lng = this.lngs[itemIndex];
        if (this.itemInside(lat, lng, this.boundingRadius[itemIndex])) {
          lats.push(lat);
          lngs.push(lng);
          currentOscarIDs.push(this.ids[itemIndex]);
        }
      }
      if (lats.length !== 0) {
        currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
      }

      if (this.currentMinYPos !== this.currentMaxYPos) {
        let lats = [];
        let lngs = [];
        let firstItemIndex =
          this.helperArray[this.currentMaxYPos * this.gridX + i];
        let offset =
          this.helperArray[this.currentMaxYPos * this.gridX + i + 1] -
          firstItemIndex;
        for (let k = 0; k < offset; k++) {
          let itemIndex = firstItemIndex + k;
          let lat = this.lats[itemIndex];
          let lng = this.lngs[itemIndex];
          if (this.itemInside(lat, lng, this.boundingRadius[itemIndex])) {
            lats.push(lat);
            lngs.push(lng);
            currentOscarIDs.push(this.ids[itemIndex]);
          }
        }
        if (lats.length !== 0) {
          currentCells.push(new Cell(mean(lats), mean(lngs), lats.length));
        }
      }
    }
    return { ids: currentOscarIDs, cells: currentCells };
  }

  itemInside(lat: number, lng: number, boundingRadius: number) {
    if (
      lat - boundingRadius <= this.currentMaxLat ||
      lat + boundingRadius >= this.currentMinLat ||
      lng - boundingRadius <= this.currentMaxLng ||
      lng + boundingRadius >= this.currentMinLng
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
