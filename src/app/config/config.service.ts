import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class ConfigService {
  public iconMapping: {
    amenity: {
      pharmacy: "medkit";
      hospital: "hospital-o";
      doctors: "user-md";
      fast_food: "cutlery";
      restaurant: "cutlery";
      post_box: "envelope-o";
      post_office: "envelope-o";
      waste_basket: "trash-o";
      recycling: "recycle";
      atm: "credit-card";
      university: "university";
      pub: "beer";
      cafe: "coffee";
      bar: "glass";
      bus_station: "bus";
      airport: "plane";
      port: "ship";
    };
    tourism: {
      information: "info-circle";
      hotel: "bed";
      // 					"attraction" : "",
      viewpoint: "eye";
      picnic_site: "apple";
      // 					"guest_house" : "",
      // 					"camp_site" : "",
      // 					"museum" : ""
    };
    aeroway: {
      aerodrome: "plane";
    };
    shop: {
      convenience: "shopping-cart";
      supermarket: "shopping-cart";
    };
  };
  constructor() {}
  getOscarUrl(): string {
    return environment.oscarUrl;
    // return "https://routing.oscar-web.de";
    // return "https://old.oscar-web.de";
    // return 'http://localhost';
  }
  getRoutingUrl(): string {
    // return  'http://localhost/oscar/routing/route';
    return "https://routing.oscar-web.de/oscar/routing/route";
  }
  getIconMapping(key: string, value: string) {
    if (this.iconMapping[key] !== undefined) {
      let icon = this.iconMapping[key][value];
      return icon;
    }
    return "";
  }
}
