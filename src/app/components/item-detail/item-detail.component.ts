import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { OscarItem } from '../../models/oscar/oscar-item';
import { ItemStoreService } from '../../services/data/item-store.service';
import { MapService } from '../../services/map/map.service';
import { LocationService } from '../../services/location.service';
import { GeoPoint } from '../../models/geo-point';
import { RoutingService } from 'src/app/services/routing/routing.service';

@Component({
  selector: 'app-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.sass'],
})
export class ItemDetailComponent implements OnInit {
  @Input() oscarItem: OscarItem;
  @Input() parent: string;
  @Output()
  public itemClick = new EventEmitter<OscarItem>();
  keyValues: object[] = [];
  distance = null;

  constructor(
    private itemStore: ItemStoreService,
    private mapService: MapService,
    private locationService: LocationService,
    private routingService: RoutingService
  ) {}

  ngOnInit() {
    OscarItem.setName(this.oscarItem);
    /*
    this.locationService.getPosition().then(pos => {
      this.distance =
        this.locationService.getDistanceFromLatLonInKm(pos.lat,
        pos.lng, this.oscarItem.firstPoint.lat, this.oscarItem.firstPoint.lon).toFixed(3);
    }, () => {
    });
     */
  }

  panTo() {
    this.mapService.setView(
      this.oscarItem.firstPoint.lat,
      this.oscarItem.firstPoint.lon,
      18
    );
  }

  addToRouting() {
    this.routingService.addRoutingPointEvent.next({
      point: new GeoPoint(
        this.oscarItem.firstPoint.lat,
        this.oscarItem.firstPoint.lon
      ),
      name: this.oscarItem.properties.name,
    });
  }

  handleClick(_event: MouseEvent) {
    this.itemClick.emit(this.oscarItem);
  }
}
