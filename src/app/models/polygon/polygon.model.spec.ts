import { Polygon } from "./polygon.model";
import { PolygonNode } from "./polygon-node.model";
import { v4 as uuidv4 } from "uuid";

describe("Polygon", () => {
  it("should create an instance", () => {
    expect(new Polygon([new PolygonNode(0, 0, uuidv4(), "")], "")).toBeTruthy();
  });
});
