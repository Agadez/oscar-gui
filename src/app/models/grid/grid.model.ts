import { OscarMinItem } from "../oscar/oscar-min-item";

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

  items: OscarMinItem[];

  constructor(
    items: OscarMinItem[],
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number,
    resolutionX: number,
    resolutionY: number,
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

      this.gridX = Math.ceil(distanceLat / minResolution);
      this.gridY = Math.ceil(distanceLon / minResolution);
      this.resolutionX = distanceLat / (this.gridX - 1);
      this.resolutionY = distanceLon / (this.gridY - 1);

      console.log(
        distanceLat,
        distanceLon,
        this.gridX,
        this.gridY,
        this.resolutionX,
        this.resolutionY
      );
    }
    this.grid = Array.from({ length: this.gridX }, () =>
      Array.from({ length: this.gridY }, () => [])
    );
    for (const item of this.items) {
      const latGridPos = this.getLatPositionInGrid(item.lat);
      const lonGridPos = this.getLonPositionInGrid(item.lon);
      this.grid[latGridPos][lonGridPos].push(item);
    }
    console.log("hihi");
    console.log(this.grid);
  }

  getLatPositionInGrid(lat: number) {
    return Math.floor(Math.abs(lat - this.minLat) / this.resolutionX);
  }

  getLonPositionInGrid(lon: number) {
    return Math.floor(Math.abs(lon - this.minLon) / this.resolutionY);
  }

  getCurrentItems(
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number
  ) {
    const currentMinItems: OscarMinItem[] = [];
    this.minLonPos = this.getLonPositionInGrid(minLon);
    this.minLatPos = this.getLatPositionInGrid(minLat);
    this.maxLonPos = this.getLonPositionInGrid(maxLon);
    this.maxLatPos = this.getLatPositionInGrid(maxLat);
    for (let i = this.minLatPos + 1; i < this.maxLatPos; i++) {
      for (let j = this.minLonPos + 1; j < this.maxLonPos; j++) {
        for (const item of this.grid[i][j]) {
          currentMinItems.push(item);
        }
      }
    }
    for (let j = this.minLonPos; j <= this.maxLonPos; j++) {
      for (const item of this.grid[this.minLatPos][j]) {
        currentMinItems.push(item);
      }
      for (const item of this.grid[this.maxLatPos][j]) {
        currentMinItems.push(item);
      }
    }
    for (let i = this.minLatPos; i <= this.maxLatPos; i++) {
      for (const item of this.grid[i][this.minLonPos]) {
        currentMinItems.push(item);
      }
      for (const item of this.grid[i][this.maxLonPos]) {
        currentMinItems.push(item);
      }
    }

    return currentMinItems;
  }
  checkBounds(minLat: number, minLon: number, maxLat: number, maxLon: number) {
    if (
      minLat < this.minLat ||
      minLon < this.minLon ||
      maxLat > this.maxLat ||
      maxLon > this.maxLon
    ) {
      return false;
    }
    return true;
  }
  delete() {
    this.grid = [];
  }
}
