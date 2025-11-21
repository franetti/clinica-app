import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UsuarioDTO } from '../../models/usuario';
import { MisTurnosPacienteComponent } from './mis-turnos-paciente.component';
import { MisTurnosEspecialistaComponent } from './mis-turnos-especialista.component';

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [NgIf, MisTurnosPacienteComponent, MisTurnosEspecialistaComponent],
  template: `
    <ng-container *ngIf="tipo == 'paciente'">
      <app-mis-turnos-paciente then [idUsuario]="user.id!"></app-mis-turnos-paciente>
    </ng-container>

    <ng-container *ngIf="tipo == 'especialista'">
      <app-mis-turnos-especialista [idUsuario]="user.id!"></app-mis-turnos-especialista>
    </ng-container>
  `
})
export class MisTurnosComponent implements OnInit {

  tipo: 'paciente' | 'especialista' = 'paciente';
  user: UsuarioDTO = {} as UsuarioDTO; 
  constructor(private auth: AuthService) {

  }

  async ngOnInit() {
    await this.auth.getUser().subscribe(data => {
      this.user = data!;
      if(this.user?.tipoUsuario == 'especialista') {
        this.tipo = 'especialista';
      }
    })// método que supongo que tienes
  }

}
