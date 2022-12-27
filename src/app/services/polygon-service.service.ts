import { Injectable } from "@angular/core";
import { GeoPointId } from "../models/geo-point-id.model";
import { BehaviorSubject } from "rxjs";
import { v4 as uuidv4 } from "uuid";

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

  polygonArray: GeoPointId[][] = [];
  polygonMapping = new Map();
  nameMapping = new Map();

  checkName(name) {
    if (!this.nameMapping.has(name)) return true;
    return false;
  }
  addName(name, uuid) {
    this.nameMapping.set(name, uuid);
  }
  removeName(name) {
    this.nameMapping.delete(name);
  }
  addPolygon(polygon: GeoPointId[], uuid: uuidv4) {
    this.polygonMapping.set(uuid, polygon);
    console.log(this.polygonMapping);
    this.polygonArray.push(polygon);
  }
  removePolygon(polygon: GeoPointId[], uuid: uuidv4) {
    const index = this.polygonArray.findIndex((polygonObject) => {
      return polygonObject[0].uuid === polygon[0].uuid;
    });
    console.log("index: ", index);
    if (index !== -1) this.polygonArray.splice(index, 1);
    this.polygonMapping.delete(uuid);
  }
  removeNode(polygonUuid: uuidv4, uuid: uuidv4) {
    for (const polygon of this.polygonArray) {
      const index = polygon.findIndex((node) => {
        return node.uuid === uuid;
      });
      if (index !== -1) {
        polygon.splice(index, 1);
        break;
      }
    }

    for (const polygon of this.polygonMapping.get(polygonUuid)) {
      const index = polygon.findIndex((node) => {
        return node.uuid === uuid;
      });
      if (index !== -1) {
        polygon.splice(index, 1);
        break;
      }
    }
  }
  getPolygonQuery(): string {
    let polygonString = "";
    let index = -1;
    for (const polygon of this.polygonArray) {
      if (index !== -1) polygonString += " + ";
      index = 0;
      for (const node of polygon) {
        if (index == 0) {
          polygonString += `$poly:${node.lat},${node.lon}`;
        } else polygonString += `,${node.lat},${node.lon}`;
        index++;
      }
    }
    return polygonString;
  }
  getPolygonQuery2(uuid: uuidv4): string {
    console.log(uuid);
    let polygonString = "";
    let index = 0;

    for (const node of this.polygonMapping.get(uuid)) {
      if (index == 0) {
        polygonString += `$poly:${node.lat},${node.lon}`;
      } else polygonString += `,${node.lat},${node.lon}`;
      index++;
    }
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
}
