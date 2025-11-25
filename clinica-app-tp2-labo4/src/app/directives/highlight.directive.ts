import { Directive, ElementRef, Input, OnInit, OnChanges, SimpleChanges, Renderer2 } from '@angular/core';

@Directive({
    selector: '[appHighlight]',
    standalone: true
})
export class HighlightDirective implements OnInit, OnChanges {
    @Input() appHighlight: string | number | boolean | null | undefined = null;
    @Input() highlightColor: string = 'yellow';
    @Input() highlightCondition: 'enabled' | 'disabled' | 'active' | 'success' | 'error' | 'custom' = 'custom';

    constructor(private el: ElementRef, private renderer: Renderer2) { }

    ngOnInit(): void {
        this.applyHighlight();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['appHighlight'] || changes['highlightColor'] || changes['highlightCondition']) {
            this.applyHighlight();
        }
    }

    private applyHighlight(): void {
        let shouldHighlight = false;
        let color = this.highlightColor;

        switch (this.highlightCondition) {
            case 'enabled':
                shouldHighlight = this.appHighlight === true || this.appHighlight === 'true' || this.appHighlight === 1;
                color = shouldHighlight ? '#4caf50' : '#f44336';
                break;
            case 'disabled':
                shouldHighlight = this.appHighlight === false || this.appHighlight === 'false' || this.appHighlight === 0;
                color = shouldHighlight ? '#f44336' : '#4caf50';
                break;
            case 'active':
                shouldHighlight = this.appHighlight === true || this.appHighlight === 'active' || this.appHighlight === 'true';
                color = shouldHighlight ? '#2196f3' : '#757575';
                break;
            case 'success':
                shouldHighlight = this.appHighlight === true || this.appHighlight === 'success' || this.appHighlight === 'true';
                color = shouldHighlight ? '#4caf50' : '#757575';
                break;
            case 'error':
                shouldHighlight = this.appHighlight === true || this.appHighlight === 'error' || this.appHighlight === 'true';
                color = shouldHighlight ? '#f44336' : '#757575';
                break;
            case 'custom':
            default:
                shouldHighlight = this.appHighlight !== null && this.appHighlight !== undefined && this.appHighlight !== '';
                break;
        }

        if (shouldHighlight) {
            this.renderer.setStyle(this.el.nativeElement, 'background-color', color);
            this.renderer.setStyle(this.el.nativeElement, 'padding', '4px 8px');
            this.renderer.setStyle(this.el.nativeElement, 'border-radius', '4px');
        } else {
            this.renderer.removeStyle(this.el.nativeElement, 'background-color');
            this.renderer.removeStyle(this.el.nativeElement, 'padding');
            this.renderer.removeStyle(this.el.nativeElement, 'border-radius');
        }
    }
}

