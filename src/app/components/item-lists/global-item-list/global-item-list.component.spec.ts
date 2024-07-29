import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalItemListComponent } from './global-item-list.component';

describe('GlobalItemListComponent', () => {
  let component: GlobalItemListComponent;
  let fixture: ComponentFixture<GlobalItemListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GlobalItemListComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GlobalItemListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
