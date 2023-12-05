import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Subject } from "rxjs";
import { OscarItem } from "../../models/oscar/oscar-item";
import { OscarMinItem } from "../../models/oscar/oscar-min-item";
import { OscarItemsService } from "../oscar/oscar-items.service";

@Injectable({
  providedIn: "root",
})
export class ItemStoreService {
  private readonly _radiusChange = new BehaviorSubject<number>(10000);
  readonly binaryItemsFinished$ = this._radiusChange.asObservable();
  // tslint:disable-next-line:variable-name
  private readonly _highlightedItem = new BehaviorSubject<OscarItem>(null);
  readonly highlightedItem$ = this._highlightedItem.asObservable();
  private readonly _items = new Subject<OscarMinItem[]>();
  readonly items$ = this._items.asObservable();
  itemsIds = new BehaviorSubject<number[]>([]);
  // readonly itemsIds$ = this.itemsIds.asObservable();
  private readonly _currentItemsIds = new BehaviorSubject<number[]>([]);
  readonly currentItemsIds$ = this._currentItemsIds.asObservable();

  constructor(private oscarItemsService: OscarItemsService) {}
  // get items() {
  //   return this._items.value;
  // }
  updateItems(items: OscarMinItem[]) {
    this._items.next(items);
    const itemIds: number[] = [];
    // this._items.value.forEach((item) => {
    //   itemIds.push(item.id);
    // });
    this.itemsIds.next(itemIds);
  }
  updateItemsFromBinary(binaryItems) {
    let items = this.oscarItemsService.binaryItemsToOscarMin(binaryItems);
    this._items.next(items);
    const itemIds: number[] = [];
    items.forEach((item) => {
      itemIds.push(item.id);
    });
    this.itemsIds.next(itemIds);
  }
  get currentItemsIds() {
    return this._currentItemsIds.value;
  }

  set currentItemsIds(currentItemsIds) {
    this._currentItemsIds.next(currentItemsIds);
  }
  setHighlightedItem(item: OscarItem) {
    this._highlightedItem.next(item);
  }
  changeRadius(radius: number) {
    this._radiusChange.next(radius);
  }
}
