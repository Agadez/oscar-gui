import { Component, Input, OnInit, NgZone, OnDestroy } from "@angular/core";
import { MapService } from "src/app/services/map/map.service";
import { PolygonNode } from "src/app/models/polygon-node.model";
import { Subject } from "rxjs";
import { LeafletEvent, Polygon } from "leaflet";
import { debounceTime } from "rxjs/operators";
import { GeoPoint } from "../../models/geo-point";
import { GeoPointId } from "../../models/geo-point-id.model";
import { v4 as uuidv4 } from "uuid";
import { OscarItemsService } from "../../services/oscar/oscar-items.service";
import { PolygonServiceService } from "../../services/polygon-service.service";
import { activateRouting } from "../search/search.component";

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
    private oscarItemsService: OscarItemsService,
    private polygonService: PolygonServiceService
  ) {}

  @Input()
  active = true;
  @Input()
  polygonVisible = false;
  @Input()
  color = "red";
  inSearch = false;
  @Input()
  uuid = uuidv4();
  mapPolygon: L.Polygon;
  nodes: Array<PolygonNode> = [];
  nodeLayer = new L.LayerGroup();
  polygonLayer = new L.LayerGroup();

  routeActivated = false;

  ngOnInit(): void {
    let init = true;
    this.mapPolygon = L.polygon([], {
      color: this.color,
      weight: 4,
      opacity: 1,
      smoothFactor: 1,
    });
    this.mapService._route.subscribe((route) => {
      this.routeActivated = route;
      console.log("route: ", this.routeActivated);
    });
    this.mapService.onClick$.subscribe((event) => {
      console.log("click ", this.routeActivated);
      if (
        !event ||
        !this.active ||
        !this.polygonVisible ||
        init ||
        this.routeActivated
      ) {
        return;
      }
      this.addNode({
        point: new GeoPointId(event.latlng.lat, event.latlng.lng, this.uuid),
        name: "",
        uuid: uuidv4(),
      });
    });
    this.mapService.onMapReady$.subscribe((mapReady) => {
      if (mapReady) {
        this.mapService._map.addLayer(this.nodeLayer);
        this.mapService._map.addLayer(this.polygonLayer);
      }
    });
    this.polygonService.tabClosed.subscribe((uuid) => {
      if (this.uuid == uuid) this.clearList();
    });
    this.polygonService.tabChanged.subscribe((uuid) => {
      if (this.uuid == uuid) this.clearDraw();
    });
    this.polygonService.tabActivated.subscribe((uuid) => {
      if (this.uuid == uuid) this.draw();
      console.log(this.color);
    });
    this.polygonService.polygonInSearch.subscribe((object) => {
      if (this.uuid == object.uuid) {
        this.mapPolygon = L.polygon([], {
          color: object.color,
          weight: 4,
          opacity: 1,
          smoothFactor: 1,
        });
        this.clearDraw();
        this.draw();
      }
    });
    init = false;
  }
  addNode({ point, name, uuid }) {
    const node = {
      color: this.polygonService.getRandomColor(),
      geoPoint: { lat: point.lat, lon: point.lon, uuid: uuid },
      uuid: uuid,
      name,
    };
    this.nodes.push(node);
    this.draw();
    if (this.inSearch) this.polygonProcess(true);
  }

  draw() {
    this.nodeLayer.clearLayers();
    this.polygonLayer.clearLayers();
    let i = 0;
    this.mapPolygon.setLatLngs([]);
    for (const node of this.nodes) {
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
  // async markerDragHandler(event) {
  //   this.nodes[this.findMarker(event.target._leaflet_id)].geoPoint =
  //     new GeoPoint(event.target._latlng.lat, event.target._latlng.lng);
  //   this.draw();
  // }
  findMarker(leafletId: number) {
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].leafletId === leafletId) {
        return i;
      }
    }
    return -1;
  }
  removeNode(uuid: uuidv4) {
    this.nodes = this.nodes.filter((value) => value.uuid !== uuid);
    this.draw();
    if (this.inSearch) {
      this.polygonService.removeNode(uuid);
    }
  }
  ngOnDestroy(): void {
    this.clearList;
    this.active = false;
  }
  clearList() {
    this.nodes = [];
    this.mapPolygon.setLatLngs([]);
    this.polygonLayer.clearLayers();
    this.nodeLayer.clearLayers();
  }
  clearDraw() {
    this.polygonLayer.clearLayers();
    this.nodeLayer.clearLayers();
  }
  polygonProcess($event) {
    this.inSearch = $event;
    let queryPolygon: Array<GeoPointId> = [];
    for (const node of this.nodes) {
      queryPolygon.push(node.geoPoint);
    }
    if ($event) {
      this.polygonService.addPolygon(queryPolygon);
    } else {
      this.polygonService.removePolygon(queryPolygon);
    }
    this.polygonService.inSearch.next(this.uuid);
  }
}
