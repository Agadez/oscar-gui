import { Injectable, NgZone } from "@angular/core";
import { ItemStoreService } from "../data/item-store.service";
import { OscarMinItem } from "../../models/oscar/oscar-min-item";
import { GeoPoint } from "../../models/geo-point";
import { BehaviorSubject, forkJoin } from "rxjs";
import "../../../../node_modules/leaflet-webgl-heatmap/src/webgl-heatmap/webgl-heatmap";
import { v4 as uuidv4 } from "uuid";
import { PolygonNode } from "src/app/models/polygon/polygon-node.model";
import { OscarItemsService } from "../oscar/oscar-items.service";
import { RoutingMarker } from "../../models/routing-marker";
import { PolygonService } from "../polygon-service.service";
import {
  CircleMarker,
  LatLng,
  LatLngBounds,
  LayerGroup,
  Map as LeafletMap,
  Marker,
  Polygon,
  latLng,
} from "leaflet";

import { Region } from "../../models/oscar/region";
import { OscarItem } from "../../models/oscar/oscar-item";
import { SelectedItemService } from "../ui/selected-item.service";
import { ConfigService } from "src/app/config/config.service";
import { SearchResultViewComponent } from "src/app/components/search-result-view/search-result-view.component";
import "leaflet.heat";
import "leaflet.awesome-markers";
import { Cell } from "src/app/models/cell/cell.model";
import { maxBy, meanBy } from "lodash";
declare var L;

@Injectable({
  providedIn: "root",
})
export class MapService {
  lat: number;
  lng: number;
  sharedZoom: number;
  shared: boolean = false;
  routingMarkers = new Map<string, L.Marker>();
  polygons = new Map<uuidv4, [L.Polygon, L.Marker[]]>();
  maxZoom = 20;
  heatmap = new L.webGLHeatmap({
    size: 10,
    units: "px",
    alphaRange: 1,
  });
  searchMarkerLayer = new L.LayerGroup();
  routingMarkerLayer = new L.LayerGroup();
  nodeLayer = new L.LayerGroup();
  polygonLayer = new L.LayerGroup();
  regionLayer = new L.LayerGroup();
  rectLayer = new L.LayerGroup();
  zoom: number;
  _route = new BehaviorSubject<any>(null);
  private readonly _zoom = new BehaviorSubject<any>(null);
  readonly onZoom$ = this._zoom.asObservable();
  private readonly _move = new BehaviorSubject<any>(null);
  readonly onMove$ = this._move.asObservable();
  private readonly _moved = new BehaviorSubject<any>(null);
  readonly onMoved$ = this._moved.asObservable();
  private readonly _click = new BehaviorSubject<any>(null);
  readonly onClick$ = this._click.asObservable();
  private readonly _contextMenu = new BehaviorSubject<any>(null);
  readonly onContextMenu$ = this._contextMenu.asObservable();
  readonly _mapReady = new BehaviorSubject<boolean>(false);
  readonly onMapReady$ = this._mapReady.asObservable();
  _map: LeafletMap;
  route: L.Polyline = L.polyline([], {
    color: "red",
    weight: 3,
    opacity: 0.5,
    smoothFactor: 1,
  });
  constructor(
    private itemStore: ItemStoreService,
    private zone: NgZone,
    private oscarItemsService: OscarItemsService,
    private selectedItemService: SelectedItemService,
    private configService: ConfigService,
    private polygonService: PolygonService
  ) {}

