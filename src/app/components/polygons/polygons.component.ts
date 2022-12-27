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

@Component({
  selector: "app-polygons",
  templateUrl: "./polygons.component.html",
  styleUrls: ["./polygons.component.sass"],
})
export class PolygonsComponent implements OnInit {
  constructor(
    private zone: NgZone,
    private mapService: MapService,
    private polygonService: PolygonServiceService
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
    this.polygonService.inSearch.subscribe((uuid) => {
      for (const polygon of this.polygons) {
        if (uuid === polygon.uuid) {
          polygon.inSearch = !polygon.inSearch;
          if (polygon.inSearch) polygon.color = "#007bff";
          else polygon.color = "#808080";
          this.polygonService.polygonInSearch.next({
            uuid: polygon.uuid,
            color: polygon.color,
          });
          break;
        }
      }
    });
  }

  addTab() {
    this.polygons.push({
      active: true,
      name: "",
      uuid: uuidv4(),
      color: "#808080",
      inSearch: false,
    });
    if (this.polygonsEmpty) {
      this.polygonsEmpty = false;
      return;
    }
    for (const polygon of this.polygons) {
      polygon.active = false;
    }
    this.polygons[this.polygons.length - 1].active = true;
    const tabGroup = this.activeTab;
    if (!tabGroup || !(tabGroup instanceof MatTabGroup)) return;
    tabGroup.selectedIndex = this.polygons.length - 1;
  }
  changeTab($event: MatTabChangeEvent) {
    let index = $event.index;
    if (this.polygonsEmpty) {
      return;
    }
    for (const polygon of this.polygons) {
      polygon.active = false;
      if (!polygon.inSearch) this.polygonService.tabChanged.next(polygon.uuid);
    }
    this.polygons[index].active = true;
    this.polygonService.tabActivated.next(this.polygons[index].uuid);
  }
  closeTab(polygon: {
    active: boolean;
    name: string;
    uuid: uuidv4;
    color: string;
    destroyed: boolean;
  }) {
    this.polygons = this.polygons.filter(
      (value) => value.uuid !== polygon.uuid
    );
    this.polygonService.tabClosed.next(polygon.uuid);
    this.polygonsEmpty = this.polygons.length === 0;
    if (!this.polygonsEmpty)
      this.polygonService.tabActivated.next(
        this.polygons[this.activeTab.selectedIndex].uuid
      );
  }
}
