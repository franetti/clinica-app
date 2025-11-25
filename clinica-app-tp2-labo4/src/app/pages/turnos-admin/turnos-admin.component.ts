import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TurnosService, TurnoDTO, EstadoTurno } from '../../services/turnos.service';
import { UsuariosService } from '../../services/usuarios.service';
import { UsuarioDTO } from '../../models/usuario';
import { CancelarTurnoDialogComponent } from './cancelar-turno-dialog.component';

interface TurnoConNombres extends TurnoDTO {
  nombrePaciente?: string;
  nombreEspecialista?: string;
}

@Component({
  selector: 'app-turnos-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './turnos-admin.component.html',
  styleUrls: ['./turnos-admin.component.scss']
})
export class TurnosAdminComponent implements OnInit {
  turnos: TurnoConNombres[] = [];
  turnosFiltrados: TurnoConNombres[] = [];
  pacientes: UsuarioDTO[] = [];
  especialistas: UsuarioDTO[] = [];
  cargando = false;

  // Filtros
  filtroTexto: string = '';

  constructor(
    private turnosService: TurnosService,
    private usuariosService: UsuariosService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando = true;
    try {
      // Cargar turnos, pacientes y especialistas en paralelo
      const [turnos, pacientes, especialistas] = await Promise.all([
        this.turnosService.obtenerTurnos(),
        this.usuariosService.getPacientes().toPromise(),
        this.usuariosService.getEspecialistas().toPromise()
      ]);

      this.turnos = turnos;
      this.pacientes = pacientes || [];
      this.especialistas = especialistas || [];

      // Enriquecer turnos con nombres
      this.turnos = this.turnos.map(turno => this.enriquecerTurnoConNombres(turno));

      // Ordenar por fecha (más recientes primero)
      this.turnos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      this.aplicarFiltros();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.snackBar.open('Error al cargar los turnos', 'Cerrar', {
        duration: 3000,
        panelClass: ['snack-error']
      });
    } finally {
      this.cargando = false;
    }
  }

  enriquecerTurnoConNombres(turno: TurnoDTO): TurnoConNombres {
    const paciente = this.pacientes.find(p => p.id === turno.paciente);
    const especialista = this.especialistas.find(e => e.id === turno.especialista);

    return {
      ...turno,
      nombrePaciente: paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Sin asignar',
      nombreEspecialista: especialista ? `Dr./Dra. ${especialista.nombre} ${especialista.apellido}` : 'Desconocido'
    };
  }

  aplicarFiltros() {
    const filtro = this.filtroTexto.toLowerCase().trim();

    if (!filtro) {
      this.turnosFiltrados = [...this.turnos];
      return;
    }

    this.turnosFiltrados = this.turnos.filter(turno => {
      const especialidad = (turno.especialidad || '').toLowerCase();
      const nombreEspecialista = (turno.nombreEspecialista || '').toLowerCase();
      const nombrePaciente = (turno.nombrePaciente || '').toLowerCase();

      return especialidad.includes(filtro) ||
             nombreEspecialista.includes(filtro) ||
             nombrePaciente.includes(filtro);
    });
  }

  onFiltroChange() {
    this.aplicarFiltros();
  }

  limpiarFiltros() {
    this.filtroTexto = '';
    this.aplicarFiltros();
  }

  puedeCancelar(turno: TurnoDTO): boolean {
    const estadosNoCancelables: EstadoTurno[] = ['aceptado', 'realizado', 'rechazado'];
    return !estadosNoCancelables.includes(turno.estadoTurno || 'pendiente');
  }

  abrirDialogoCancelar(turno: TurnoConNombres) {
    const dialogRef = this.dialog.open(CancelarTurnoDialogComponent, {
      width: '500px',
      data: { turno }
    });

    dialogRef.afterClosed().subscribe(async (comentario: string) => {
      if (comentario) {
        await this.cancelarTurno(turno, comentario);
      }
    });
  }

  async cancelarTurno(turno: TurnoConNombres, comentario: string) {
    this.cargando = true;
    try {
      await this.turnosService.actualizarTurno(turno.id, {
        estadoTurno: 'cancelado',
        comentario: comentario
      });

      this.snackBar.open('Turno cancelado exitosamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['snack-exito']
      });

      // Recargar datos
      await this.cargarDatos();
    } catch (error) {
      console.error('Error al cancelar turno:', error);
      this.snackBar.open('Error al cancelar el turno', 'Cerrar', {
        duration: 3000,
        panelClass: ['snack-error']
      });
    } finally {
      this.cargando = false;
    }
  }

  formatearFecha(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-AR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoClass(estado?: EstadoTurno): string {
    switch (estado) {
      case 'pendiente': return 'estado-pendiente';
      case 'aceptado': return 'estado-aceptado';
      case 'realizado': return 'estado-realizado';
      case 'cancelado': return 'estado-cancelado';
      case 'rechazado': return 'estado-rechazado';
      default: return '';
    }
  }

  getEstadoIcon(estado?: EstadoTurno): string {
    switch (estado) {
      case 'pendiente': return 'schedule';
      case 'aceptado': return 'check_circle';
      case 'realizado': return 'done_all';
      case 'cancelado': return 'cancel';
      case 'rechazado': return 'block';
      default: return 'help';
    }
  }

  getEstadoTexto(estado?: EstadoTurno): string {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'aceptado': return 'Aceptado';
      case 'realizado': return 'Realizado';
      case 'cancelado': return 'Cancelado';
      case 'rechazado': return 'Rechazado';
      default: return 'Desconocido';
    }
  }
}


