import { Component, OnInit } from "@angular/core";
import { SearchService } from "src/app/services/search/search.service";
import { PolygonServiceService } from "src/app/services/polygon-service.service";
import { RoutingService } from "src/app/services/routing/routing.service";
import { GridService } from "src/app/services/data/grid.service";

@Component({
  selector: "app-preference",
  templateUrl: "./preference.component.html",
  styleUrls: ["./preference.component.sass"],
})
export class PreferenceComponent implements OnInit {
  constructor(
    private searchService: SearchService,
    private polygonService: PolygonServiceService,
    private routingService: RoutingService,
    private gridService: GridService
  ) {}
  polygonAccuracy: string;
  maxItems: number;
  localSearch: boolean;
  markerThreshold: number;
  debounceTime: number;
  polyClientCalc: boolean;
  gridX: number;
  gridY: number;
  ngOnInit(): void {
    this.maxItems = this.searchService.maxItems;
    this.localSearch = this.searchService.localSearch;
    this.markerThreshold = this.searchService.markerThreshold;
    this.debounceTime = this.routingService.debounceTime;
    this.polyClientCalc = this.polygonService.polyClientCalc;
    this.gridX = this.gridService.gridX;
    this.gridY = this.gridService.gridY;
  }
  updateMaxItems() {
    this.searchService.maxItems = this.maxItems;
  }
  updateLocalSearch() {
    this.searchService.localSearch = this.localSearch;
  }
  updateMarkerThreshold() {
    this.searchService.markerThreshold = this.markerThreshold;
  }
  updateDebounceTime() {
    this.routingService.debounceTime = this.debounceTime;
  }
  updatePolygonCalculation() {
    this.polygonService.polyClientCalc = this.polyClientCalc;
    this.searchService.startSearch.next("start");
  }
  updateX() {
    this.gridService.gridX = this.gridX;
  }
  updateY() {
    this.gridService.gridY = this.gridY;
  }
  recalculateGrid() {
    this.searchService.rerender();
  }
}
