import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { OscarItemsService } from "../../services/oscar/oscar-items.service";
import { ItemStoreService } from "../../services/data/item-store.service";
import { RefinementsService } from "../../services/data/refinements.service";
import { UntypedFormControl } from "@angular/forms";
import { ColorTag } from "../../models/natural-language/color-tag";
import { MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import keyValueTags from "../../../assets/keyValueTags.json";
import { SearchService } from "../../services/search/search.service";
import { Subject } from "rxjs";
import { MapService } from "../../services/map/map.service";
import { PolygonService } from "../../services/polygon-service.service";
import { OscarMinItem } from "src/app/models/oscar/oscar-min-item";
import { QueryParamsService } from "src/app/services/query-params.service";
import { Clipboard } from "@angular/cdk/clipboard";
import { MatSnackBar } from "@angular/material/snack-bar";

declare function getOscarQuery(input);

declare function autoFillSuggestions(input);

declare function coloredInput(input);

export const activateRouting = new Subject<boolean>();
// export const activatePolygon = new Subject<boolean>();
@Component({
  selector: "app-search",
  templateUrl: "./search.component.html",
  styleUrls: ["./search.component.sass"],
})
export class SearchComponent implements OnInit {
  constructor(
    private oscarItemService: OscarItemsService,
    public itemStore: ItemStoreService,
    public refinementStore: RefinementsService,
    private searchService: SearchService,
    private mapService: MapService,
    private polygonService: PolygonService,
    private queryParams: QueryParamsService,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar
  ) {}
  @ViewChild("input") input: ElementRef;
  @Input()
  loading = false;
  @Input()
  selectionStart;
  @Input()
  noResult = false;
  error = false;
  aborted = false;
  inputString = "";
  first = true;
  naturalInput = "";
  eventCount = 0;
  suggestions = [];
  naturalPrefix = [];
  waitTime = 200;
  myControl = new UntypedFormControl();
  options: string[] = ["One", "Two", "Three"];
  normalSuggestions = [];
  oscarQuery = true;
  request;

  inAutocompletePanel = false;

  enterKey() {
    if (this.inAutocompletePanel) return;
    this.refinementStore.clearRefinements();
    this.search();
  }
  panelClosed() {
    setTimeout(() => {
      this.inAutocompletePanel = false;
    }, 100);
  }
  panelOpened() {
    this.inAutocompletePanel = true;
  }
  abort() {
    this.inputString = "";
    this.searchService.clearItems.next("clear");
    this.refinementStore.clearRefinements();
    this.polygonService.activatedPolygons.clear();
    this.itemStore.updateItems([]);
    if (this.loading) {
      this.aborted = true;
      this.request.unsubscribe();
      this.loading = false;
    }
  }
  copyToClipboard() {
    this.clipboard.copy(this.queryParams.getCurrentState(this.inputString));
    this.snackBar.open(
      "The search state is copied to the clipboard!",
      "Close",
      { duration: 2000 }
    );
  }
  @Output() routesVisibleEvent = new EventEmitter<boolean>();
  routesVisible = false;
  sideButtonClass = "side-button";

  @Output() polygonVisibleEvent = new EventEmitter<boolean>();
  polygonVisible = false;
  @Output() preferencesVisibleEvent = new EventEmitter<boolean>();
  preferences = false;
  @Output() impressumVisibleEvent = new EventEmitter<boolean>();
  impressumVisible = false;
  @Output() helpVisibleEvent = new EventEmitter<boolean>();
  helpVisible = false;

  ngOnInit() {
    this.searchService.startSearch.subscribe(() => this.search());
    activateRouting.subscribe(() => this.showRouting());
    // activatePolygon.subscribe(() => this.togglePolygon());
    this.polygonService.activatedPolygonUpdated.subscribe(() => this.search());
    this.queryParams.setQuery.subscribe((set) => {
      if (set) {
        this.inputString = this.queryParams.queryString;
        this.search();
      }
    });
  }
  search() {
    this.aborted = false;
    this.error = false;
    this.searchService.addRoute();
    let fullQueryString = "";
    if (this.polygonService.polyClientCalc) {
      // this.searchService.itemsOfPolygon(this.inputString);
      fullQueryString = this.searchService.createQueryString(
        this.inputString,
        true
      );
    } else {
      fullQueryString = this.searchService.createQueryString(
        this.inputString,
        false
      );
    }
    if (fullQueryString === "") {
      return;
    }
    this.itemStore.setHighlightedItem(null);
    this.loading = true;
    if (this.searchService.localSearch && this.mapService.ready) {
      fullQueryString = this.searchService.queryStringForLocalSearch(
        this.inputString,
        this.polygonService.polyClientCalc
      );
      // this.oscarItemService
      //   .getApxItemCount(localString)
      //   .subscribe((apxStats) => {
      //     if (apxStats.items > 0) fullQueryString = localString;
      //   });
    }
    this.startRequest(fullQueryString);
  }

  startRequest(fullQueryString) {
    this.request = this.oscarItemService
      .getRegion(fullQueryString)
      .subscribe((regions) => {
        const regionFound = this.searchService.searchForRegions(
          fullQueryString,
          regions
        );
        if (regionFound) {
          this.loading = false;
          this.error = false;
        } else {
          this.oscarItemService
            .getApxItemCount(fullQueryString)
            .subscribe(async (apxStats) => {
              try {
                const result = await this.searchService.getItems(apxStats);
                if (!result) {
                  this.error = true;
                  this.loading = false;
                }
              } catch (error) {
                console.log(error);
              }
            });
        }
      });
  }
  searchPoint(point: L.LatLng) {}

  inputUpdate($event) {
    const currentPosition = this.input.nativeElement.selectionStart;
    const splitString = $event.substring(0, currentPosition).split(" ");
    const currentWord = splitString[splitString.length - 1];
    if (currentWord.charAt(0) === "@") {
      if (currentWord.charAt(currentWord.length - 1) === " ") {
        this.normalSuggestions = [];
      } else {
        let i = 0;
        this.normalSuggestions = keyValueTags.filter((item) => {
          if (i > 100) {
            return false;
          }
          const keyValueTag = item.k + ":" + item.v;
          const isMatch = keyValueTag.match(
            new RegExp(currentWord.slice(1), "i")
          );
          if (isMatch) {
            ++i;
          }
          return isMatch;
        });
      }
    } else {
      this.normalSuggestions = [];
    }
  }

  naturalUpdate($event) {
    this.naturalInput = $event;
    let colorOutputTags: ColorTag[];
    colorOutputTags = getOscarQuery(this.naturalInput);
    colorOutputTags.forEach((colorTag) => {
      this.inputString += `${colorTag.tags} `;
    });
    this.eventCount++;
    setTimeout(() => this.showSuggestions(10, this.eventCount), 10);
  }

  showSuggestions(waitTime: number, eventId: number) {
    if (this.eventCount !== eventId) {
      return;
    }
    if (waitTime >= this.waitTime) {
      this.suggestions = autoFillSuggestions(this.naturalInput);
      return;
    }
    setTimeout(() => this.showSuggestions(waitTime + 10, eventId), 10);
  }

  selectEvent($event: any) {
    const splitValues = this.naturalInput.split(" ");
    this.naturalInput.replace(splitValues[splitValues.length - 1], $event);
  }

  onFocused($event: void) {}

  inputWithoutCurrentWord(input: string, option: any) {
    const currentPosition = this.input.nativeElement.selectionStart;
    var currentIndex = 0;

    for (let i = currentPosition - 1; i >= 0; i--) {
      if (input[i] === " ") {
        break;
      }
      currentIndex = i;
    }

    const stringHead = input.substring(0, currentIndex);
    const wordTail =
      input[currentPosition] && input[currentPosition] != " " ? " " : "";
    const stringTail = input.substring(currentPosition, input.length);

    return stringHead + "@" + option.k + ":" + option.v + wordTail + stringTail;
  }
  inputWithoutLastWord(input: string) {
    const charArray = [...input];
    let endNormalString = 0;
    for (let i = charArray.length - 1; i >= 0; i--) {
      if (charArray[i] === " ") {
        endNormalString = i + 1;
        break;
      }
    }
    return input.slice(0, endNormalString);
  }

  radiusChange($event: number) {
    let radius = $event;
    if ($event === 1000) {
      radius = 100000;
    }
    this.itemStore.changeRadius(radius);
  }

  togglePolygon() {
    if (this.routesVisible && !this.polygonVisible) this.toggleRouting();
    this.polygonVisibleEvent.emit(!this.polygonVisible);
    this.polygonVisible = !this.polygonVisible;
  }

  toggleRouting() {
    if (this.polygonVisible && !this.routesVisible) this.togglePolygon();
    this.routesVisibleEvent.emit(!this.routesVisible);
    this.routesVisible = !this.routesVisible;
    this.sideButtonClass = this.routesVisible
      ? "side-button-active"
      : "side-button";
  }

  showRouting() {
    if (!this.routesVisible) {
      this.toggleRouting();
    }
  }

  togglePreferences() {
    this.preferencesVisibleEvent.emit(!this.preferences);
    this.preferences = !this.preferences;
  }
  toggleImpressum() {
    this.impressumVisibleEvent.emit(!this.impressumVisible);
    this.impressumVisible = !this.impressumVisible;
  }
  toggleHelp() {
    this.helpVisibleEvent.emit(!this.helpVisible);
    this.helpVisible = !this.helpVisible;
  }
  reload() {
    location.reload();
  }
}
