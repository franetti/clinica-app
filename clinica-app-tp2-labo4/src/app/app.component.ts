import { Component } from '@angular/core';
import { RouterOutlet,RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SpinnerComponent } from './components/spinner.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterModule,
    SpinnerComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent {
  title = 'clinica-app-tp2-labo4';
}
