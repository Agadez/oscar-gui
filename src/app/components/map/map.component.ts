import {
  Component,
  HostListener,
  NgZone,
  OnInit,
  ViewChild,
} from "@angular/core";
import { latLng, tileLayer, Map } from "leaflet";
import { ItemStoreService } from "../../services/data/item-store.service";
import { MapService } from "../../services/map/map.service";
import { MatMenuTrigger } from "@angular/material/menu";
import { radiusSearchTrigger } from "../search-result-view/search-result-view.component";
import { MatSnackBar } from "@angular/material/snack-bar";
import { RoutingService } from "src/app/services/routing/routing.service";
import { GeoPoint } from "../../models/geo-point";
import { OscarItemsService } from "src/app/services/oscar/oscar-items.service";
import { QueryParamsService } from "src/app/services/query-params.service";

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.sass"],
})
export class MapComponent implements OnInit {
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  i = 0;
  lat = 48.43379;
  lng = 9.00203;
  zoom = 7;
  data = {
    data: [],
  };
  options = {
    layers: [
      tileLayer("https://tiles.fmi.uni-stuttgart.de/{z}/{x}/{y}.png", {
        maxZoom: this.mapService.maxZoom,
        attribution: "...",
      }),
    ],
    zoom: this.zoom,
    center: latLng([this.lat, this.lng]),
  };
  contextMenuX = 10;
  contextMenuY = 10;
  contextMenuLatLng = null;
  constructor(
    private itemStore: ItemStoreService,
    private mapService: MapService,
    private snackBar: MatSnackBar,
    private queryParams: QueryParamsService,
    private routingService: RoutingService
  ) {}

  ngOnInit() {
    this.queryParams.setMap.subscribe((set) => {
      if (set) {
        this.lat = this.queryParams.lat;
        this.lng = this.queryParams.lng;
        this.zoom = this.queryParams.zoom;
        this.mapService._map.setView(latLng([this.lat, this.lng]), this.zoom);
        this.queryParams.setQuery.next(true);
      }
    });
  }

  openContextMenu() {
    this.trigger.openMenu();
  }
  closeContextMenu() {
    this.trigger.closeMenu();
  }

  onMapReady(map: Map) {
    this.mapService._map = map;
    this.mapService.setMapReady(true);
    this.mapService.onContextMenu$.subscribe((event) => {
      if (!event) return;
      console.log(event.latlng);
      this.contextMenuLatLng = event.latlng;
      console.log(event.containerPoint);
      this.contextMenuX = event.containerPoint.x;
      this.contextMenuY = event.containerPoint.y;
      this.openContextMenu();
    });
  }
  @HostListener("document:click")
  leftClick() {
    this.closeContextMenu();
  }
  startRadiusSearch() {
    radiusSearchTrigger.next(this.contextMenuLatLng);
  }
  openCopiedSnackBar() {
    this.snackBar.open("Copied to clipboard!", "Close", {
      duration: 2000,
    });
  }
  addToRouting() {
    this.routingService.addRoutingPointEvent.next({
      point: new GeoPoint(
        this.contextMenuLatLng.lat,
        this.contextMenuLatLng.lng
      ),
      name: "",
    });
  }
}
