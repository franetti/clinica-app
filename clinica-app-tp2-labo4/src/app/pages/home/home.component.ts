import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { MatCard } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-home',
  imports: [MatProgressSpinnerModule, MatCard],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true
})
export class HomeComponent {

  constructor(private snackBar: MatSnackBar) {}
  ngOnInit() { 

  }
}
