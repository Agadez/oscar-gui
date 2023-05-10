import { Directive, ElementRef, HostListener } from "@angular/core";

@Directive({
  selector: "[appBlurOnEnter]",
})
export class BlurOnEnterDirective {
  constructor(private el: ElementRef) {}

  @HostListener("keydown.enter")
  onEnter() {
    this.el.nativeElement.blur();
  }
}
