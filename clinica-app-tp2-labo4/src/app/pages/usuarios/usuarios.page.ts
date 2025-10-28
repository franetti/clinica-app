// usuarios.page.ts
import { Component, OnInit } from '@angular/core';
import { UsuariosService } from '../../services/usuarios.service';
import { UsuarioDTO } from '../../models/usuario';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from "@angular/material/icon";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatTableModule, MatButtonModule, MatIcon,RouterLink],
  templateUrl: './usuarios.page.html'
})
export class UsuariosPage implements OnInit {
  pacientes: UsuarioDTO[] = [];
  especialistas: UsuarioDTO[] = [];

  displayedColumnsPacientes = ['nombre', 'apellido', 'fechaCreacion', 'obraSocial', 'dni', 'email'];
  displayedColumnsEspecialistas = ['nombre', 'apellido', 'fechaCreacion', 'obraSocial', 'dni', 'email', 'tipoUsuario', 'habilitado'];

  constructor(private usuariosService: UsuariosService) {}

  ngOnInit(): void {
    this.loadPacientes();
    this.loadEspecialistas();
  }

  loadPacientes() {
    this.usuariosService.getPacientes().subscribe(data => this.pacientes = data);
  }

  loadEspecialistas() {
    this.usuariosService.getEspecialistas().subscribe(data => this.especialistas = data);
  }

  toggleHabilitado(usuario: UsuarioDTO) {
      this.usuariosService.toggleHabilitado(usuario).subscribe(updated => {
        if(updated != null)
            usuario.habilitado = updated.habilitado;
    });
  }
}
