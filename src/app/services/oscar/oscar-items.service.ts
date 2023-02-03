import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { OscarItem } from "../../models/oscar/oscar-item";
import { ConfigService } from "../../config/config.service";
import { OscarMinItem } from "../../models/oscar/oscar-min-item";
import { OscarApxstats } from "../../models/oscar/oscar-apxstats";

import {
  FacetRefinements,
  ParentRefinements,
} from "../../models/oscar/refinements";

@Injectable({
  providedIn: "root",
})
export class OscarItemsService {
  constructor(private http: HttpClient, private configService: ConfigService) {}

  getItemsBinary(queryString: string): Observable<any> {
    const itemUrl =
      this.configService.getOscarUrl() +
      `/oscar/cqr/clustered/itemswithlocation?q=${encodeURIComponent(
        queryString
      )}&bounding-radius=true`;
    return this.http.get(itemUrl, { responseType: "arraybuffer" });
  }
  public binaryItemsToOscarMin(itemArray): OscarMinItem[] {
    const itemList = new Array<OscarMinItem>();
    const returnArray = new Uint32Array(itemArray);
    for (let i = 0; i < returnArray.length; i += 4) {
      itemList.push({
        id: returnArray[i],
        lat: this.toDoubleLat(returnArray[i + 1]),
        lon: this.toDoubleLon(returnArray[i + 2]),
        boundingRadius: this.toDoubleLat(returnArray[i + 3]),
      });
    }
    return itemList;
  }
  getApxItemCount(queryString: string): Observable<OscarApxstats> {
    const itemUrl =
      this.configService.getOscarUrl() +
      `/oscar/cqr/clustered/apxstats?q=${encodeURIComponent(
        queryString
      )}&rf=admin_level`;
    return this.http.get<OscarApxstats>(itemUrl);
  }
  getItemsInfo(items: OscarMinItem[]): Observable<OscarItem[]> {
    const ids = new Array<number>();
    items.forEach((item) => ids.push(item.id));
    const queryString =
      this.configService.getOscarUrl() +
      `/oscar/items/info?i=${JSON.stringify(ids)}`;
    return this.http.get<OscarItem[]>(queryString);
  }
  getItemsInfoById(id: number): Observable<OscarItem[]> {
    const queryString =
      this.configService.getOscarUrl() +
      `/oscar/items/info?i=${JSON.stringify([id])}`;
    return this.http.get<OscarItem[]>(queryString);
  }
  getItemsInfoByIds(ids: number[]): Observable<OscarItem[]> {
    const queryString =
      this.configService.getOscarUrl() +
      `/oscar/items/info?i=${JSON.stringify(ids)}`;
    return this.http.get<OscarItem[]>(queryString);
  }
  getParents(query: string, queryId: number): Observable<ParentRefinements> {
    return this.http.get<ParentRefinements>(
      this.configService.getOscarUrl() +
        `/oscar/kvclustering/get?queryId=${queryId}&q=${encodeURIComponent(
          query
        )}+&rf=admin_level&type=p&maxRefinements=20`
    );
  }
  getFacets(query: string, queryId: number): Observable<FacetRefinements> {
    return this.http.get<FacetRefinements>(
      this.configService.getOscarUrl() +
        `/oscar/kvclustering/get?queryId=${queryId}&q=${encodeURIComponent(
          query
        )}+&rf=admin_level&type=f&maxRefinements=20&exceptions=%5B%5D&debug=true&keyExceptions=%5B%22wheelchair%22%2C+%22addr%22%2C+%22level%22%2C+%22toilets%3Awheelchair%22%2C+%22building%22%2C+%22source%22%2C+%22roof%22%5D&facetSizes=%5B%5D&defaultFacetSize=10`
    );
  }
  getMultipleItems(items: OscarMinItem[]): any {
    const ids = new Array<number>();
    items.forEach((item) => ids.push(item.id));
    const formdata = new FormData();
    formdata.append("which", JSON.stringify(ids));
    formdata.append("format", "geojson");
    formdata.append("shape", "true");
    const queryString =
      this.configService.getOscarUrl() + `/oscar/itemdb/multiple`;
    return this.http.post(queryString, formdata);
  }
  getRegion(query: string, queryId: number = 0): Observable<OscarItem[]> {
    return this.http.get<OscarItem[]>(
      this.configService.getOscarUrl() +
        `/oscar/items/isregion?q=${encodeURIComponent(query)}`
    );
  }
  getPoint(radius: number, lat: number, lon: number) {
    const query = `$point:${radius},${lat},${lon}`;
    return { query, items: this.getItemsBinary(query) };
  }
  private toDoubleLat(lat: number) {
    // tslint:disable-next-line:no-bitwise
    return lat / (1 << 24) - 90;
  }
  private toDoubleLon(lon: number) {
    // tslint:disable-next-line:no-bitwise
    return lon / (1 << 23) - 180;
  }
}
