import {
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MapService } from '../../services/map/map.service';
import { RoutingMarker } from '../../models/routing-marker';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import {
  RoutingService,
  RoutingType,
} from '../../services/routing/routing.service';
import { GeoPoint } from '../../models/geo-point';
import { RoutingDataStoreService } from '../../services/data/routing-data-store.service';
import { Subject } from 'rxjs';
import { LeafletEvent } from 'leaflet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs/operators';

declare let L;

// export const removeRoutingPointEvent = new Subject<GeoPoint>();

@Component({
  selector: 'app-route',
  templateUrl: './route.component.html',
  styleUrls: ['./route.component.sass'],
})
export class RouteComponent implements OnInit, OnChanges, OnDestroy {
  constructor(
    private mapService: MapService,
    private zone: NgZone,
    private routingService: RoutingService,
    private routingDataStoreService: RoutingDataStoreService,
    private snackBar: MatSnackBar
  ) {}
  @Input()
  id: string = '';
  @Input()
  active = true;
  @Input()
  color: string;
  @Input()
  initialPoint: { point: GeoPoint; name: string } = null;
  @Input()
  routingMarkers: Array<RoutingMarker> = [];
  routingMarkerLayer = new L.LayerGroup();
  polyLineHoverLayer = new L.LayerGroup();
  polyLine: L.Polyline;
  checkboxActive = false;
  distance: number;
  time: number;
  routingType: RoutingType = RoutingType.Car;
  @Input()
  destroy = false;
  @Input()
  routesVisible = false;

  deprecatedId: string;
  showIdForm = false;
  @Output()
  needIdEvent = new EventEmitter<{
    deprecatedId: string;
    currentId: string;
  }>();
  @Output()
  addTab = new EventEmitter<string>();

  setId() {
    if (this.deprecatedId == this.id) return;
    if (this.id == undefined) return;
    if (!this.routingDataStoreService.routesToAdd.has(this.id)) {
      this.routingDataStoreService.routesToAdd.set(this.id, {
        geoPoints: this.routingMarkers.map(value => value.geoPoint),
        routingType: this.routingType,
      });
      if (this.routingDataStoreService.routesToAdd.has(this.deprecatedId))
        this.routingDataStoreService.routesToAdd.delete(this.deprecatedId);
      this.needIdEvent.emit({
        deprecatedId: this.deprecatedId,
        currentId: this.id,
      });
      this.deprecatedId = this.id;
    }
  }
  ngOnInit(): void {
    this.deprecatedId = this.id;
    let init = true;
    this.polyLine = L.polyline([], {
      color: this.color,
      weight: 4,
      opacity: 1,
      smoothFactor: 1,
    });
    this.mapService._route.next(true);
    this.mapService.onClick$.subscribe(event => {
      if (!event || init || !this.active || !this.routesVisible) {
        return;
      }
      this.zone.run(() => {
        this.addRoutingPoint({
          point: new GeoPoint(event.latlng.lat, event.latlng.lng),
          name: '',
        });
      });
    });
    if (this.initialPoint) {
      this.addRoutingPoint(this.initialPoint);
    }
    this.routingService.addRoutingPointEvent.asObservable().subscribe(point => {
      if (init) {
        return;
      }
      if (!this.active) {
        return;
      }

      this.addRoutingPoint(point);
    });

    this.mapService.onMapReady$.subscribe(mapReady => {
      if (mapReady) {
        this.mapService._map.addLayer(this.routingMarkerLayer);
        this.mapService._map.addLayer(this.polyLine);
        this.mapService._map.addLayer(this.polyLineHoverLayer);
      }
    });
    init = false;
  }
  ngOnChanges(changes: SimpleChanges): void {}
  ngOnDestroy(): void {
    this.clearList();
    this.active = false;
  }
  addRoutingPoint({ point, name }) {
    const routingMarker = {
      color: this.getRandomColor(),
      geoPoint: { lat: point.lat, lng: point.lng },
      name,
    };
    this.routingMarkers.push(routingMarker);
    this.drawMarkers();
    this.updateRoute();
  }
  getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  drop(event: CdkDragDrop<RoutingMarker[]>) {
    moveItemInArray(
      this.routingMarkers,
      event.previousIndex,
      event.currentIndex
    );
    this.updateRoute();
  }
  updateRoute() {
    this.routingService
      .getRoute(
        this.routingMarkers.map(marker => marker.geoPoint),
        1000,
        this.routingType
      )
      .subscribe(result => {
        if (!result) {
          this.snackBar.open('No Route!', 'close', {
            duration: 2000,
          });
        }
        this.drawRoute(
          result.path.map(point => new GeoPoint(point[0], point[1]))
        );
        this.addToSearch();
        this.time = result.distance;
      });
  }
  calcDistance() {
    let previousPoint: L.LatLng = null;
    let distance = 0;
    this.polyLine.getLatLngs().forEach(currLatLng => {
      if (previousPoint) {
        distance += previousPoint.distanceTo(currLatLng);
      }
      previousPoint = currLatLng;
    });
    this.distance = distance / 1000;
  }
  drawRoute(route: GeoPoint[]) {
    this.polyLine.setLatLngs([]);
    const latLngs = [];
    for (const point of route) {
      latLngs.push(L.latLng([point.lat, point.lng]));
    }
    this.polyLine.setLatLngs(latLngs);
    this.calcDistance();
  }

