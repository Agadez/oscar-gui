import { Component, Input, OnInit, NgZone, OnDestroy } from "@angular/core";
import { MapService } from "src/app/services/map/map.service";
import { PolygonNode } from "src/app/models/polygon-node.model";
import { Subject } from "rxjs";
import { LeafletEvent, Polygon } from "leaflet";
import { debounceTime } from "rxjs/operators";
import { GeoPoint } from "../../models/geo-point";
import { PolygonsComponent, tabClosed } from "../polygons/polygons.component";
import { v4 as uuidv4 } from "uuid";
import { OscarItemsService } from "../../services/oscar/oscar-items.service";
import { PolygonServiceService } from "../../services/polygon-service.service";

declare var L;

@Component({
  selector: "app-polygon",
  templateUrl: "./polygon.component.html",
  styleUrls: ["./polygon.component.sass"],
})
export class PolygonComponent implements OnInit, OnDestroy {
  constructor(
    private mapService: MapService,
    private zone: NgZone,
    private polygonsComponent: PolygonsComponent,
    private oscarItemsService: OscarItemsService,
    private polygonService: PolygonServiceService
  ) {}

  @Input()
  active = true;
  @Input()
  polygonVisible = false;
  @Input()
  color = "red";

  @Input()
  uuid = uuidv4();

  mapPolygon: L.Polygon;

  polygonNodes: Array<PolygonNode> = [];
  nodeLayer = new L.LayerGroup();
  polygonLayer = new L.LayerGroup();

  ngOnInit(): void {
    let init = true;
    this.mapPolygon = L.polygon([], {
      color: this.color,
      weight: 4,
      opacity: 1,
      smoothFactor: 1,
    });
    this.mapService.onClick$.subscribe((event) => {
      if (!event || !this.active || !this.polygonVisible || init) {
        return;
      }
      this.addNode({
        point: new GeoPoint(event.latlng.lat, event.latlng.lng),
        name: "",
        uuid: uuidv4(),
      });
    });
    this.mapService.onMapReady$.subscribe((mapReady) => {
      if (mapReady) {
        this.mapService._map.addLayer(this.nodeLayer);
        this.mapService._map.addLayer(this.mapPolygon);
      }
    });
    tabClosed.subscribe((uuid) => {
      if (this.uuid == uuid) {
        this.clearList();
      }
    });
    init = false;
  }
  addNode({ point, name, uuid }) {
    const node = {
      color: this.polygonsComponent.getRandomColor(),
      geoPoint: { lat: point.lat, lon: point.lon },
      uuid: uuid,
      name,
    };
    this.polygonNodes.push(node);
    this.draw();
  }

  draw() {
    this.nodeLayer.clearLayers();
    this.polygonLayer.clearLayers();
    let i = 0;
    this.mapPolygon.setLatLngs([]);
    for (const node of this.polygonNodes) {
      // const circleMarker = L.divIcon({
      //   html: '<i class="fa-solid fa-circle"></i>',
      //   icon: "location",
      //   iconSize: [20, 20],
      //   markerColor: "red",
      // });
      const marker = L.circleMarker([node.geoPoint.lat, node.geoPoint.lon], {
        color: node.color,
        fillColor: node.color,
        fillOpacity: 1,
        radius: 5,
      });
      marker.addTo(this.nodeLayer);
      this.mapPolygon.addLatLng([node.geoPoint.lat, node.geoPoint.lon]);
    }
    this.mapPolygon.addTo(this.polygonLayer);
  }
  async markerDragHandler(event) {
    this.polygonNodes[this.findMarker(event.target._leaflet_id)].geoPoint =
      new GeoPoint(event.target._latlng.lat, event.target._latlng.lng);
    this.draw();
  }
  findMarker(leafletId: number) {
    for (let i = 0; i < this.polygonNodes.length; i++) {
      if (this.polygonNodes[i].leafletId === leafletId) {
        return i;
      }
    }
    return -1;
  }
  removeNode(uuid: uuidv4) {
    this.polygonNodes = this.polygonNodes.filter(
      (value) => value.uuid !== uuid
    );
    this.draw();
  }
  ngOnDestroy(): void {
    this.clearList;
    this.active = false;
  }
  clearList() {
    this.polygonNodes = [];
    this.mapPolygon.setLatLngs([]);
    this.polygonLayer.clearLayers();
    this.nodeLayer.clearLayers();
  }
  route() {
    let queryPolygon: Array<GeoPoint> = [];
    for (const node of this.polygonNodes) {
      queryPolygon.push(node.geoPoint);
    }
    this.polygonService.polygon.next(queryPolygon);
  }
}
