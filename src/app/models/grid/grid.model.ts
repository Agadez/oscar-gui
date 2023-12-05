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

  currentMinLat: number;
  currentMaxLat: number;
  currentMinLng: number;
  currentMaxLng: number;

  currentMinXPos: number;
  currentMaxXPos: number;
  currentMinYPos: number;
  currentMaxYPos: number;

  map: LeafletMap;
  zoom: number;
  pixelBounds: Bounds;

  scale: number = 10;

  maxBoundingRadius = 0;
  currentMinXOffset: number;
  currentMinYOffset: number;
  currentMaxXOffset: number;
  currentMaxYOffset: number;

  constructor(map: LeafletMap) {
    this.map = map;
    this.zoom = this.map.getZoom();
    this.pixelBounds = this.map.getPixelBounds();
    this.pixelBounds.min.x = Math.round(this.pixelBounds.min.x);
    this.pixelBounds.min.y = Math.round(this.pixelBounds.min.y);
  }
  buildProjectedGrid(items: OscarMinItem[]) {
    // possible issues with 4k monitors
    let size = this.map.getSize();
    this.gridX = Math.ceil(size.x / this.scale);
    this.gridY = Math.ceil(size.y / this.scale);
    this.currentMinXPos = 0;
    this.currentMaxXPos = this.gridX - 1;
    this.currentMinYPos = 0;
    this.currentMaxYPos = this.gridY - 1;
    const grid = Array.from({ length: this.gridX }, () =>
      Array.from({ length: this.gridY }, () => [])
    );
    for (const item of items) {
      const potentialCoords = this.latLngToXYPosition(item.lat, item.lng);
      if (
        !this.isInsideCurrentView(potentialCoords.xPos, potentialCoords.yPos)
      ) {
        let respectingRadius = this.isRadiusInside(
          item.lat,
          item.lng,
          item.boundingRadius
        );
        if (respectingRadius.xPos > -1) {
          grid[respectingRadius.xPos][respectingRadius.yPos].push(item);
        }
      } else {
        grid[potentialCoords.xPos][potentialCoords.yPos].push(item);
      }
    }

    this.setArraySizes(items.length);
    this.buildOffsetArray(grid);
  }

  setArraySizes(itemsLength: number): void {
    this.ids = new Uint32Array(itemsLength);
    this.lats = new Float32Array(itemsLength);
    this.lngs = new Float32Array(itemsLength);
    this.boundingRadius = new Float32Array(itemsLength);
    this.helperArray = new Int32Array(this.gridX * this.gridY + 1);
  }

  buildOffsetArray(grid: OscarMinItem[][][]) {
    let helperArrayIndex = 0;
    let offset = 0;
    let itemIndex = 0;
    for (let j = 0; j < this.gridY; j++) {
      for (let i = 0; i < this.gridX; i++) {
        this.helperArray[helperArrayIndex] = offset;
        offset += grid[i][j].length;
        helperArrayIndex++;
        for (const item of grid[i][j]) {
          this.addItemToArrays(item, itemIndex);
          itemIndex++;
        }
      }
    }
    this.helperArray[this.gridX * this.gridY] = offset;
  }

  addItemToArrays(item: OscarMinItem, itemIndex: number) {
    this.ids[itemIndex] = item.id;
    this.lats[itemIndex] = item.lat;
    this.lngs[itemIndex] = item.lng;
    this.boundingRadius[itemIndex] = item.boundingRadius;
    if (item.boundingRadius > this.maxBoundingRadius)
      this.maxBoundingRadius = item.boundingRadius;
  }

  isInsideCurrentView(xPos: number, yPos: number) {
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
    if (lat < -90) lat = 180 + lat;
    if (lat > 90) lat = -180 + lat;
    if (lng < -180) lng = -360 - lng;
    if (lng > 180) lng = 360 - lng;
    const point = L.CRS.EPSG3857.latLngToPoint(L.latLng(lat, lng), this.zoom);
    return {
      xPos: this.getXPositionInGrid(point.x),
      yPos: this.getYPositionInGrid(point.y),
    };
  }

  getXPositionInGrid(x: number) {
    return Math.floor((x - this.pixelBounds.min.x) / this.scale);
  }

  getYPositionInGrid(y: number) {
    return Math.floor((y - this.pixelBounds.min.y) / this.scale);
  }

  // getRandomCenter(x, y) {
  //   return L.CRS.EPSG3857.pointToLatLng(
  //     L.point(
  //       x * this.scale + this.pixelBounds.min.x + Math.random() * this.scale,
  //       y * this.scale + this.pixelBounds.min.y + Math.random() * this.scale
  //     ),
  //     this.zoom
  //   );
  // }

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

    let northWestOverflow = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(north - this.maxBoundingRadius, west - this.maxBoundingRadius),
      this.zoom
    );
    let southEastOverflow = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(south + this.maxBoundingRadius, east + this.maxBoundingRadius),
      this.zoom
    );

    let northWest = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(north, west),
      this.zoom
    );
    let southEast = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(south, east),
      this.zoom
    );

    let minXOverflow = Math.max(
      0,
      this.getXPositionInGrid(Math.floor(northWestOverflow.x))
    );
    let minYOverflow = Math.max(
      0,
      this.getYPositionInGrid(Math.floor(northWestOverflow.y))
    );
    let maxXOverflow = Math.min(
      this.gridX - 1,
      this.getXPositionInGrid(Math.floor(southEastOverflow.x))
    );
    let maxYOverflow = Math.min(
      this.gridY - 1,
      this.getYPositionInGrid(Math.floor(southEastOverflow.y))
    );

    this.currentMinXPos = this.getXPositionInGrid(Math.floor(northWest.x));
    this.currentMinYPos = this.getYPositionInGrid(Math.floor(northWest.y));
    this.currentMaxXPos = this.getXPositionInGrid(Math.floor(southEast.x));
    this.currentMaxYPos = this.getYPositionInGrid(Math.floor(southEast.y));

    this.currentMinXOffset = Math.abs(this.currentMinXPos - minXOverflow);
    this.currentMinYOffset = Math.abs(this.currentMinYPos - minYOverflow);
    this.currentMaxXOffset = Math.abs(maxXOverflow - this.currentMaxXPos);
    this.currentMaxYOffset = Math.abs(maxYOverflow - this.currentMaxYPos);
  }

  isInsideBounds(south: number, west: number, north: number, east: number) {
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

  getItems(
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    cellsWanted: boolean,
    checkPosition: boolean
  ) {
    const cells = new Set<Cell>();
    const itemIndexes = new Set<number>();
    for (let i = xMin; i <= xMax; i++) {
      for (let j = yMin; j <= yMax; j++) {
        let firstItemIndex = this.helperArray[j * this.gridX + i];
        let offset = this.helperArray[j * this.gridX + i + 1] - firstItemIndex;
        let lats = [];
        let lngs = [];
        for (let k = 0; k < offset; k++) {
          let itemIndex = firstItemIndex + k;
          if (cellsWanted) {
            lats.push(this.lats[itemIndex]);
            lngs.push(this.lngs[itemIndex]);
          }
          if (!checkPosition) {
            itemIndexes.add(itemIndex);
          }
          if (checkPosition) {
            let respectingRadius = this.isRadiusInside(
              this.lats[itemIndex],
              this.lngs[itemIndex],
              this.boundingRadius[itemIndex]
            );
            if (respectingRadius.xPos > -1) {
              itemIndexes.add(itemIndex);
            }
          }
        }
        if (lats.length !== 0) {
          cells.add(new Cell(mean(lats), mean(lngs), lats.length));
        }
      }
    }
    return { indexes: itemIndexes, cells: cells };
  }
  getItemsForNewGrid() {
    const itemIndexes = this.getItems(
      this.currentMinXPos - this.currentMinXOffset,
      this.currentMaxXPos + this.currentMaxXOffset,
      this.currentMinYPos - this.currentMinYOffset,
      this.currentMaxYPos + this.currentMaxYOffset,
      false,
      false
    ).indexes;
    const currentMinItems: OscarMinItem[] = [];
    for (const index of itemIndexes) {
      currentMinItems.push(
        new OscarMinItem(
          this.ids[index],
          this.lngs[index],
          this.lats[index],
          this.boundingRadius[index]
        )
      );
    }
    return currentMinItems;
  }

  getItemsForVisualization() {
    const mainBounds = this.getItems(
      this.currentMinXPos + 1,
      this.currentMaxXPos - 1,
      this.currentMinYPos + 1,
      this.currentMaxXPos - 1,
      true,
      false
    );
    const westBounds = this.getItems(
      this.currentMinXPos - this.currentMinXOffset,
      this.currentMinXPos,
      this.currentMinYPos - this.currentMinYOffset,
      this.currentMaxYPos + this.currentMaxYOffset,
      true,
      true
    );
    const eastBounds = this.getItems(
      this.currentMaxXPos,
      this.currentMaxXPos + this.currentMaxXOffset,
      this.currentMinYPos - this.currentMinYOffset,
      this.currentMaxYPos + this.currentMaxYOffset,
      true,
      true
    );
    const northBounds = this.getItems(
      this.currentMinXPos - this.currentMinXOffset,
      this.currentMaxXPos + this.currentMaxXOffset,
      this.currentMinYPos - this.currentMaxYOffset,
      this.currentMinYPos,
      true,
      true
    );
    const southBounds = this.getItems(
      this.currentMinXPos - this.currentMinXOffset,
      this.currentMaxXPos + this.currentMaxXOffset,
      this.currentMaxYPos,
      this.currentMaxYPos + this.currentMaxYOffset,
      true,
      true
    );
    const currentCells: Cell[] = [
      ...mainBounds.cells,
      ...westBounds.cells,
      ...eastBounds.cells,
      ...northBounds.cells,
      ...southBounds.cells,
    ];

    const indexes = [
      ...mainBounds.indexes,
      ...westBounds.indexes,
      ...eastBounds.indexes,
      ...northBounds.indexes,
      ...southBounds.indexes,
    ];
    const currentOscarIDs: number[] = [];

    for (const itemIndex of indexes) {
      currentOscarIDs.push(this.ids[itemIndex]);
    }
    return { ids: currentOscarIDs, cells: currentCells };
  }

  isRadiusInside(
    lat: number,
    lng: number,
    boundingRadius: number
  ): { xPos: number; yPos: number } {
    const minXminY = this.latLngToXYPosition(
      lat - boundingRadius,
      lng - boundingRadius
    );
    const minXmaxY = this.latLngToXYPosition(
      lat - boundingRadius,
      lng + boundingRadius
    );
    const maxXminY = this.latLngToXYPosition(
      lat + boundingRadius,
      lng - boundingRadius
    );
    const maxXMaxY = this.latLngToXYPosition(
      lat + boundingRadius,
      lng + boundingRadius
    );
    let minX = Math.min(
      minXminY.xPos,
      minXmaxY.xPos,
      maxXminY.xPos,
      maxXMaxY.xPos
    );
    let maxX = Math.max(
      minXminY.xPos,
      minXmaxY.xPos,
      maxXminY.xPos,
      maxXMaxY.xPos
    );
    let minY = Math.min(
      minXminY.yPos,
      minXmaxY.yPos,
      maxXminY.yPos,
      maxXMaxY.yPos
    );
    let maxY = Math.max(
      minXminY.yPos,
      minXmaxY.yPos,
      maxXminY.yPos,
      maxXMaxY.yPos
    );

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (this.isInsideCurrentView(x, y)) return { xPos: x, yPos: y };
      }
    }
    return { xPos: -1, yPos: -1 };
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