  clearList() {
    this.polyLine.setLatLngs([]);
    this.routingMarkerLayer.clearLayers();
    this.routingMarkers = [];
    this.checkboxActive = false;
    this.distance = null;
    this.time = null;
    this.addToSearch();
  }

  addToSearch() {
    if (this.id !== undefined) {
      this.routingDataStoreService.routesToAdd.set(this.id, {
        geoPoints: this.routingMarkers.map(value => value.geoPoint),
        routingType: this.routingType,
      });
    }
  }

  addToSearchCheckbox() {
    if (this.checkboxActive) {
      this.routingDataStoreService.routesToAdd.set(this.color, {
        geoPoints: this.routingMarkers.map(value => value.geoPoint),
        routingType: this.routingType,
      });
    } else {
      this.routingDataStoreService.routesToAdd.delete(this.color);
    }
  }

  removePoint(color: string) {
    this.routingMarkers = this.routingMarkers.filter(
      value => value.color !== color
    );
    this.updateRoute();
    this.drawMarkers();
  }
  drawMarkers() {
    this.routingMarkerLayer.clearLayers();
    for (const routingMarker of this.routingMarkers) {
      const redMarker = L.VectorMarkers.icon({
        icon: 'location',
        markerColor: routingMarker.color,
      });
      const marker = L.marker(
        [routingMarker.geoPoint.lat, routingMarker.geoPoint.lng],
        { icon: redMarker, draggable: true }
      );
      marker.addTo(this.routingMarkerLayer);
      const dragSubject = new Subject<LeafletEvent>();
      marker.on('drag', (event: LeafletEvent) => dragSubject.next(event));
      dragSubject
        .pipe(debounceTime(this.routingService.debounceTime))
        .subscribe(event => this.markerDragHandler(event));
      routingMarker.leafletId = marker._leaflet_id;
    }
  }
  async markerDragHandler(event) {
    this.routingMarkers[this.findMarker(event.target._leaflet_id)].geoPoint =
      new GeoPoint(event.target._latlng.lat, event.target._latlng.lng);
    this.updateRoute();
  }
  findMarker(leafletId: number) {
    for (let i = 0; i < this.routingMarkers.length; i++) {
      if (this.routingMarkers[i].leafletId === leafletId) {
        return i;
      }
    }
    return -1;
  }
  updateRoutingType() {
    this.updateRoute();
  }
  toHHMMSS(secNum: number) {
    console.log(secNum);
    const hours = Math.floor(secNum / 3600);
    const minutes = Math.floor((secNum - hours * 3600) / 60);
    const seconds = secNum - hours * 3600 - minutes * 60;

    let result: string = '';

    result += hours + 'h ';
    if (minutes < 10) {
      result += '0' + minutes + 'm ';
    } else result += minutes + 'm ';
    if (seconds < 10) {
      result += '0' + seconds + 's';
    } else result += seconds + 's';
    return result;
  }
  formatLabel(value: number) {
    return Math.round(value) + 'km';
  }

  emitNewTab() {
    this.addTab.emit();
  }
}
