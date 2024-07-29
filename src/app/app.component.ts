import { Component, OnInit } from '@angular/core';
import {
  Location,
  LocationStrategy,
  PathLocationStrategy,
} from '@angular/common';
import { MapStateService } from './services/state/map-state.service';
import { RefinementsService } from './services/data/refinements.service';
import { MapService } from './services/map/map.service';
import { RefinementType } from './models/gui/refinement';
import { ActivatedRoute } from '@angular/router';
import { QueryParamsService } from './services/query-params.service';
import { isEmpty } from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [
    Location,
    { provide: LocationStrategy, useClass: PathLocationStrategy },
  ],
})
export class AppComponent implements OnInit {
  title = 'oscar-gui';
  query = '';
  constructor(
    private location: Location,
    private mapState: MapStateService,
    private refinementService: RefinementsService,
    private mapService: MapService,
    private route: ActivatedRoute,
    private queryParams: QueryParamsService
  ) {}
  ngOnInit(): void {
    this.mapState.bounds$.subscribe(() => {
      this.changeUrl();
    });
    this.refinementService.refinements$.subscribe(() => this.changeUrl());
    this.route.queryParams.subscribe(params => {
      if (isEmpty(params)) return;
      this.queryParams.paramsFromQuery(params);
      this.location.replaceState('/');
    });
  }

  changeUrl() {
    const latLong = this.mapState.getBounds();
    if (!latLong) {
      return;
    }
    if (this.query === '') {
      return;
    }
    let parentRefinementsString = 'p=';
    this.refinementService
      .getRefinements()
      .filter(
        refinement =>
          refinement.refinementType === RefinementType.Parent &&
          refinement.excluding === false
      )
      .forEach(
        parentRefinement =>
          (parentRefinementsString +=
            encodeURIComponent(parentRefinement.value) + ',')
      );
    let exParentRefinementsString = 'ep=';
    this.refinementService
      .getRefinements()
      .filter(
        refinement =>
          refinement.refinementType === RefinementType.Parent &&
          refinement.excluding === true
      )
      .forEach(
        parentRefinement =>
          (exParentRefinementsString +=
            encodeURIComponent(parentRefinement.value) + ',')
      );
    let keyRefinementsString = 'k=';
    this.refinementService
      .getRefinements()
      .filter(
        refinement =>
          refinement.refinementType === RefinementType.Key &&
          refinement.excluding === false
      )
      .forEach(
        keyRefinement =>
          (keyRefinementsString += encodeURIComponent(keyRefinement.key) + ',')
      );
    let exKeyRefinementsString = 'ek=';
    this.refinementService
      .getRefinements()
      .filter(
        refinement =>
          refinement.refinementType === RefinementType.Key &&
          refinement.excluding === true
      )
      .forEach(
        exKeyRefinement =>
          (exKeyRefinementsString +=
            encodeURIComponent(exKeyRefinement.key) + ',')
      );
    let keyValueRefinementsString = 'kv=';
    this.refinementService
      .getRefinements()
      .filter(
        refinement =>
          refinement.refinementType === RefinementType.KeyValue &&
          refinement.excluding === false
      )
      .forEach(
        keyValueRefinement =>
          (keyValueRefinementsString +=
            encodeURIComponent(keyValueRefinement.key) +
            ':' +
            keyValueRefinement.value +
            ',')
      );
    let exKeyValueRefinementsString = 'ekv=';
    this.refinementService
      .getRefinements()
      .filter(
        refinement =>
          refinement.refinementType === RefinementType.KeyValue &&
          refinement.excluding === true
      )
      .forEach(
        exKeyValueRefinement =>
          (exKeyValueRefinementsString +=
            encodeURIComponent(exKeyValueRefinement.key) +
            ':' +
            exKeyValueRefinement.value +
            ',')
      );
    const urlString = `?q=${encodeURIComponent(
      this.query
    )}&b=${latLong.toBBoxString()}&${keyRefinementsString}&${exKeyRefinementsString}&${keyValueRefinementsString}&${exKeyValueRefinementsString}&${parentRefinementsString}&${exParentRefinementsString}`;
    this.location.go(urlString);
  }
}
