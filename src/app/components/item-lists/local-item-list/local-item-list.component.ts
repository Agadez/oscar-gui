import { Component, OnInit, NgZone } from "@angular/core";
import { OscarItem } from "src/app/models/oscar/oscar-item";
import { ItemStoreService } from "src/app/services/data/item-store.service";
import { MapService } from "src/app/services/map/map.service";
import { OscarItemsService } from "src/app/services/oscar/oscar-items.service";

@Component({
  selector: "app-local-item-list",
  templateUrl: "./local-item-list.component.html",
  styleUrls: ["./local-item-list.component.sass"],
})
export class LocalItemListComponent implements OnInit {
  constructor(
    private store: ItemStoreService,
    private oscarService: OscarItemsService,
    private mapService: MapService,
    private zone: NgZone
  ) {}

  fetchCount = 20;
  listedItems: OscarItem[] = [];
  currentItems: Set<number> = new Set();
  detail = false;
  detailItem: OscarItem;
  markerId = "Selected Item";

  ngOnInit(): void {
    this.store.currentItemsIds$.subscribe((items) => {
      this.currentItems = items;
      this.listedItems = [];
      this.queryNewItems();
    });
  }
  onScrollDown() {
    this.queryNewItems();
  }
  queryNewItems() {
    if (
      this.listedItems.length > 0 &&
      this.listedItems.length < this.fetchCount
    ) {
      return;
    }
    const currentLength = this.listedItems.length;
    this.oscarService
      .getItemsInfoByIds(
        Array.from(this.currentItems).slice(
          currentLength,
          currentLength + this.fetchCount
        )
      )
      .subscribe((items) => {
        this.zone.run(() => this.listedItems.push(...items));
      });
  }
  clickOnItem(item: OscarItem) {
    this.detail = true;
    this.zone.run(() => (this.detailItem = item));
    this.mapService.setMarker(item.firstPoint, this.markerId);
  }
  backButtonClick($event: MouseEvent) {
    this.detail = false;
    this.detailItem = null;
    this.mapService.deleteMarker(this.markerId);
  }
  scroll(detailDiv: HTMLDivElement) {
    detailDiv.scrollIntoView({ behavior: "smooth" });
  }
}
