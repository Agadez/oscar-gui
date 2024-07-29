import { PolygonNode } from './polygon-node.model';

export class Polygon {
  polygonNodes: PolygonNode[] = [];
  polygonQuery: string = '';
  boundingBoxString: string = '';

  constructor(
    polygonNodes: PolygonNode[],
    polygonQuery: string,
    boundingBox: string
  ) {
    this.polygonNodes = polygonNodes;
    this.polygonQuery = polygonQuery;
    this.boundingBoxString = boundingBox;
  }
}
