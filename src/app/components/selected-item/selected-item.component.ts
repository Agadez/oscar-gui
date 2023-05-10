import { Component, OnInit } from "@angular/core";
import { OscarItem } from "../../models/oscar/oscar-item";
import { SelectedItemService } from "../../services/ui/selected-item.service";
import { addRoutingPointEvent } from "../routes/routes.component";
import { GeoPoint } from "../../models/geo-point";

@Component({
  selector: "app-selected-item",
  templateUrl: "./selected-item.component.html",
  styleUrls: ["./selected-item.component.sass"],
})
export class SelectedItemComponent implements OnInit {
  constructor(public selectedItemService: SelectedItemService) {
    selectedItemService.subject.subscribe((item) => {
      this.item = item;
    });
  }
  expanded = false;
  item: OscarItem;
  ngOnInit(): void {}
  close() {
    this.selectedItemService.subject.next(null);
  }
  addToRoute() {
    addRoutingPointEvent.next({
      point: new GeoPoint(
        (this.item.geometry as any).coordinates[1],
        (this.item.geometry as any).coordinates[0]
      ),
      name: this.item.properties.name,
    });
  }
  showInfo() {
    this.expanded = !this.expanded;
    // let oscarItem = new OscarItem();
  }
}
