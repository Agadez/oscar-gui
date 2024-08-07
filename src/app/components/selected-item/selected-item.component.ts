import { Component, OnInit } from '@angular/core';
import { OscarItem } from '../../models/oscar/oscar-item';
import { SelectedItemService } from '../../services/ui/selected-item.service';
import { RoutingService } from 'src/app/services/routing/routing.service';
import { GeoPoint } from '../../models/geo-point';

@Component({
  selector: 'app-selected-item',
  templateUrl: './selected-item.component.html',
  styleUrls: ['./selected-item.component.sass'],
})
export class SelectedItemComponent implements OnInit {
  constructor(
    public selectedItemService: SelectedItemService,
    private routingService: RoutingService
  ) {
    selectedItemService.subject.subscribe(item => {
      if (item != null) {
        this.name = item.properties.v[item.properties.k.indexOf('name')];
        this.item = item;
      }
    });
  }
  expanded = false;
  name: string = '';
  item?: OscarItem;
  ngOnInit(): void {}
  close() {
    this.item = null;
    this.selectedItemService.subject.next(null);
  }
  addToRoute() {
    this.routingService.addRoutingPointEvent.next({
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
