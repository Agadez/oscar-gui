import {
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnInit,
  Output,
} from "@angular/core";
import { OscarMinItem } from "../../models/oscar/oscar-min-item";
import { MapService } from "../../services/map/map.service";
import { OscarItemsService } from "../../services/oscar/oscar-items.service";
import { GridService } from "../../services/data/grid.service";
import _, { forEach } from "lodash";
import {
  FacetRefinements,
  ParentRefinements,
} from "../../models/oscar/refinements";
import { SearchService } from "../../services/search/search.service";
import { forkJoin, Subject } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ItemStoreService } from "src/app/services/data/item-store.service";
import { PolygonService } from "src/app/services/polygon-service.service";
import { debounceTime, throttleTime } from "rxjs/operators";
import { QueryParamsService } from "src/app/services/query-params.service";
import { Cell } from "src/app/models/cell/cell.model";
import { debounce } from "lodash";

export const clearItems = new Subject<string>();
export const radiusSearchTrigger = new Subject<L.LatLng>();

@Component({
  selector: "app-search-result-view",
  templateUrl: "./search-result-view.component.html",
  styleUrls: ["./search-result-view.component.sass"],
})
export class SearchResultViewComponent implements OnInit {
  constructor(
    private mapService: MapService,
    private oscarItemsService: OscarItemsService,
    private gridService: GridService,
    private zone: NgZone,
    private searchService: SearchService,
    private snackBar: MatSnackBar,
    private itemStoreService: ItemStoreService,
    private polygonService: PolygonService,
    private paramsService: QueryParamsService
  ) {}
  globalCounts = 0;
  localCounts = 0;
  hideCounts = true;
  parentRefinements: ParentRefinements;
  facetRefinements: FacetRefinements;
  heatmapSliderVisible = false;
  heatMapIntensity = 1;
  heatMapPixel = 20;
  showGlobal = true;
  showLocal = false;
  showParents = false;
  showFacets = false;
  progress = 0;
  currentItems: OscarMinItem[] = [];
  cells: Cell[] = [];
  @Output()
  searchLoading = new EventEmitter<boolean>();
  @Output()
  noResult = new EventEmitter<boolean>();
  @Input()
  routesVisible = false;
  drawing = false;
  sharedQuery = false;

  ngOnInit(): void {
    this.paramsService.setQuery.subscribe((set) => {
      if (set && this.paramsService.queryString != "") this.sharedQuery = true;
    });
    this.itemStoreService.items$.subscribe((items) => {
      if (items.length == 0) {
        this.hideCounts = true;
      } else {
        this.hideCounts = false;
        this.zone.run(() => (this.globalCounts = items.length));
      }
    });
    this.itemStoreService.currentItemsIds$.subscribe((currentItemsIds) => {
      this.zone.run(() => {
        this.localCounts = currentItemsIds.size;
      });
    });
    this.searchService.queryToDraw$.subscribe(async (queryString) => {
      await this.drawQuery(queryString);
    });
    this.mapService.onMoved$.pipe(debounceTime(100)).subscribe((event) => {
      if (event !== null) {
        this.reDrawSearchMarkers();
      }
    });
    this.mapService.onZoom$.subscribe(() => {
      this.mapService.clearHeatMap();
    });
    this.searchService.clearItems.asObservable().subscribe((value) => {
      if (value) {
        this.clearItems();
      }
    });
    this.mapService.onContextMenu$.subscribe(async (event) => {
      if (event) {
      }
      // await this.searchRadius(event.latlng);
    });
    this.mapService._mapReady.subscribe((ready) => {
      if (!ready) {
        return;
      }
      this.mapService._map.on("click", async (event: any) => {
        // await this.searchRadius(event.latlng);
      });
    });
    radiusSearchTrigger.asObservable().subscribe(async (latlng) => {
      if (!latlng) return;
      await this.searchRadius(latlng);
    });
  }