  setView(lat: number, lng: number, zoom: number) {
    // @ts-ignore
    this._map.setView([lat, lng], zoom);
  }
  get bounds() {
    // @ts-ignore
    return this._map.getBounds();
  }
  get pixelBounds() {
    return this._map.getPixelBounds();
  }
  get map() {
    return this._map;
  }
  setSharedState(lat, lng, zoom) {
    this.lat = lat;
    this.lng = lng;
    this.sharedZoom = zoom;
    this.shared = true;
  }
  setMarker(geoPoint: GeoPoint, name: string): L.Marker {
    if (this.routingMarkers.has(name)) {
      this.routingMarkers.get(name).setLatLng([geoPoint.lat, geoPoint.lng]);
    } else {
      // @ts-ignore
      const marker = L.marker([geoPoint.lat, geoPoint.lng]);

      marker.addTo(this.routingMarkerLayer).bindPopup(name).openPopup();
      this.routingMarkers.set(name, marker);
      return marker;
    }
  }
  setMapReady(condition: boolean) {
    // @ts-ignore
    this.route.addTo(this.map);
    // this.heatmapLayer.addTo(this.map);
    this._mapReady.next(condition);
    this.searchMarkerLayer.addTo(this.map);
    this.map.addLayer(this.heatmap);
    this.map.addLayer(this.routingMarkerLayer);
    this.map.addLayer(this.rectLayer);
    this.map.addLayer(this.regionLayer);
    this.map.addLayer(this.polygonLayer);
    this.map.addLayer(this.nodeLayer);

    // actually not used since move is triggered on zoom aswell
    this.map.on("zoomend", (event) => {
      this.zoom = event.target._zoom;
      this._zoom.next(event);
    });

    this.map.on("move", (event) => {
      this.zoom = event.target._zoom;
      this._move.next(event);
    });
    this.map.on("moveend", (event) => {
      this._moved.next(event);
    });
    this.map.on("click", (event) => this._click.next(event));
    this.map.on("contextmenu", (event) => {
      this._contextMenu.next(event);
    });
  }

