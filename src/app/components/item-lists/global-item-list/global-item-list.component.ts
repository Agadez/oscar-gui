import { Component, OnInit, NgZone } from '@angular/core';
import { OscarItem } from 'src/app/models/oscar/oscar-item';
import { ItemStoreService } from 'src/app/services/data/item-store.service';
import { OscarItemsService } from 'src/app/services/oscar/oscar-items.service';
import { MapService } from 'src/app/services/map/map.service';
import { GeoPoint } from 'src/app/models/geo-point';

@Component({
  selector: 'app-global-item-list',
  templateUrl: './global-item-list.component.html',
  styleUrls: ['./global-item-list.component.sass'],
})
export class GlobalItemListComponent implements OnInit {
  constructor(
    private store: ItemStoreService,
    private oscarService: OscarItemsService,
    private zone: NgZone,
    private mapService: MapService
  ) {}

  fetchCount = 20;
  listedItems: OscarItem[] = [];
  allItems: number[] = [];
  detail = false;
  detailItem: OscarItem;
  markerId = 'Selected Item';

  ngOnInit(): void {
    this.store.itemsIds.subscribe(items => {
      this.allItems = items;
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
        this.allItems.slice(currentLength, currentLength + this.fetchCount)
      )
      .subscribe(items => {
        this.zone.run(() => this.listedItems.push(...items));
      });
  }
  clickOnItem(item: OscarItem) {
    this.detail = true;
    this.zone.run(() => (this.detailItem = item));
    this.mapService.setMarker(
      new GeoPoint(item.firstPoint.lat, item.firstPoint.lon),
      this.markerId
    );
  }
  backButtonClick($event: MouseEvent) {
    this.detail = false;
    this.detailItem = null;
    this.mapService.deleteMarker(this.markerId);
  }
  scroll(detailDiv: HTMLDivElement) {
    detailDiv.scrollIntoView({ behavior: 'smooth' });
  }
}
