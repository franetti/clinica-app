import { Component, Input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartType, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-grafico-base',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <canvas baseChart
      [type]="type"
      [data]="data"
      [options]="options">
    </canvas>
  `
})
export class GraficoBaseComponent {

  @Input() type!: ChartType;
  @Input() data!: ChartData;
  @Input() options: ChartOptions = { responsive: true };
}