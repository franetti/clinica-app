import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { SpinnerService } from '../../services/spinner.service';


@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private spinnerService: SpinnerService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {

  }

  async login() {
    this.spinnerService.show();
    if (this.loginForm.invalid) {
      this.spinnerService.hide();
      return;
    } 

    const { username, password } = this.loginForm.value;

    try {
      const response = await this.authService.login(username, password);
      // Podés redirigir si el login es exitoso
    } catch (error) {
      console.error('Error:', error);
    }

    this.spinnerService.hide();
  }

  accesoRapido() {
    this.loginForm.setValue({
      username: 'diyah26718@hh7f.com',
      password: '12345678',
    });
  }
}
