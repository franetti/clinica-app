import { Component, Input, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { TurnosService, TurnoDTO } from '../../services/turnos.service';
import { DatePipe, UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-mis-turnos-especialista',
  standalone: true,
  imports: [NgIf, NgFor, MatListModule, MatButtonModule, MatChipsModule,DatePipe, UpperCasePipe],
  templateUrl: './mis-turnos-especialista.component.html'
})
export class MisTurnosEspecialistaComponent implements OnInit {
  @Input() idUsuario: string = "";
  turnos: TurnoDTO[] = [];
  cargando = true;

  constructor(private turnosService: TurnosService) {}

  async ngOnInit() {
    if (this.idUsuario){
      this.turnos = await this.turnosService.obtenerTurnosEspecialista(this.idUsuario);
          this.cargando = false;
    }


  }

  cancelar(t: TurnoDTO) {}
  rechazar(t: TurnoDTO) {}
  aceptar(t: TurnoDTO) {}
  finalizar(t: TurnoDTO) {}
  verResenna(t: TurnoDTO) {}

}
