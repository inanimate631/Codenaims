import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[ignoreMouseLeave]',
})
export class IgnoreMouseLeaveDirective {
  constructor(private elRef: ElementRef) {}

  @HostListener('mouseleave', ['$event'])
  onMouseLeave(event: MouseEvent) {
    if (this.elRef.nativeElement.contains(event.relatedTarget)) {
      event.stopPropagation();
    }
  }
}
