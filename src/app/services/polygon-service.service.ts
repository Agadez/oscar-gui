import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { v4 as uuidv4 } from "uuid";
import { PolygonNode } from "../models/polygon/polygon-node.model";
import { Polygon } from "../models/polygon/polygon.model";

@Injectable({
  providedIn: "root",
})
export class PolygonServiceService {
  constructor() {}
  tabClosed = new BehaviorSubject(false);
  tabChanged = new BehaviorSubject(false);
  tabActivated = new BehaviorSubject(false);
  polygonInSearch = new BehaviorSubject({ uuid: uuidv4(), color: "" });
  inSearch = new BehaviorSubject(false);

  polygonMapping = new Map<uuidv4, Polygon>();
  nameMapping = new Map<string, uuidv4>();

  checkName(name) {
    if (!this.nameMapping.has(name)) return true;
    return false;
  }
  addName(name: string, uuid) {
    this.nameMapping.set(name, uuid);
  }
  removeName(name: string) {
    this.nameMapping.delete(name);
  }
  addPolygon(uuid: uuidv4, polygonNodes: PolygonNode[]) {
    this.polygonMapping.set(
      uuid,
      new Polygon(polygonNodes, this.getQueryString(polygonNodes))
    );
  }
  removePolygon(uuid: uuidv4) {
    this.polygonMapping.delete(uuid);
  }
  clearPolygon(uuid: uuidv4) {
    this.polygonMapping.set(uuid, new Polygon([], ""));
  }
  addNode(polygonUuid: uuidv4, polygonNode: PolygonNode) {
    let polygon = this.polygonMapping.get(polygonUuid).polygonNodes;
    polygon.push(polygonNode);
    this.polygonMapping.set(
      polygonUuid,
      new Polygon(polygon, this.getQueryString(polygon))
    );
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
  }
  getQueryString(polygon: PolygonNode[]) {
    let polygonString = "";
    let index = 0;
    for (const node of polygon) {
      if (index == 0) {
        polygonString += `$poly:${node.lat},${node.lon}`;
      } else polygonString += `,${node.lat},${node.lon}`;
      index++;
    }
    console.log("polygonString: ", polygonString);
    return polygonString;
  }
  getRandomColor(): string {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  // getUpdatedQuery(inputString: string) {
  //   console.log(inputString);
  //   const reg = /\§(\w+)/g;
  //   const updatedInputString = inputString.replace(reg, function (_, p1) {
  //     console.log("p1", p1);
  //     console.log(this.polygonMapping);
  //     return this.polygonMapping.get(this.nameMapping.get(p1)).polygonQuery;
  //   });
  //   return updatedInputString;
  // }
}
