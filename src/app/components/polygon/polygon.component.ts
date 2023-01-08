import { Component, Input, OnInit, NgZone, OnDestroy } from "@angular/core";
import { MapService } from "src/app/services/map/map.service";
import { PolygonNode } from "src/app/models/polygon/polygon-node.model";
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
    public polygonService: PolygonServiceService
  ) {}

  showNameForm = false;

  @Input()
  polygonVisible = false;

  inSearch = false;
  @Input()
  uuid = uuidv4();
  name = "";
  deprecatedName = "";

  routeActivated = false;

  ngOnInit(): void {
    let init = true;
    // this.polygonService.addPolygon(this.uuid, []);

    this.mapService._route.subscribe((route) => {
      this.routeActivated = route;
    });
    this.mapService.onClick$.subscribe((event) => {
      if (!event || !this.polygonVisible || init || this.routeActivated) {
        return;
      }
      this.polygonService.addNode(
        this.uuid,
        new PolygonNode(
          event.latlng.lat,
          event.latlng.lng,
          uuidv4(),
          this.polygonService.getRandomColor()
        )
      );
      this.draw();
    });
    this.polygonService.tabClosed.subscribe((uuid) => {
      if (this.uuid == uuid) {
        this.clearList();
        this.polygonService.nameMapping.delete(this.name);
      }
    });
    // this.polygonService.tabChanged.subscribe((uuid) => {
    //   if (this.uuid == uuid) this.clearDraw();
    // });
    this.polygonService.tabActivated.subscribe((uuid) => {
      if (this.uuid == uuid) {
        this.draw();
      }
    });
    // this.polygonService.polygonInSearch.subscribe((object) => {
    //   if (this.uuid == object.uuid) {
    //     this.mapPolygon = L.polygon([], {
    //       color: object.color,
    //       weight: 4,
    //       opacity: 1,
    //       smoothFactor: 1,
    //     });
    //     this.clearDraw();
    //     this.draw();
    //   }
    // });
    init = false;
  }
  setName() {
    if (this.deprecatedName == this.name) return;
    if (!this.polygonService.checkName(this.name)) {
      // hier dialog, dass name schon drin is
      this.name = this.deprecatedName;
      this.toggleNameForm();
      console.log(this.name + " already taken");
      return;
    }
    this.polygonService.removeName(this.deprecatedName);
    this.polygonService.addName(this.name, this.uuid);
    this.deprecatedName = this.name;
    this.toggleNameForm();
  }
  toggleNameForm() {
    this.showNameForm = !this.showNameForm;
  }
  draw() {
    this.mapService.clearAllLayers();
    this.mapService.drawPolygon(
      this.polygonService.polygonMapping.get(this.uuid).polygonNodes,
      this.uuid,
      "blue"
    );
  }
  // async markerDragHandler(event) {
  //   this.nodes[this.findMarker(event.target._leaflet_id)].geoPoint =
  //     new GeoPoint(event.target._latlng.lat, event.target._latlng.lng);
  //   this.draw();
  // }

  removeNode(uuid: uuidv4) {
    this.polygonService.removeNode(this.uuid, uuid);
    this.draw();
  }
  ngOnDestroy(): void {
    this.clearList;
  }
  clearList() {
    this.polygonService.clearPolygon(this.uuid);
    this.mapService.clearPolygon(this.uuid);
  }
}
