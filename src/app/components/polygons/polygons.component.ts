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

  @Input()
  polygonVisible = false;

  @Output()
  polygonsEmpty = true;

  @ViewChild("tabs", { static: false }) activeTab: MatTabGroup;
  polygons: {
    active: boolean;
    name: string;
    uuid: uuidv4;
    color: string;
    inSearch: boolean;
  }[] = [];
  ngOnInit(): void {
    // this.polygonService.inSearch.subscribe((uuid) => {
    //   for (const polygon of this.polygons) {
    //     if (uuid === polygon.uuid) {
    //       polygon.inSearch = !polygon.inSearch;
    //       if (polygon.inSearch) polygon.color = "#007bff";
    //       else polygon.color = "#808080";
    //       this.polygonService.polygonInSearch.next({
    //         uuid: polygon.uuid,
    //         color: polygon.color,
    //       });
    //       break;
    //     }
    //   }
    // });
  }
  addTab() {
    console.log("hi");
    this.polygonService.addPolygon(uuidv4(), []);

    // this.polygons.push({
    //   active: true,
    //   name: "",
    //   uuid: uuidv4(),
    //   color: "#007bff",
    //   inSearch: false,
    // });
    if (this.polygonsEmpty) {
      this.polygonsEmpty = false;
      return;
    }
    console.log("jo");
    // for (const polygon of this.polygons) {
    //   polygon.active = false;
    // }
    // this.polygons[this.polygons.length - 1].active = true;
    const tabGroup = this.activeTab;
    console.log("jo");
    if (!tabGroup || !(tabGroup instanceof MatTabGroup)) return;
    console.log("jo");
    tabGroup.selectedIndex = 0;
  }
  changeTab($event: MatTabChangeEvent) {
    let index = $event.index;
    if (this.polygonsEmpty) {
      return;
    }
    // for (const polygon of this.polygons) {
    //   polygon.active = false;
    //   if (!polygon.inSearch) this.polygonService.tabChanged.next(polygon.uuid);
    // }
    // this.polygons[index].active = true;
    this.polygonService.tabActivated.next(this.polygons[index].uuid);
  }
  closeTab(uuid: uuidv4) {
    this.polygonService.tabClosed.next(uuid);
    // this.polygonsEmpty = this.polygons.length === 0;
    if (!this.polygonsEmpty)
      this.polygonService.tabActivated.next(
        this.polygons[this.activeTab.selectedIndex].uuid
      );
  }
}
