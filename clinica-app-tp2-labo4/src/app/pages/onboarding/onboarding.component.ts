import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { MatCard } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { UsuarioDTO } from '../../models/usuario';

@Component({
  selector: 'app-onboarding',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
  standalone: true
})
export class OnboardingComponent {

  userSession: UsuarioDTO | null = null;

  constructor(private snackBar: MatSnackBar, private authService:AuthService) { }
  
  ngOnInit() { 
    this.authService.getUser().subscribe(user => {
        this.userSession = user;
      });
  }
}
