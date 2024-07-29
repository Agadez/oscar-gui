import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalItemListComponent } from './local-item-list.component';

describe('LocalItemListComponent', () => {
  let component: LocalItemListComponent;
  let fixture: ComponentFixture<LocalItemListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LocalItemListComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LocalItemListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
