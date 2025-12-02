import { Component, Input } from '@angular/core';
import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { GraficoBaseComponent } from './graficobase.component';

@Component({
  selector: 'app-grafico-pie',
  standalone: true,
  imports: [GraficoBaseComponent],
  template: `
    <app-grafico-base
      [type]="type"
      [data]="data"
      [options]="options">
    </app-grafico-base>
  `
})
export class GraficoPieComponent {
  type: ChartType = 'pie';

  @Input() data!: ChartData;
  @Input() options: ChartOptions = { responsive: true };
}
