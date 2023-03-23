import { Component, OnInit } from "@angular/core";
import { ItemStoreService } from "../../services/data/item-store.service";
import { RefinementsService } from "../../services/data/refinements.service";

@Component({
  selector: "app-side-bar",
  templateUrl: "./side-bar.component.html",
  styleUrls: ["./side-bar.component.sass"],
})
export class SideBarComponent implements OnInit {
  constructor(
    public itemStore: ItemStoreService,
    public refinementsService: RefinementsService
  ) {}

  routing = false;
  routesVisible = false;
  noResult = false;
  searchLoading = false;
  impressumVisible = false;
  helpVisible = false;
  polygonVisible = false;
  preferencesVisible = false;
  ngOnInit() {}
}
