import { Directive, ElementRef, Renderer2, HostListener } from '@angular/core';

@Directive({
    standalone: true,
    selector: '[appHoverZoom]'
})
export class HoverZoomDirective {
    constructor(private el: ElementRef, private renderer: Renderer2) { }

    @HostListener('mouseenter') onMouseEnter() {
        this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(1.1)');
        this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.3s ease');
        this.renderer.setStyle(this.el.nativeElement, 'cursor', 'pointer');
    }

    @HostListener('mouseleave') onMouseLeave() {
        this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(1)');
    }
}



