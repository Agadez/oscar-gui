import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class ConfigService {
  constructor() {}
  getOscarUrl(): string {
    console.log(environment.oscarUrl);
    // return environment.oscarUrl;
    // return "https://routing.oscar-web.de";
    return "https://old.oscar-web.de";
    // return 'http://localhost';
  }
  getRoutingUrl(): string {
    // return  'http://localhost/oscar/routing/route';
    return "https://routing.oscar-web.de/oscar/routing/route";
  }
}
