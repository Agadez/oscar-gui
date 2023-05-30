import {
  Component,
  Input,
  OnInit,
  NgZone,
  OnDestroy,
  Output,
  EventEmitter,
} from "@angular/core";
import { MapService } from "src/app/services/map/map.service";
import { PolygonNode } from "src/app/models/polygon/polygon-node.model";
import { v4 as uuidv4 } from "uuid";
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
    public polygonService: PolygonServiceService
  ) {}

  showNameForm = false;

  @Output() newNameEvent = new EventEmitter<[uuidv4, string]>();

  @Input()
  polygonVisible = false;
  @Input()
  uuid = uuidv4();
  id = "";
  deprecatedId = "";
  isActive = true;

  routeActivated = false;

  ngOnInit(): void {
    let init = true;

    // Observes if the User is currently planning a Route
    this.mapService._route.subscribe((route) => {
      this.routeActivated = route;
    });

    // Allows the User to create a Polygon by adding a Node when clicking the map
    this.mapService.onClick$.subscribe((event) => {
      console.log(this.isActive);
      if (!event || init || this.routeActivated || !this.isActive) {
        console.log(!event, init, this.routeActivated, !this.isActive);
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

    // Observes if the user closes the Tab of a Polygon and then removes that Polygon from the Dataset and the Map.
    this.polygonService.tabClosed.subscribe((uuid) => {
      if (this.uuid == uuid) {
        this.isActive = false;
        this.clearList();
        this.polygonService.idUuidMap.delete(this.id);
        this.polygonService.polygonMapping.delete(this.uuid);
      }
    });
    // this.polygonService.tabChanged.subscribe((uuid) => {
    //   if (this.uuid == uuid) this.clearDraw();
    // });

    /* Draws a specific Polygon if the Tab of the Polygon is active and deactivates all other Polygons.
     */
    this.polygonService.tabActivated.subscribe((uuid) => {
      if (this.uuid !== uuid) {
        this.isActive = false;
        return;
      }
      this.isActive = true;
      if (
        this.polygonService.polygonMapping.get(uuid).polygonNodes.length != 0
      ) {
        this.draw();
      }
    });
    init = false;
  }

  // Sets the Name of a Polygon and checks whether the Name is chosen already.
  setId() {
    if (this.deprecatedId == this.id) return;
    if (!this.polygonService.checkId(this.id)) {
      // hier dialog, dass name schon drin is
      this.id = this.deprecatedId;
      this.toggleNameForm();
      console.log(this.id + " already taken");
      return;
    }
    this.polygonService.removeId(this.deprecatedId, this.uuid);
    this.polygonService.addId(this.id, this.uuid);
    this.newNameEvent.emit([this.uuid, this.id]);
    this.deprecatedId = this.id;
    this.toggleNameForm();
  }

  // Toggles whether the Name of a Polygon should be shown or not
  toggleNameForm() {
    this.showNameForm = !this.showNameForm;
  }

  // Method to draw a Polygon by using the mapService
  draw() {
    // this.mapService.clearAllLayers();
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

  // Method that removes a Node of a Polygon by using the PolygonService
  removeNode(uuid: uuidv4) {
    this.polygonService.removeNode(this.uuid, uuid);
    this.draw();
  }
  ngOnDestroy(): void {
    this.clearList;
  }

  // Method that clears the Dataset of a Polygon from the PolygonService and clears the Shape from the Map.
  clearList() {
    this.polygonService.clearPolygon(this.uuid);
    this.mapService.clearPolygon(this.uuid);
  }
}
