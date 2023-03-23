import { Component, NgZone, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { SearchService } from "src/app/services/search/search.service";
import {
  WikiData,
  WikiServiceService,
} from "../../services/wikipedia/wiki-service.service";

export const displayRegion = new Subject<string>();
@Component({
  selector: "app-region",
  templateUrl: "./region.component.html",
  styleUrls: ["./region.component.sass"],
})
export class RegionComponent implements OnInit {
  constructor(
    private wikiService: WikiServiceService,
    private zone: NgZone,
    private searchService: SearchService
  ) {}

  visible = false;
  loading = false;
  wikiData: WikiData = null;
  ngOnInit(): void {
    this.searchService.displayRegion
      .asObservable()
      .subscribe(async (entity) => {
        if (!entity) {
          this.wikiData = null;
          return;
        }
        this.visible = true;
        this.loading = true;
        this.wikiData = await this.wikiService.getPictureUrls(entity);
        this.loading = false;
      });
  }
}
