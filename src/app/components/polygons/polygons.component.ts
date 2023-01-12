import {
  Component,
  Input,
  Output,
  OnInit,
  NgZone,
  ViewChild,
} from "@angular/core";
import { MatTabChangeEvent } from "@angular/material/tabs";

import { MatTabGroup } from "@angular/material/tabs";
import { v4 as uuidv4 } from "uuid";
import { MapService } from "src/app/services/map/map.service";
import { PolygonServiceService } from "src/app/services/polygon-service.service";
import { PolygonNode } from "src/app/models/polygon/polygon-node.model";

@Component({
  selector: "app-polygons",
  templateUrl: "./polygons.component.html",
  styleUrls: ["./polygons.component.sass"],
})
export class PolygonsComponent implements OnInit {
  constructor(
    private zone: NgZone,
    private mapService: MapService,
    public polygonService: PolygonServiceService
  ) {}

  polygonsEmpty = true;
  tabIndexToId : uuidv4[] = [];
  uuidToName = new Map();

  @ViewChild("tabs", { static: false }) activeTab: MatTabGroup;
  ngOnInit(): void {
  }

  // Adds a Tab to the Polygon TabGroup, adds a new Polygon to the Dataset and assures that the Tab and therefor Polygon is selected.
  addTab() {
    const uuid = uuidv4();
    this.polygonService.addPolygon(uuid, []);
    this.tabIndexToId.push(uuid);
    this.uuidToName.set(uuid,"");
    if (this.polygonsEmpty) {
      this.polygonsEmpty = false;
      return;
    }
    const tabGroup = this.activeTab;
    if (!tabGroup || !(tabGroup instanceof MatTabGroup)) return;
    tabGroup.selectedIndex = this.tabIndexToId.length;
  }

  // Method that assures that the selected Tab is activated and can therefor be modified.
  changeTab($event: MatTabChangeEvent) {
    let index = $event.index;
    if (this.polygonsEmpty) {
      return;
    }
    this.polygonService.tabActivated.next(this.tabIndexToId[index]);
  }

  // Method that deletes the Dataset and Shape on the Map of a Polygon whose Tab got closed
  closeTab(uuid: uuidv4) {
    this.polygonService.tabClosed.next(uuid);
    this.polygonService.polygonMapping.delete(uuid);
    this.tabIndexToId.splice(this.tabIndexToId.indexOf(uuid), 1);
    console.log(this.tabIndexToId);
  }

  addName(uuidName){
    this.uuidToName.set(uuidName[0], uuidName[1]);
  }
}
