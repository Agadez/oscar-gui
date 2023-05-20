import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { v4 as uuidv4 } from "uuid";
import { PolygonNode } from "../models/polygon/polygon-node.model";
import { Polygon } from "../models/polygon/polygon.model";
import { GridService } from "./data/grid.service";
import { ItemStoreService } from "./data/item-store.service";

@Injectable({
  providedIn: "root",
})
export class PolygonServiceService {
  constructor(
    private gridService: GridService,
    private store: ItemStoreService
  ) {}
  tabClosed = new BehaviorSubject(false);
  tabChanged = new BehaviorSubject(false);
  tabActivated = new BehaviorSubject(false);
  activatedPolygonUpdated = new Subject();

  polygonAccuracy = "";
  polygonMapping = new Map<uuidv4, Polygon>();
  idUuidMap = new Map<string, uuidv4>();
  activatedPolygons = new Set<uuidv4>();
  polyClientCalc = false;

  checkId(id) {
    if (!this.idUuidMap.has(id)) return true;
    return false;
  }
  addId(id: string, uuid: uuidv4) {
    this.idUuidMap.set(id, uuid);
  }
  removeId(id: string, uuid: uuidv4) {
    if (this.activatedPolygons.has(uuid)) this.activatedPolygons.delete(uuid);
    this.idUuidMap.delete(id);
  }
  addPolygon(uuid: uuidv4, polygonNodes: PolygonNode[]) {
    this.polygonMapping.set(
      uuid,
      new Polygon(polygonNodes, this.getQueryString(polygonNodes))
    );
  }
  removePolygon(uuid: uuidv4) {
    this.polygonMapping.delete(uuid);
    if (this.activatedPolygons.has(uuid)) {
      this.gridService.grid = [];
      this.store.updateItems([]);
    }
  }
  clearPolygon(uuid: uuidv4) {
    this.polygonMapping.set(uuid, new Polygon([], ""));
    if (this.activatedPolygons.has(uuid)) {
      this.gridService.grid = [];
      this.store.updateItems([]);
    }
  }
  addNode(polygonUuid: uuidv4, polygonNode: PolygonNode) {
    let polygon = this.polygonMapping.get(polygonUuid).polygonNodes;
    polygon.push(polygonNode);
    this.polygonMapping.set(
      polygonUuid,
      new Polygon(polygon, this.getQueryString(polygon))
    );
    if (this.activatedPolygons.has(polygonUuid) && polygon.length > 2) {
      this.activatedPolygonUpdated.next(true);
    }
  }

  removeNode(polygonUuid: uuidv4, uuid: uuidv4) {
    const polygon = this.polygonMapping.get(polygonUuid).polygonNodes;
    const index = polygon.findIndex((node) => {
      return node.uuid === uuid;
    });
    if (index !== -1) {
      polygon.splice(index, 1);
    }
    this.polygonMapping.set(
      polygonUuid,
      new Polygon(polygon, this.getQueryString(polygon))
    );
    if (this.activatedPolygons.has(polygonUuid) && polygon.length > 2) {
      this.activatedPolygonUpdated.next(true);
    }
  }
  getQueryString(polygon: PolygonNode[]) {
    let polygonString = "";
    let index = 0;
    for (const node of polygon) {
      if (index == 0) {
        polygonString += `$poly:${this.polygonAccuracy}${node.lat},${node.lon}`;
        console.log(polygonString);
        console.log(this.polygonAccuracy);
      } else polygonString += `,${node.lat},${node.lon}`;
      index++;
    }
    return polygonString;
  }

  updateQueryString() {
    this.polygonMapping.forEach((value, key) => {
      this.polygonMapping.set(
        key,
        new Polygon(value.polygonNodes, this.getQueryString(value.polygonNodes))
      );
    });
  }

  getRandomColor(): string {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}
