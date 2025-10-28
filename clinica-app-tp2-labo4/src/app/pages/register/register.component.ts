import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule ,FormsModule} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { UsuarioDTO } from '../../models/usuario';
import { Router, ɵEmptyOutletComponent } from '@angular/router';
import { SpinnerService } from '../../services/spinner.service';
   
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
    ReactiveFormsModule,
    FormsModule,
    ɵEmptyOutletComponent
],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent
{
  tipoUsuario: string = ''; //por defecto
  tiposUsuarios: string[] = ['paciente', 'especialista', 'admin']; //TRAERMELO DE UN LOS TIPOS QEU ESTAN E LA TABLA 
  especialidades: string[] = ["Clinico", "Pediatra", "Traumatologo", "Cardiologo"];//traermelas de un servivio
  nuevaEspecialidad: string = ''; 
  usuarioForm!: FormGroup;    
  isAdmin:boolean = false; 

  constructor(private AuthService: AuthService, private snackBar: MatSnackBar, private router: Router,
    private spinnerService: SpinnerService
  ) {

  }

  ngOnInit()
  { 
    this.usuarioForm = new FormGroup({
      tipoUsuario: new FormControl('', Validators.required),
      nombre: new FormControl('', Validators.required),
      apellido: new FormControl('', Validators.required),
      edad: new FormControl('', [Validators.required, Validators.min(0), Validators.max(110)]),
      dni: new FormControl('', [Validators.required, Validators.pattern(/^\d{7,8}$/)]),     
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      imagen: new FormControl(null, Validators.required),      
    });    
    this.tipoUsuario = this.tiposUsuarios[0];
    this.handlerFormControls();
    //this.getEspecialidades();

    this.AuthService.getUser().subscribe(user => {
      if (user && user.tipoUsuario === 'admin') {
        this.isAdmin = true;
      } 
    });
        //TODO CARGAR ESPECIALIDADES.
    //TODO TRAER TIPOS USUARIOS DESDE UN SERVICIO   
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

      this.usuarioForm.disable();

      let datos = this.usuarioForm.value as UsuarioDTO;

      await this.AuthService.registrarUsuario(datos);    
      this.usuarioForm.enable();
      this.router.navigate(['/login']);

      this.snackBar.open('Usuario registrado correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['snack-exito']
      }); 
    }catch(error) {
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
      this.usuarioForm.addControl('especialidad', new FormControl('', Validators.required));
      this.usuarioForm.addControl('nuevaEspecialidad', new FormControl('', Validators.pattern(/^[a-zA-Z\s]+$/)));
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

  agregarEspecialidad() {
    const nueva = this.nuevaEspecialidad.trim();
    debugger
    if (nueva && !this.especialidades.includes(nueva)) {
      this.especialidades.push(nueva);
      this.nuevaEspecialidad = '';
      this.usuarioForm.get('especialidad')?.setValue(nueva);
    }
  }
}
