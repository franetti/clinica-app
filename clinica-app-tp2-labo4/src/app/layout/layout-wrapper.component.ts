import { Component } from '@angular/core';
import { LayoutComponent } from './layout.component';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'layout-wrapper',
    standalone: true,
    imports: [RouterOutlet, LayoutComponent],
    template: `
      <app-layout>
        <router-outlet></router-outlet>
      </app-layout>
    `
  })
export class LayoutWrapperComponent {

  }
  