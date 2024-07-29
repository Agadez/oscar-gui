import {
  Component,
  Input,
  NgZone,
  OnInit,
  SimpleChanges,
  ViewChild,
  OnChanges,
} from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { activateRouting } from '../search/search.component';
import { RoutingService } from 'src/app/services/routing/routing.service';
import { Route } from '../../models/routing/route.model';

import { MatTabGroup } from '@angular/material/tabs';

@Component({
  selector: 'app-routes',
  templateUrl: './routes.component.html',
  styleUrls: ['./routes.component.sass'],
})
export class RoutesComponent implements OnInit, OnChanges {
  @ViewChild('tabs', { static: false }) activeTab: MatTabGroup;
  @Input()
  routesVisible = false;
  routes: Route[] = [];
  colorIndex = -1;

  constructor(
    private zone: NgZone,
    public routingService: RoutingService
  ) {}

  emit(IdInfo: { deprecatedId: string; currentId: string }) {
    console.log(IdInfo);
    this.routes.find(value => value.id === IdInfo.deprecatedId).id =
      IdInfo.currentId;
  }
  ngOnInit(): void {
    this.routingService.addRoutingPointEvent.subscribe(point => {
      if (this.routingService.routesEmpty) {
        activateRouting.next(true);
        this.addTab(point);
      }
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.routesVisible) {
      if (this.routesVisible && this.routes.length === 0) {
        this.addTab();
      }
    }
  }
  addTab(initialPoint = null) {
    const route = new Route(
      false,
      (this.routes.length + 1).toString(),
      this.getColor(),
      initialPoint,
      false
    );

    console.log(route.id);
    this.routes.push(route);
    this.routingService.routesEmpty = false;

    const tabGroup = this.activeTab;
    if (!tabGroup || !(tabGroup instanceof MatTabGroup)) return;
    tabGroup.selectedIndex = tabGroup._allTabs.length;
  }

  changeTab($event: MatTabChangeEvent) {
    if (this.routes.length === 0) {
      return;
    }
    for (const route of this.routes) {
      route.active = false;
    }
    this.routes[$event.index].active = true;
  }
  getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  getColor(): string {
    const colors = [
      '#7C31E0',
      '#E09A3D',
      '#253BE0',
      '#E0DB10',
      '#1B9AE0',
      '#E0510B',
      '#4DE016',
      '#E00900',
      '#16E0CF',
      '#E00BC8',
    ];
    this.colorIndex++;
    if (this.colorIndex >= colors.length - 1) this.colorIndex = 0;
    return colors[this.colorIndex];
  }
  closeTab(route: {
    active: boolean;
    id: string;
    color: string;
    destroyed: boolean;
  }) {
    this.zone.run(
      () =>
        (this.routes.find(value => value.color === route.color).destroyed =
          true)
    );
    this.routes = this.routes.filter(value => value.color !== route.color);
    this.routingService.routesEmpty = this.routes.length === 0;
  }
}