  private async searchRadius(sourceLatLng: L.LatLng) {
    let foundSomething = false;
    const maxRadius = 100;
    const increments = 10;
    for (let i = 1; i < maxRadius; i = i + increments) {
      const { query, items } = await this.oscarItemsService.getPoint(
        i,
        sourceLatLng.lat,
        sourceLatLng.lng
      );
      const binaryItems = await items.toPromise();
      const oscarMin =
        this.oscarItemsService.binaryItemsToOscarMin(binaryItems);
      if (oscarMin.length > 0) {
        await this.drawQuery(query);
        foundSomething = true;
        break;
      }
    }
    if (!foundSomething) {
      this.snackBar.open("Nothing found!", "close", {
        duration: 2000,
      });
    }
  }
  itemCheck(queryString: string) {
    if (this.itemStoreService.items.length === 0 && queryString !== "() ") {
      this.noResult.emit(true);
      this.searchLoading.emit(false);
      return;
    }
    this.noResult.emit(false);
    this.searchLoading.emit(false);
  }
  async drawQuery(queryString: string) {
    if (queryString) {
      this.noResult.emit(false);
      this.searchLoading.emit(true);
      this.clearItems();
      this.hideCounts = true;
      this.heatmapSliderVisible = false;
      this.progress = 1;
      this.oscarItemsService.getItemsBinary(queryString).subscribe(
        (binaryItems) => {
          this.itemStoreService.updateItemsFromBinary(binaryItems);
          this.itemCheck(queryString);
          this.gridService.fitMaptoMinItems();

          this.reDrawSearchMarkers();
          if (this.sharedQuery) this.sharedQuery = false;
          // else this.mapService.fitBounds(this.gridService.globalGrid.gridBBox);

          this.oscarItemsService
            .getParents(queryString, 0)
            .subscribe((parents) => {
              this.zone.run(() => (this.parentRefinements = parents));
              this.progress += 25;
            });
          this.oscarItemsService
            .getFacets(queryString, 0)
            .subscribe((facets) => {
              this.zone.run(() => (this.facetRefinements = facets));
              this.progress += 25;
            });
          this.searchLoading.emit(false);
        },
        (error) => {
          console.error("Error fetching data:", error);
        }
      );
    }
  }
  reDrawSearchMarkers() {
    this.mapService.clearSearchMarkers();
    this.mapService.clearHeatMap();
    const bounds = this.mapService.bounds;
    this.zone.run(() => {
      const current = this.gridService.getCurrentItems(
        bounds.getSouth(),
        bounds.getWest(),
        bounds.getNorth(),
        bounds.getEast(),
        this.mapService.zoom
      );
      this.currentItems = Array.from(new Set(current.items));
      this.cells = current.cells;
      this.progress += 25;
    });

    if (
      (this.currentItems.length < this.searchService.markerThreshold ||
        this.mapService.zoom === this.mapService.maxZoom) &&
      this.mapService.zoom >= 14
    ) {
      this.heatmapSliderVisible = false;
      this.mapService.drawItemsMarker(this.currentItems);
    } else {
      const currentItemsIds = new Set<number>();
      this.currentItems.forEach((item) => {
        currentItemsIds.add(item.id);
      });
      this.heatmapSliderVisible = true;
      this.itemStoreService.currentItemsIds = currentItemsIds;
      this.mapService.drawItemsHeatmap(
        this.currentItems,
        _.sampleSize(this.cells, 100000),
        this.heatMapIntensity,
        this.heatMapPixel,
        this.gridService.currentGrid?.scale
      );
    }
    this.progress += 25;
  }

  intensityChange() {
    this.reDrawSearchMarkers();
  }

  globalClick($event: MouseEvent) {
    this.showLocal = false;
    this.showGlobal = !this.showGlobal;
    this.showParents = false;
    this.showFacets = false;
  }

  localClick($event: MouseEvent) {
    this.showLocal = !this.showLocal;
    this.showGlobal = false;
    this.showParents = false;
    this.showFacets = false;
  }

  parentClick($event: MouseEvent) {
    this.showLocal = false;
    this.showGlobal = false;
    this.showParents = !this.showParents;
    this.showFacets = false;
  }

  facetClick($event: MouseEvent) {
    this.showLocal = false;
    this.showGlobal = false;
    this.showParents = false;
    this.showFacets = !this.showFacets;
  }

  clearItems() {
    this.mapService.clearAllLayers();
    this.gridService.deleteGrid();
    this.currentItems = [];
    this.parentRefinements = null;
    this.facetRefinements = null;
  }
}
