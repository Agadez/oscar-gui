import { Component, OnInit } from "@angular/core";
import { SearchService } from "src/app/services/search/search.service";
import { PolygonServiceService } from "src/app/services/polygon-service.service";
import { RoutingService } from "src/app/services/routing/routing.service";

@Component({
  selector: "app-preference",
  templateUrl: "./preference.component.html",
  styleUrls: ["./preference.component.sass"],
})
export class PreferenceComponent implements OnInit {
  constructor(
    private searchService: SearchService,
    private polygonService: PolygonServiceService,
    private routingService: RoutingService
  ) {}
  polygonAccuracy: string;
  maxItems: number;
  localSearch: boolean;
  markerThreshold: number;
  debounceTime: number;
  ngOnInit(): void {
    this.maxItems = this.searchService.maxItems;
    this.localSearch = this.searchService.localSearch;
    this.markerThreshold = this.searchService.markerThreshold;
    this.debounceTime = this.routingService.debounceTime;
  }
  updateMaxItems() {
    this.searchService.maxItems = this.maxItems;
  }
  updateLocalSearch() {
    this.searchService.localSearch = this.localSearch;
  }
  updatePolygonAccuracy() {
    this.polygonService.polygonAccuracy = this.polygonAccuracy;
    this.polygonService.updateQueryString();
  }
  updateMarkerThreshold() {
    this.searchService.markerThreshold = this.markerThreshold;
  }
  updateDebounceTime() {
    this.routingService.debounceTime = this.debounceTime;
  }
}
