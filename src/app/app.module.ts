import { RouterModule, Routes } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { SearchComponent } from './components/search/search.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OscarItemsService } from './services/oscar/oscar-items.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ConfigService } from './config/config.service';
import { ItemDetailComponent } from './components/item-detail/item-detail.component';
import { ItemStoreService } from './services/data/item-store.service';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { MapComponent } from './components/map/map.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SideBarComponent } from './components/side-bar/side-bar.component';
import { ItemDetailPipe } from './components/item-detail/item-detail.pipe';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { ItemInfoComponent } from './components/item-info/item-info.component';
import { ItemKvTableComponent } from './components/item-kv-table/item-kv-table.component';
import { SuggestionsComponent } from './components/search/suggestions/suggestions.component';
import { SuggestionDetailComponent } from './components/search/suggestions/suggestion-detail/suggestion-detail.component';
import { RefinementsComponent } from './components/refinements/refinements.component';
import { ActiveRefinementsComponent } from './components/active-refinements/active-refinements.component';
import { FacetsComponent } from './components/refinements/facets/facets.component';
import { FacetsDetailComponent } from './components/refinements/facets/facets-detail/facets-detail.component';
import { ParentsComponent } from './components/refinements/parents/parents.component';
import { ParentsDetailComponent } from './components/refinements/parents/parents-detail/parents-detail.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { KeepHtmlPipe } from './components/search/keep-html.pipe';
import { MatSliderModule } from '@angular/material/slider';
import { SearchResultViewComponent } from './components/search-result-view/search-result-view.component';
import { ItemCountComponent } from './components/item-count/item-count.component';
import { NewItemListComponent } from './components/new-item-list/new-item-list.component';
import { HumanReadableNumbersPipePipe } from './pipes/human-readable-numbers-pipe.pipe';
import { AddressInputComponent } from './components/address-input/address-input.component';
import { RouteComponent } from './components/route/route.component';
import { RoutesComponent } from './components/routes/routes.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RegionComponent } from './components/region/region.component';
import { MatMenuModule } from '@angular/material/menu';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ImpressumComponent } from './components/impressum/impressum.component';
import { HelpComponent } from './components/help/help.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectedItemComponent } from './components/selected-item/selected-item.component';
import { PolygonsComponent } from './components/polygons/polygons.component';
import { PolygonComponent } from './components/polygon/polygon.component';
import { GlobalItemListComponent } from './components/item-lists/global-item-list/global-item-list.component';
import { LocalItemListComponent } from './components/item-lists/local-item-list/local-item-list.component';
import { PreferenceComponent } from './components/preference/preference.component';
import { BlurOnEnterDirective } from './directives/blur-on-enter.directive';
import { DialogComponent } from './components/dialog/dialog.component';
import { MatDialogModule } from '@angular/material/dialog';

const routes: Routes = [{ path: '**', redirectTo: '', pathMatch: 'full' }];

@NgModule({
  declarations: [
    AppComponent,
    SearchComponent,
    ItemDetailComponent,
    MapComponent,
    SideBarComponent,
    ItemDetailPipe,
    ItemInfoComponent,
    ItemKvTableComponent,
    SuggestionsComponent,
    SuggestionDetailComponent,
    RefinementsComponent,
    ActiveRefinementsComponent,
    FacetsComponent,
    FacetsDetailComponent,
    ParentsComponent,
    ParentsDetailComponent,
    KeepHtmlPipe,
    SearchResultViewComponent,
    ItemCountComponent,
    NewItemListComponent,
    HumanReadableNumbersPipePipe,
    AddressInputComponent,
    RouteComponent,
    RoutesComponent,
    RegionComponent,
    ImpressumComponent,
    HelpComponent,
    SelectedItemComponent,
    PolygonsComponent,
    PolygonComponent,
    GlobalItemListComponent,
    LocalItemListComponent,
    PreferenceComponent,
    BlurOnEnterDirective,
    DialogComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    MatDialogModule,
    RouterModule.forRoot(routes),
    BrowserModule,
    FormsModule,
    LeafletModule,
    BrowserAnimationsModule,
    InfiniteScrollDirective,
    DragDropModule,
    ReactiveFormsModule,
    OverlayModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSliderModule,
    MatTooltipModule,
    MatTabsModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatMenuModule,
    ClipboardModule,
    MatSnackBarModule,
    NgxSkeletonLoaderModule,
    MatIconModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatRadioModule,
  ],
  providers: [
    OscarItemsService,
    ConfigService,
    ItemStoreService,
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
