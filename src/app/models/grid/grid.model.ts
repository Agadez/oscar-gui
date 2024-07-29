import { OscarMinItem } from '../oscar/oscar-min-item';
import { Bounds, LatLngBounds } from 'leaflet';
import { Polygon } from 'src/app/models/polygon/polygon.model';
import { Point } from 'src/app/models/ray/point.model';
import { Line } from 'src/app/models/ray/line.model';
import { Cell } from 'src/app/models/cell/cell.model';
import { indexOf, maxBy, mean, minBy } from 'lodash';
import { Map as LeafletMap } from 'leaflet';

declare let L;

export class Grid {
  ids: Uint32Array;
  lats: Float32Array;
  lngs: Float32Array;
  boundingRadius: Float32Array;
  helperArray: Int32Array;

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
    const size = this.map.getSize();
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
        const respectingRadius = this.isRadiusInside(
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

    const northWest = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(north, west),
      this.zoom
    );
    const northEast = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(north, east),
      this.zoom
    );
    const southWest = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(south, west),
      this.zoom
    );
    const southEast = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(south, east),
      this.zoom
    );

    this.currentMinXPos = this.getXPositionInGrid(
      Math.min(northWest.x, northEast.x)
    );
    this.currentMinYPos = this.getYPositionInGrid(
      Math.min(northWest.y, southWest.y)
    );
    this.currentMaxXPos = this.getXPositionInGrid(
      Math.max(southWest.x, southEast.x)
    );
    this.currentMaxYPos = this.getYPositionInGrid(
      Math.max(northEast.y, southEast.y)
    );

    const northWestOverflow = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(north + this.maxBoundingRadius, west - this.maxBoundingRadius),
      this.zoom
    );
    const northEastOverflow = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(north + this.maxBoundingRadius, east + this.maxBoundingRadius),
      this.zoom
    );
    const southWestOverflow = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(south - this.maxBoundingRadius, west - this.maxBoundingRadius),
      this.zoom
    );
    const southEastOverflow = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(south - this.maxBoundingRadius, east + this.maxBoundingRadius),
      this.zoom
    );

    this.currentMinXOffset = Math.max(
      0,
      this.getXPositionInGrid(
        Math.min(northWestOverflow.x, northEastOverflow.x)
      )
    );
    this.currentMinYOffset = Math.max(
      0,
      this.getYPositionInGrid(
        Math.min(northWestOverflow.y, southWestOverflow.y)
      )
    );
    this.currentMaxXOffset = Math.min(
      this.gridX - 1,
      this.getXPositionInGrid(
        Math.max(southWestOverflow.x, southEastOverflow.x)
      )
    );
    this.currentMaxYOffset = Math.min(
      this.gridY - 1,
      this.getYPositionInGrid(
        Math.max(northEastOverflow.y, southEastOverflow.y)
      )
    );
  }

  isInsideBounds(south: number, west: number, north: number, east: number) {
    const northWest = L.CRS.EPSG3857.latLngToPoint(
      L.latLng(north, west),
      this.zoom
    );
    const southEast = L.CRS.EPSG3857.latLngToPoint(
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
    cellsWanted: boolean
  ) {
    const cells = new Set<Cell>();
    const itemIndexes = new Set<number>();
    xMin = Math.max(0, xMin);
    xMax = Math.min(this.gridX - 1, xMax);
    yMin = Math.max(0, yMin);
    yMax = Math.min(this.gridY - 1, yMax);
    for (let i = xMin; i <= xMax; i++) {
      for (let j = yMin; j <= yMax; j++) {
        const firstItemIndex = this.helperArray[j * this.gridX + i];
        const offset =
          this.helperArray[j * this.gridX + i + 1] - firstItemIndex;
        const lats = [];
        const lngs = [];
        for (let k = 0; k < offset; k++) {
          const itemIndex = firstItemIndex + k;
          if (cellsWanted) {
            lats.push(this.lats[itemIndex]);
            lngs.push(this.lngs[itemIndex]);
          }
          itemIndexes.add(itemIndex);
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
      this.currentMinXOffset,
      this.currentMaxXOffset,
      this.currentMinYOffset,
      this.currentMaxYOffset,
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
      this.currentMinXPos,
      this.currentMaxXPos,
      this.currentMinYPos,
      this.currentMaxYPos,
      true
    );
    const currentCells: Cell[] = [...mainBounds.cells];

    const indexes = [...mainBounds.indexes];
    const currentOscarIDs = new Set<number>();
    for (const itemIndex of indexes) {
      currentOscarIDs.add(this.ids[itemIndex]);
    }
    return { ids: Array.from(currentOscarIDs), cells: currentCells };
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
    const minX = Math.min(
      minXminY.xPos,
      minXmaxY.xPos,
      maxXminY.xPos,
      maxXMaxY.xPos
    );
    const maxX = Math.max(
      minXminY.xPos,
      minXmaxY.xPos,
      maxXminY.xPos,
      maxXMaxY.xPos
    );
    const minY = Math.min(
      minXminY.yPos,
      minXmaxY.yPos,
      maxXminY.yPos,
      maxXMaxY.yPos
    );
    const maxY = Math.max(
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
  refineGrid(polygon: Polygon) {
    const polygonCoordinates: Point[] = [];
    const polygonTrueCoordinates: Point[] = [];
    const grid = Array.from({ length: this.gridX }, () =>
      Array.from({ length: this.gridY }, () => [])
    );
    let amountItemsInGrid = 0;
    polygon.polygonNodes.forEach(node => {
      const gridPoint = L.CRS.EPSG3857.latLngToPoint(
        L.latLng(node.lat, node.lng),
        this.zoom
      );
      gridPoint.x = this.getXPositionInGrid(gridPoint.x);
      gridPoint.y = this.getYPositionInGrid(gridPoint.y);
      polygonCoordinates.push(gridPoint);
    });
    polygon.polygonNodes.forEach(node => {
      const gridPoint = new Point();
      gridPoint.x = node.lat;
      gridPoint.y = node.lng;
      polygonTrueCoordinates.push(gridPoint);
    });
    for (let i = 0; i < this.gridX; i++) {
      for (let j = 0; j < this.gridY; j++) {
        let cornerInside = 0;
        for (let a = i; a <= i + 1; a++) {
          for (let b = j; b <= j + 1; b++) {
            let counter = 0;
            const startingPoint = new Point(a, b);
            const endingPoint = new Point(this.gridX + 1, b);
            const infiniteLine = new Line(startingPoint, endingPoint);
            for (let k = 0; k < polygonCoordinates.length; k++) {
              const border = new Line(
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
          grid[i][j] = [];
        } else if (cornerInside < 4) {
          const firstItemIndex = this.helperArray[j * this.gridX + i];
          const offset =
            this.helperArray[j * this.gridX + i + 1] - firstItemIndex;
          for (let k = 0; k < offset; k++) {
            const itemIndex = firstItemIndex + k;
            let counter = 0;
            const startingPoint = new Point(
              this.lats[itemIndex],
              this.lngs[itemIndex]
            );
            const endingPoint = new Point(10000, this.lngs[itemIndex]);
            const infiniteLine = new Line(startingPoint, endingPoint);
            for (let l = 0; l < polygonTrueCoordinates.length; l++) {
              const border = new Line(
                polygonTrueCoordinates[l],
                polygonTrueCoordinates[(l + 1) % polygonTrueCoordinates.length]
              );

              if (this.checkIntersect(infiniteLine, border)) {
                counter++;
              }
            }

            if (counter % 2 !== 0) {
              grid[i][j].push(
                new OscarMinItem(
                  this.ids[itemIndex],
                  this.lngs[itemIndex],
                  this.lats[itemIndex],
                  this.boundingRadius[itemIndex]
                )
              );
              amountItemsInGrid++;
            }
          }
        }
      }
    }
    this.setArraySizes(amountItemsInGrid);
    this.buildOffsetArray(grid);
  }
  checkIntersect(infiniteLine: Line, border: Line) {
    const dir1 = this.orientation(
      infiniteLine.startingPoint,
      infiniteLine.endingPoint,
      border.startingPoint
    );
    const dir2 = this.orientation(
      infiniteLine.startingPoint,
      infiniteLine.endingPoint,
      border.endingPoint
    );
    const dir3 = this.orientation(
      border.startingPoint,
      border.endingPoint,
      infiniteLine.startingPoint
    );
    const dir4 = this.orientation(
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
    const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);

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
