import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { v4 as uuidv4 } from "uuid";
import { PolygonNode } from "../models/polygon/polygon-node.model";
import { Polygon } from "../models/polygon/polygon.model";
import { GridService } from "./data/grid.service";
import { ItemStoreService } from "./data/item-store.service";
import { LatLng } from "leaflet";

@Injectable({
  providedIn: "root",
})
export class PolygonService {
  constructor(private store: ItemStoreService) {}
  tabClosed = new BehaviorSubject(false);
  tabChanged = new BehaviorSubject(false);
  tabActivated = new BehaviorSubject(false);
  activatedPolygonUpdated = new Subject();

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
      new Polygon(
        polygonNodes,
        this.getQueryString(polygonNodes),
        this.getBoundingBoxString(polygonNodes)
      )
    );
  }
  // removePolygon(uuid: uuidv4) {
  //   this.polygonMapping.delete(uuid);
  //   if (this.activatedPolygons.has(uuid)) {
  //     this.gridService.deleteGrid();
  //     this.store.updateItems([]);
  //   }
  // }
  clearPolygon(uuid: uuidv4) {
    this.polygonMapping.set(uuid, new Polygon([], "", ""));
    if (this.activatedPolygons.has(uuid)) {
      this.store.updateItems([]);
    }
  }
  addNode(polygonUuid: uuidv4, polygonNode: PolygonNode) {
    let polygon = this.polygonMapping.get(polygonUuid).polygonNodes;
    polygon.push(polygonNode);
    this.polygonMapping.set(
      polygonUuid,
      new Polygon(
        polygon,
        this.getQueryString(polygon),
        this.getBoundingBoxString(polygon)
      )
    );
    if (this.activatedPolygons.has(polygonUuid) && polygon.length > 2) {
      this.activatedPolygonUpdated.next(true);
    }
  }

  dragNode(polygonUuid: uuidv4, nodeUuid: uuidv4, dragEndPosition: LatLng) {
    let newPolygon = this.polygonMapping.get(polygonUuid);
    const index = newPolygon.polygonNodes.findIndex((n) => n.uuid === nodeUuid);
    newPolygon.polygonNodes[index].lat = dragEndPosition.lat;
    newPolygon.polygonNodes[index].lng = dragEndPosition.lng;
    newPolygon.polygonQuery = this.getQueryString(newPolygon.polygonNodes);
    newPolygon.boundingBoxString = this.getBoundingBoxString(
      newPolygon.polygonNodes
    );
    this.polygonMapping.set(polygonUuid, newPolygon);
    if (
      this.activatedPolygons.has(polygonUuid) &&
      this.polygonMapping.get(polygonUuid).polygonNodes.length > 2
    ) {
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
      new Polygon(
        polygon,
        this.getQueryString(polygon),
        this.getBoundingBoxString(polygon)
      )
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
        polygonString += `$poly:${node.lat},${node.lng}`;
      } else polygonString += `,${node.lat},${node.lng}`;
      index++;
    }
    return polygonString;
  }
  getBoundingBoxString(polygon: PolygonNode[]) {
    let west = 1000;
    let south = 1000;
    let east = -1000;
    let north = -1000;
    for (const node of polygon) {
      if (node.lng < west) west = node.lng;
      if (node.lng > east) east = node.lng;
      if (node.lat < south) south = node.lat;
      if (node.lat > north) north = node.lat;
    }
    return `$geo:${west},${south},${east},${north}`;
  }

  updateQueryString() {
    this.polygonMapping.forEach((value, key) => {
      this.polygonMapping.set(
        key,
        new Polygon(
          value.polygonNodes,
          this.getQueryString(value.polygonNodes),
          this.getBoundingBoxString(value.polygonNodes)
        )
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
