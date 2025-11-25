import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TurnosService, TurnoDTO, EstadoTurno } from '../../services/turnos.service';
import { UsuariosService } from '../../services/usuarios.service';
import { UsuarioDTO } from '../../models/usuario';
import { 
  CancelarTurnoDialogComponent 
} from './dialogs/cancelar-turno-dialog.component';
import {
  VerReseniaDialogComponent
} from './dialogs/ver-resenia-dialog.component';
import {
  CompletarEncuestaDialogComponent
} from './dialogs/completar-encuesta-dialog.component';
import {
  CalificarAtencionDialogComponent
} from './dialogs/calificar-atencion-dialog.component';

interface TurnoConNombres extends TurnoDTO {
  nombreEspecialista?: string;
}

@Component({
  selector: 'app-mis-turnos-paciente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './mis-turnos-paciente.component.html',
  styleUrls: ['./mis-turnos.component.scss']
})
export class MisTurnosPacienteComponent implements OnInit {
  @Input() idUsuario: string = "";
  
  turnos: TurnoConNombres[] = [];
  turnosFiltrados: TurnoConNombres[] = [];
  especialistas: UsuarioDTO[] = [];
  cargando = false;
  
  // Filtro
  filtroTexto: string = '';

  constructor(
    private turnosService: TurnosService,
    private usuariosService: UsuariosService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    if (this.idUsuario) {
      await this.cargarDatos();
    }
  }

  async cargarDatos() {
    this.cargando = true;
    try {
      const [turnos, especialistas] = await Promise.all([
        this.turnosService.obtenerTurnosPaciente(this.idUsuario),
        this.usuariosService.getEspecialistas().toPromise()
      ]);

      this.especialistas = especialistas || [];
      this.turnos = turnos.map(t => this.enriquecerTurnoConNombres(t));
      
      // Ordenar por fecha (más recientes primero)
      this.turnos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      
      this.aplicarFiltros();
    } catch (error) {
      console.error('Error al cargar turnos:', error);
      this.snackBar.open('Error al cargar los turnos', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.cargando = false;
    }
  }

  enriquecerTurnoConNombres(turno: TurnoDTO): TurnoConNombres {
    const especialista = this.especialistas.find(e => e.id === turno.especialista);
    return {
      ...turno,
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
      
      return especialidad.includes(filtro) || nombreEspecialista.includes(filtro);
    });
  }

  onFiltroChange() {
    this.aplicarFiltros();
  }

  limpiarFiltros() {
    this.filtroTexto = '';
    this.aplicarFiltros();
  }

  // Validaciones de acciones
  puedeCancelar(turno: TurnoDTO): boolean {
    return turno.estadoTurno !== 'realizado';
  }

  puedeVerResenia(turno: TurnoDTO): boolean {
    return !!(turno.comentario || turno.resenia);
  }

  puedeCompletarEncuesta(turno: TurnoDTO): boolean {
    return turno.estadoTurno === 'realizado' && !!(turno.comentario || turno.resenia);
  }

  puedeCalificar(turno: TurnoDTO): boolean {
    return turno.estadoTurno === 'realizado';
  }

  // Acciones
  cancelarTurno(turno: TurnoConNombres) {
    const dialogRef = this.dialog.open(CancelarTurnoDialogComponent, {
      width: '500px',
      data: { turno, rol: 'paciente' }
    });

    dialogRef.afterClosed().subscribe(async (comentario: string) => {
      if (comentario) {
        await this.ejecutarCancelacion(turno, comentario);
      }
    });
  }

  private async ejecutarCancelacion(turno: TurnoDTO, comentario: string) {
    this.cargando = true;
    try {
      await this.turnosService.actualizarTurno(turno.id, {
        estadoTurno: 'cancelado',
        comentario: comentario
      });

      this.snackBar.open('Turno cancelado exitosamente', 'Cerrar', {
        duration: 3000
      });

      await this.cargarDatos();
    } catch (error) {
      console.error('Error al cancelar turno:', error);
      this.snackBar.open('Error al cancelar el turno', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.cargando = false;
    }
  }

  verResenia(turno: TurnoConNombres) {
    this.dialog.open(VerReseniaDialogComponent, {
      width: '600px',
      data: { turno, rol: 'paciente' }
    });
  }

  completarEncuesta(turno: TurnoConNombres) {
    const dialogRef = this.dialog.open(CompletarEncuestaDialogComponent, {
      width: '600px',
      data: { turno }
    });

    dialogRef.afterClosed().subscribe(async (respuestas: any) => {
      if (respuestas) {
        // Aquí se podría guardar en una tabla de encuestas
        // Por ahora solo mostramos confirmación
        this.snackBar.open('Encuesta completada exitosamente', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  calificarAtencion(turno: TurnoConNombres) {
    const dialogRef = this.dialog.open(CalificarAtencionDialogComponent, {
      width: '500px',
      data: { turno }
    });

    dialogRef.afterClosed().subscribe(async (resultado: { calificacion: number, resenia: string }) => {
      if (resultado) {
        await this.guardarCalificacion(turno, resultado);
      }
    });
  }

  private async guardarCalificacion(turno: TurnoDTO, resultado: { calificacion: number, resenia: string }) {
    this.cargando = true;
    try {
      await this.turnosService.actualizarTurno(turno.id, {
        calificacion: resultado.calificacion,
        resenia: resultado.resenia
      });

      this.snackBar.open('Calificación guardada exitosamente', 'Cerrar', {
        duration: 3000
      });

      await this.cargarDatos();
    } catch (error) {
      console.error('Error al guardar calificación:', error);
      this.snackBar.open('Error al guardar la calificación', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.cargando = false;
    }
  }

  // Helpers
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