  drawPolygon(polygonNodes: PolygonNode[], uuid: uuidv4, color: string) {
    if (this.polygons.has(uuid)) {
      this.polygonLayer.removeLayer(this.polygons.get(uuid)[0]);
      this.polygons.get(uuid)[1].forEach((node) => {
        this.nodeLayer.removeLayer(node);
      });
    }
    let polygon = L.polygon([], {
      color: color,
      weight: 4,
      opacity: 1,
      smoothFactor: 1,
    });
    let nodes: L.Marker[] = [];
    const markerHtmlStyles = `
    width: 1.5rem;
    height: 1.5rem;
    left: -0.5rem;
    top: -0.5rem;
    display: block;
    position: relative;
    border-radius: 50%`;
    for (const node of polygonNodes) {
      var icon = new L.divIcon({
        html: `<span style= "background-color: ${node.color};${markerHtmlStyles}"></span>`,
      });
      const marker = L.marker([node.lat, node.lng], {
        icon: icon,
        draggable: true,
      });
      marker.on("dragend", () => {
        this.polygonService.dragNode(uuid, node.uuid, marker.getLatLng());
        this.drawPolygon(polygonNodes, uuid, color);
      });
      this.nodeLayer.addLayer(marker);
      nodes.push(marker);
      polygon.addLatLng([node.lat, node.lng]);
    }
    this.polygons.set(uuid, [polygon, nodes]);
    this.polygonLayer.addLayer(polygon);
  }
  drawRoute(route: GeoPoint[]) {
    this.route.setLatLngs([]);
    const latLngs = [];
    for (const point of route) {
      latLngs.push(L.latLng([point.lat, point.lng]));
    }
    this.route.setLatLngs(latLngs);
  }
  drawItemsHeatmap(
    items: OscarMinItem[],
    cells: Cell[],
    intensity: number,
    pixel: number,
    scale: number
  ) {
    if (cells.length === 0) return;
    let base = 1.2;
    const dataPoints = [];
    const max = maxBy(cells, "numObjects").numObjects;
    const maxLog = this.getBaseLog(base, max);
    for (const cell of cells) {
      let logValue =
        this.getBaseLog(base, cell.numObjects) < 1
          ? 1
          : this.getBaseLog(base, cell.numObjects);
      const intensityFactor = 0.2 + 0.8 * (logValue / maxLog);
      if (cell.numObjects > 0) {
        dataPoints.push([cell.lat, cell.lng, intensity * intensityFactor]);
      }
    }
    this.heatmap.size = pixel;
    this.heatmap.setData(dataPoints);
    if (this.shared) {
      this._map.setView([this.lat, this.lng], this.sharedZoom);
      this.shared = false;
    }
  }
  chunkItems(items: OscarMinItem[], chunkSize: number): OscarMinItem[][] {
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      chunks.push(chunk);
    }
    return chunks;
  }
  drawItemsMarker(items: OscarMinItem[]) {
    const currentItemsIds: number[] = [];
    const chunks = this.chunkItems(items, 2000);
    const observables = [];
    for (const chunk of chunks) {
      const obs = this.oscarItemsService.getMultipleItems(chunk);
      observables.push(obs);
    }
    this.searchMarkerLayer.clearLayers();
    forkJoin(observables).subscribe((dataArray: any) => {
      let itemFeatures = [];
      dataArray.forEach((data) => {
        itemFeatures = [...itemFeatures, ...data.features];
      });
      // draw markers
      itemFeatures.forEach((item) => {
        if (item.geometry.type === "LineString") {
          if (this.getIcon(item)) {
            this.drawGeoJSON({
              type: item.type,
              properties: item.properties,
              geometry: {
                type: "Point",
                coordinates: item.geometry.coordinates[0],
              },
            });
          }
        }

        const insideBounding = this.drawGeoJSON(item);
        if (insideBounding) currentItemsIds.push(item.properties.id);
      });
      if (
        JSON.stringify([...this.itemStore.currentItemsIds]) !==
        JSON.stringify(currentItemsIds)
      ) {
        this.itemStore.currentItemsIds = new Set(currentItemsIds);
      }
    });
  }

  private getIcon(item) {
    for (var i = 0; i < item.properties.k.length; i++) {
      var key = item.properties.k[i];
      if (this.configService.iconMapping[key] !== undefined) {
        var value = item.properties.v[i];
        if (this.configService.iconMapping[key][value] !== undefined) {
          return this.configService.iconMapping[key][value];
        }
      }
    }
    return undefined;
  }
  private drawGeoJSON(item): boolean {
    var icon = this.getIcon(item);
    const smallIcon = L.AwesomeMarkers.icon({
      icon: icon,
      prefix: "fa",
      iconColor: "white",
      markerColor: "green",
    });
    const shape = L.geoJSON(item, {
      title: `${item.properties.id}`,
      pointToLayer: (_, latlng) => {
        return L.marker(latlng, {
          icon: smallIcon,
        });
      },
      onEachFeature: (feature, layer) => {
        layer.on("click", (event) => {
          this.selectedItemService.subject.next(item);
          // layer.options.icon.options.markerColor = "red";
          layer.pointToLayer = L.marker(layer.pointToLayer);
          layer.bindPopup(
            feature.properties.v[item.properties.k.indexOf("name")]
          );
        });
        layer.on("mouseover", (event) => {
          layer.bindPopup("");
        });
      },
      style: { color: "blue", stroke: true, fill: false, opacity: 0.7 },
    });

    if (this.bounds.intersects(shape.getBounds())) {
      shape.addTo(this.searchMarkerLayer);
      return true;
    }
    return false;
  }
  drawRegion(region: OscarItem) {
    this.clearRegions();
    const feature = L.geoJSON(region.geometry).addTo(this.regionLayer);
    this.fitBounds(feature.getBounds());
  }

  drawRoutingMarker(routingMarkers: RoutingMarker[]) {
    // Creates a red marker with the coffee icon
  }
  clearRegions() {
    this.regionLayer.clearLayers();
  }
  clearHeatMap() {
    this.heatmap.setData([]);
  }
  clearSearchMarkers() {
    this.searchMarkerLayer.clearLayers();
  }
  clearRoutingMarkers() {
    this.routingMarkerLayer.clearLayers();
  }
  clearPolygon(uuid: uuidv4) {
    if (!this.polygons.has(uuid)) return;
    this.polygonLayer.removeLayer(this.polygons.get(uuid)[0]);
    for (const node of this.polygons.get(uuid)[1]) {
      this.nodeLayer.removeLayer(node);
    }
    this.polygons.set(uuid, [L.polygon, []]);
    this.clearHeatMap();
    this.clearSearchMarkers();
  }

  clearAllLayers() {
    this.clearHeatMap();
    this.clearRoutingMarkers();
    this.clearSearchMarkers();
  }
  fitBounds(bounds: L.LatLngBounds) {
    if (bounds.getNorthEast().lat === 100000) {
      bounds = new LatLngBounds(
        new LatLng(55.203953, 4.21875),
        new LatLng(47.219568, 14.897462)
      );
    }
    this.map.fitBounds(bounds);
  }
  drawRect(
    id: string,
    bounds: L.LatLngBounds,
    color: string,
    weight: number,
    hover: string
  ) {
    const rect = L.rectangle(bounds, { color, weight })
      .bindTooltip(hover)
      .addTo(this.rectLayer);
  }
  clearRects() {
    this.rectLayer.clearLayers();
  }
  deleteMarker(id: string) {
    if (this.routingMarkers.has(id)) {
      this.routingMarkers.get(id).removeFrom(this.map);
      this.routingMarkers.delete(id);
    }
  }
  get ready() {
    return this._mapReady.value;
  }
  getBaseLog(base, value) {
    return Math.log(value) / Math.log(base);
  }
}
