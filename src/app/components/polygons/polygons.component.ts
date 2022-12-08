import {
  Component,
  Input,
  Output,
  OnInit,
  NgZone,
  ViewChild,
} from "@angular/core";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { GeoPoint } from "../../models/geo-point";
import { MatTabGroup } from "@angular/material/tabs";
import { v4 as uuidv4 } from "uuid";
import { BehaviorSubject } from "rxjs";

export const tabClosed = new BehaviorSubject(false);
@Component({
  selector: "app-polygons",
  templateUrl: "./polygons.component.html",
  styleUrls: ["./polygons.component.sass"],
})
export class PolygonsComponent implements OnInit {
  constructor(private zone: NgZone) {}

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
    destroyed: boolean;
  }[] = [];
  ngOnInit(): void {}

  addTab() {
    this.polygons.push({
      active: true,
      name: "",
      uuid: uuidv4(),
      color: this.getRandomColor(),
      destroyed: false,
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
    if (this.polygonsEmpty) {
      return;
    }
    for (const polygon of this.polygons) {
      polygon.active = false;
    }
    this.polygons[$event.index].active = true;
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
    tabClosed.next(polygon.uuid);
    this.polygonsEmpty = this.polygons.length === 0;
  }
  getRandomColor(): string {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}
