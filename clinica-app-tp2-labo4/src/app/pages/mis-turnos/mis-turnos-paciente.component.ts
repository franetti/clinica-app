import { Component, Input, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { TurnosService, TurnoDTO } from '../../services/turnos.service';
import { DatePipe, UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-mis-turnos-paciente',
  standalone: true,
  imports: [NgIf, NgFor, MatListModule, MatButtonModule, MatChipsModule, DatePipe,UpperCasePipe],
  templateUrl: './mis-turnos-paciente.component.html'
})
export class MisTurnosPacienteComponent implements OnInit {
  @Input() idUsuario: string = "";
  turnos: TurnoDTO[] = [];
  cargando = true;

  constructor(private turnosService: TurnosService) {}

  async ngOnInit() {
    if (this.idUsuario) {
      this.turnos = await this.turnosService.obtenerTurnosPaciente(this.idUsuario);
      this.cargando = false; 
    }
  }

  cancelar(turno: TurnoDTO) {
    // abrir dialog y poner comentario
  }

  verResenna(turno: TurnoDTO) {
    // abrir modal reseña
  }

  completarEncuesta(turno: TurnoDTO) {
    // modal encuesta
  }

  calificar(turno: TurnoDTO) {
    // modal calificar
  }

}
