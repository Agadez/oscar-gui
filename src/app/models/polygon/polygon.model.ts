import { PolygonNode } from "./polygon-node.model";

export class Polygon {
  polygonNodes: PolygonNode[] = [];
  polygonQuery: string = "";

  constructor(polygonNodes: PolygonNode[], polygonQuery: string) {
    this.polygonNodes = polygonNodes;
    this.polygonQuery = polygonQuery;
  }
}
