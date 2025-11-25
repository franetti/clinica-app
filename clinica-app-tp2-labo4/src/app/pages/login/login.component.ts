import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { SpinnerService } from '../../services/spinner.service';

interface UsuarioRapido {
  email: string;
  password: string;
  nombre: string;
  tipo: 'paciente' | 'especialista' | 'admin';
  imagen: string;
}

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
    MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss', '../../animations/fab-animations.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  mostrarUsuarios = signal(false);

  usuarios: UsuarioRapido[] = [
    {
      email: 'diyah26718@hh7f.com',
      password: '12345678',
      nombre: 'Admin',
      tipo: 'admin',
      imagen: 'https://ui-avatars.com/api/?name=Admin&background=3f51b5&color=fff&size=128'
    },
    {
      email: 'wapacij184@izeao.com',
      password: '12345678',
      nombre: 'Paciente 1',
      tipo: 'paciente',
      imagen: 'https://ui-avatars.com/api/?name=Paciente+1&background=4caf50&color=fff&size=128'
    },
    {
      email: 'gilejo2626@gamepec.com',
      password: '12345678',
      nombre: 'Paciente 2',
      tipo: 'paciente',
      imagen: 'https://ui-avatars.com/api/?name=Paciente+2&background=4caf50&color=fff&size=128'
    },
    {
      email: 'sirapen944@haotuwu.com',
      password: '12345678',
      nombre: 'Paciente 3',
      tipo: 'paciente',
      imagen: 'https://ui-avatars.com/api/?name=Paciente+3&background=4caf50&color=fff&size=128'
    },
    {
      email: 'selohe7298@dwakm.com',
      password: '12345678',
      nombre: 'Especialista 1',
      tipo: 'especialista',
      imagen: 'https://ui-avatars.com/api/?name=Especialista+1&background=ff9800&color=fff&size=128'
    },
    {
      email: 'kifac65230@hh7f.com',
      password: '12345678',
      nombre: 'Especialista 2',
      tipo: 'especialista',
      imagen: 'https://ui-avatars.com/api/?name=Especialista+2&background=ff9800&color=fff&size=128'
    }
  ];

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

  toggleUsuarios() {
    this.mostrarUsuarios.update(value => !value);
  }

  seleccionarUsuario(usuario: UsuarioRapido) {
    this.loginForm.setValue({
      username: usuario.email,
      password: usuario.password,
    });
    this.mostrarUsuarios.set(false);
  }
}
