import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, switchMap } from 'rxjs/operators';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { RecaptchaWrapperComponent } from '../../directives/recaptcha-wrapper.component';
import { AuthService } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import { UsuarioDTO } from '../../models/usuario';
import { Router } from '@angular/router';
import { SpinnerService } from '../../services/spinner.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
   
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatSelectModule,
    MatTooltipModule,
    MatChipsModule,
    ReactiveFormsModule,
    FormsModule,
    RecaptchaWrapperComponent
],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideInUp', [
      transition(':enter', [
        style({ transform: 'translateY(50px)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('slideInDown', [
      transition(':enter', [
        style({ transform: 'translateY(-50px)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class RegisterComponent {
  tipoUsuario: string = '';
  tiposUsuarios: string[] = ['paciente', 'especialista', 'admin'];
  especialidades: string[] = ["Clinico", "Neumonologo", "Traumatologo", "Cardiologo"];
  especialidadesSeleccionadas: string[] = [];
  nuevaEspecialidad: string = ''; 
  usuarioForm!: FormGroup;    
  isAdmin: boolean = false;
  mostrarFormulario: boolean = false;
  @ViewChild('especialidadSelect') especialidadSelect!: MatSelect;

  imagenPaciente: string = 'assets/paciente.svg';
  imagenEspecialista: string = 'assets/especialista.svg';
  imagenAdmin: string = 'assets/admin.svg';

  siteKey: string = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
  recaptchaToken: string | null = null; 

  constructor(
    private AuthService: AuthService,
    private usuariosService: UsuariosService,
    private snackBar: MatSnackBar,
    private router: Router,
    private spinnerService: SpinnerService
  ) {

  }

  ngOnInit() {
    this.usuarioForm = new FormGroup({
      tipoUsuario: new FormControl('', Validators.required),
      nombre: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/)
      ]),
      apellido: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/)
      ]),
      edad: new FormControl('', [Validators.required, Validators.min(0), Validators.max(110)]),
      dni: new FormControl('', [Validators.required, Validators.pattern(/^\d{7,8}$/)]),     
      email: new FormControl('',
        [Validators.required, Validators.email],
        [this.emailExisteValidator()]
      ),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      imagen: new FormControl(null, Validators.required),
    });    

    this.AuthService.getUser().subscribe(user => {
      if (user && user.tipoUsuario === 'admin') {
        this.isAdmin = true;
      } 
    });
  }

  seleccionarTipoUsuario(tipo: string): void {
    this.tipoUsuario = tipo;
    this.usuarioForm.get('tipoUsuario')?.setValue(tipo);
    this.handlerFormControls();
    this.mostrarFormulario = true;
  }

  volverASeleccion(): void {
    this.mostrarFormulario = false;
    this.tipoUsuario = '';
    this.especialidadesSeleccionadas = [];
    this.nuevaEspecialidad = '';
    this.usuarioForm.reset();
  }

  
  async onSubmit() {
    try {
      this.spinnerService.show();

      if (this.usuarioForm.invalid) {
        this.usuarioForm.markAllAsTouched();

        this.snackBar.open('Por favor corrija los campos incorrectos', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['snack-error']
        });
        this.spinnerService.hide();
        return;
      }

      if (!this.recaptchaToken) {
        this.snackBar.open('Por favor complete el captcha de verificación', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['snack-error']
        });
        this.spinnerService.hide();
        return;
      }

      if (this.tipoUsuario === 'especialista' && this.especialidadesSeleccionadas.length === 0) {
        this.snackBar.open('Debe agregar al menos una especialidad', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['snack-error']
        });
        this.spinnerService.hide();
        return;
      }

      this.usuarioForm.disable();

      let datos = this.usuarioForm.value as UsuarioDTO;

      if (this.tipoUsuario === 'especialista') {
        datos.especialidad = this.especialidadesSeleccionadas.join(', ');
      }

      await this.AuthService.registrarUsuario(datos);
      this.usuarioForm.enable();
      this.recaptchaToken = null;
      this.router.navigate(['/login']);

      this.snackBar.open('Usuario registrado correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['snack-exito']
      }); 
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      this.snackBar.open('Ocurrio un error', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'bottom'
      });      
    }

    this.spinnerService.hide();
  }

  onFileSelected(event: any, controlName: string, form: FormGroup) {
    const file = event.target.files[0];
    form.get(controlName)?.setValue(file);
  }

  handlerFormControls() {
    if (this.tipoUsuario === 'paciente') {
      this.usuarioForm.addControl('obraSocial', new FormControl('', Validators.required));
      this.usuarioForm.addControl('imagen2', new FormControl(null, Validators.required));
      this.usuarioForm.removeControl('especialidad');    
      this.usuarioForm.removeControl('nuevaEspecialidad');    
    }
    
    if (this.tipoUsuario === 'especialista') {
      this.usuarioForm.addControl('nuevaEspecialidad', new FormControl('', Validators.pattern(/^[a-zA-Z\s]+$/)));
      this.especialidadesSeleccionadas = []; // Resetear especialidades seleccionadas
      this.usuarioForm.removeControl('obraSocial');      
      this.usuarioForm.removeControl('imagen2');
    }

    if (this.tipoUsuario === 'admin') {
      this.usuarioForm.removeControl('especialidad');    
      this.usuarioForm.removeControl('nuevaEspecialidad');    
      this.usuarioForm.removeControl('obraSocial');      
      this.usuarioForm.removeControl('imagen2');
    }
  }

  agregarEspecialidadDesdeInput() {
    const nueva = this.nuevaEspecialidad.trim();
    if (nueva && nueva.length > 0) {
      const especialidadFormateada = this.formatearEspecialidad(nueva);
      if (!this.especialidadesSeleccionadas.includes(especialidadFormateada)) {
        this.especialidadesSeleccionadas.push(especialidadFormateada);
        if (!this.especialidades.includes(especialidadFormateada)) {
          this.especialidades.push(especialidadFormateada);
        }
      this.nuevaEspecialidad = '';
        this.usuarioForm.get('nuevaEspecialidad')?.setValue('');
      } else {
        this.snackBar.open('Esta especialidad ya está agregada', 'Cerrar', {
          duration: 2000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom'
        });
      }
    }
  }

  agregarEspecialidadDesdeSelect(especialidad: string) {
    if (especialidad && especialidad.length > 0 && especialidad !== '') {
      const especialidadFormateada = this.formatearEspecialidad(especialidad);
      if (!this.especialidadesSeleccionadas.includes(especialidadFormateada)) {
        this.especialidadesSeleccionadas.push(especialidadFormateada);
        setTimeout(() => {
          if (this.especialidadSelect) {
            this.especialidadSelect.value = '';
          }
        }, 0);
      } else {
        this.snackBar.open('Esta especialidad ya está agregada', 'Cerrar', {
          duration: 2000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom'
        });
        setTimeout(() => {
          if (this.especialidadSelect) {
            this.especialidadSelect.value = '';
          }
        }, 0);
      }
    }
  }

  eliminarEspecialidad(especialidad: string) {
    const index = this.especialidadesSeleccionadas.indexOf(especialidad);
    if (index >= 0) {
      this.especialidadesSeleccionadas.splice(index, 1);
    }
  }

  formatearEspecialidad(especialidad: string): string {
    return especialidad
      .trim()
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
      .join(' ');
  }

  emailExisteValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.trim() === '') {
        return of(null);
      }

      if (control.hasError('email') || control.hasError('required')) {
        return of(null);
      }

      const email = control.value.trim().toLowerCase();

      return this.usuariosService.verificarEmailExiste(email).pipe(
        debounceTime(500),
        map(existe => {
          return existe ? { emailExiste: true } : null;
        }),
        catchError(() => of(null))
      );
    };
  }

  onCaptchaResolved(captchaResponse: string | null): void {
    this.recaptchaToken = captchaResponse;
    console.log('reCAPTCHA token:', captchaResponse);
  }
}
