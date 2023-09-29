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

  // numbers = [];
  // sort() {
  //   this.numbers = [];
  //   let elements = 100000000;
  //   for (let i = 0; i < elements; i++) {
  //     this.numbers.push(Math.floor(Math.random() * elements));
  //   }
  //   console.time("numbers");
  //   this.numbers.sort((a, b) => a - b);
  //   console.timeEnd("numbers");
  //   console.log(this.numbers.slice(0, 100));
  // }
}
