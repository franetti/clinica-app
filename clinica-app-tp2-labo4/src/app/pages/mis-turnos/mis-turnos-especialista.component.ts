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
import { HistoriaClinicaService, HistoriaClinicaDTO } from '../../services/historia-clinica.service';
import { EstadoTurnoPipe } from '../../pipes/estado-turno.pipe';
import { FiltroTurnosPipe } from '../../pipes/filtro-turnos.pipe';
import {
  CancelarTurnoDialogComponent
} from './dialogs/cancelar-turno-dialog.component';
import {
  RechazarTurnoDialogComponent
} from './dialogs/rechazar-turno-dialog.component';
import {
  FinalizarTurnoDialogComponent
} from './dialogs/finalizar-turno-dialog.component';
import {
  VerReseniaDialogComponent
} from './dialogs/ver-resenia-dialog.component';

interface TurnoConNombres extends TurnoDTO {
  nombrePaciente?: string;
}

@Component({
  selector: 'app-mis-turnos-especialista',
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
    MatSnackBarModule,
    EstadoTurnoPipe,
    FiltroTurnosPipe
  ],
  templateUrl: './mis-turnos-especialista.component.html',
  styleUrls: ['./mis-turnos.component.scss']
})
export class MisTurnosEspecialistaComponent implements OnInit {
  @Input() idUsuario: string = "";

  turnos: TurnoConNombres[] = [];
  pacientes: UsuarioDTO[] = [];
  cargando = false;
  historiasClinicas: Map<string, HistoriaClinicaDTO[]> = new Map();

  // Filtro
  filtroTexto: string = '';

  get opcionesFiltro() {
    return {
      buscarEnHistoriaClinica: true,
      historiasClinicas: this.historiasClinicas,
      campos: ['especialidad', 'paciente'] as const
    };
  }

  constructor(
    private turnosService: TurnosService,
    private usuariosService: UsuariosService,
    private historiaClinicaService: HistoriaClinicaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  async ngOnInit() {
    if (this.idUsuario) {
      await this.cargarDatos();
    }
  }

  async cargarDatos() {
    this.cargando = true;
    try {
      const [turnos, pacientes] = await Promise.all([
        this.turnosService.obtenerTurnosEspecialista(this.idUsuario),
        this.usuariosService.getPacientes().toPromise()
      ]);

      this.pacientes = pacientes || [];
      this.turnos = turnos.map(t => this.enriquecerTurnoConNombres(t));

      // Cargar historias clínicas para los turnos realizados
      await this.cargarHistoriasClinicas();

      // Ordenar por fecha (más recientes primero)
      this.turnos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    } catch (error) {
      console.error('Error al cargar turnos:', error);
      this.snackBar.open('Error al cargar los turnos', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.cargando = false;
    }
  }

  async cargarHistoriasClinicas() {
    try {
      const historias = await this.historiaClinicaService.obtenerHistoriaClinicaPorEspecialista(this.idUsuario);

      // Agrupar historias por turno (basado en fecha y paciente)
      this.turnos.forEach(turno => {
        if (turno.estadoTurno === 'realizado' && turno.paciente) {
          const historiasTurno = historias.filter(h =>
            h.idPaciente === turno.paciente &&
            h.idEspecialista === turno.especialista
          );
          this.historiasClinicas.set(turno.id, historiasTurno);
        }
      });
    } catch (error) {
      console.error('Error al cargar historias clínicas:', error);
    }
  }

  // Método removido - ahora se usa FiltroTurnosPipe

  enriquecerTurnoConNombres(turno: TurnoDTO): TurnoConNombres {
    const paciente = this.pacientes.find(p => p.id === turno.paciente);
    return {
      ...turno,
      nombrePaciente: paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Sin asignar'
    };
  }

  // Métodos de filtrado removidos - ahora se usa FiltroTurnosPipe en el template
  limpiarFiltros() {
    this.filtroTexto = '';
  }

  // Validaciones de acciones
  // Cancelar: visible solo si NO es Aceptado, Realizado o Rechazado
  // También debe verificar que el turno no esté ya cancelado
  puedeCancelar(turno: TurnoDTO): boolean {
    const estado = turno.estadoTurno;
    if (!estado) return true; // Si no tiene estado, asumimos pendiente
    // Si ya está cancelado, no puede cancelarse de nuevo
    if (estado === 'cancelado') return false;
    const estadosNoCancelables: EstadoTurno[] = ['aceptado', 'realizado', 'rechazado'];
    return !estadosNoCancelables.includes(estado);
  }

  // Rechazar: visible solo si NO es Aceptado, Realizado o Cancelado
  // También debe verificar que el turno no esté ya rechazado
  puedeRechazar(turno: TurnoDTO): boolean {
    const estado = turno.estadoTurno;
    if (!estado) return true; // Si no tiene estado, asumimos pendiente
    // Si ya está rechazado, no puede rechazarse de nuevo
    if (estado === 'rechazado') return false;
    const estadosNoRechazables: EstadoTurno[] = ['aceptado', 'realizado', 'cancelado'];
    return !estadosNoRechazables.includes(estado);
  }

  // Aceptar: visible solo si NO es Realizado, Cancelado o Rechazado
  // También debe verificar que el turno no esté ya aceptado
  puedeAceptar(turno: TurnoDTO): boolean {
    const estado = turno.estadoTurno;
    if (!estado) return true; // Si no tiene estado, asumimos pendiente
    // Si ya está aceptado, no puede aceptarse de nuevo
    if (estado === 'aceptado') return false;
    const estadosNoAceptables: EstadoTurno[] = ['realizado', 'cancelado', 'rechazado'];
    return !estadosNoAceptables.includes(estado);
  }

  // Finalizar: visible solo si es Aceptado
  puedeFinalizar(turno: TurnoDTO): boolean {
    return turno.estadoTurno === 'aceptado';
  }

  puedeVerResenia(turno: TurnoDTO): boolean {
    return !!(turno.comentario || turno.resenia);
  }

  // Acciones
  cancelarTurno(turno: TurnoConNombres) {
    const dialogRef = this.dialog.open(CancelarTurnoDialogComponent, {
      width: '500px',
      data: { turno, rol: 'especialista' }
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

  rechazarTurno(turno: TurnoConNombres) {
    const dialogRef = this.dialog.open(RechazarTurnoDialogComponent, {
      width: '500px',
      data: { turno }
    });

    dialogRef.afterClosed().subscribe(async (comentario: string) => {
      if (comentario) {
        await this.ejecutarRechazo(turno, comentario);
      }
    });
  }

  private async ejecutarRechazo(turno: TurnoDTO, comentario: string) {
    this.cargando = true;
    try {
      await this.turnosService.actualizarTurno(turno.id, {
        estadoTurno: 'rechazado',
        comentario: comentario
      });

      this.snackBar.open('Turno rechazado exitosamente', 'Cerrar', {
        duration: 3000
      });

      await this.cargarDatos();
    } catch (error) {
      console.error('Error al rechazar turno:', error);
      this.snackBar.open('Error al rechazar el turno', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.cargando = false;
    }
  }

  aceptarTurno(turno: TurnoConNombres) {
    this.ejecutarAceptacion(turno);
  }

  private async ejecutarAceptacion(turno: TurnoDTO) {
    this.cargando = true;
    try {
      await this.turnosService.actualizarTurno(turno.id, {
        estadoTurno: 'aceptado'
      });

      this.snackBar.open('Turno aceptado exitosamente', 'Cerrar', {
        duration: 3000
      });

      await this.cargarDatos();
    } catch (error) {
      console.error('Error al aceptar turno:', error);
      this.snackBar.open('Error al aceptar el turno', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.cargando = false;
    }
  }

  finalizarTurno(turno: TurnoConNombres) {
    const dialogRef = this.dialog.open(FinalizarTurnoDialogComponent, {
      width: '600px',
      data: { turno }
    });

    dialogRef.afterClosed().subscribe(async (resultado: any) => {
      if (resultado && resultado.comentario) {
        await this.ejecutarFinalizacion(turno, resultado);
      }
    });
  }

  private async ejecutarFinalizacion(turno: TurnoDTO, resultado: any) {
    this.cargando = true;
    try {
      // Actualizar el turno
      await this.turnosService.actualizarTurno(turno.id, {
        estadoTurno: 'realizado',
        comentario: resultado.comentario
      });

      // Guardar la historia clínica si existe
      if (resultado.historiaClinica && turno.paciente) {
        try {
          await this.historiaClinicaService.crearHistoriaClinica(resultado.historiaClinica);
        } catch (error) {
          console.error('Error al guardar historia clínica:', error);
          this.snackBar.open('Turno finalizado, pero hubo un error al guardar la historia clínica', 'Cerrar', {
            duration: 5000
          });
          await this.cargarDatos();
          return;
        }
      }

      this.snackBar.open('Turno finalizado exitosamente', 'Cerrar', {
        duration: 3000
      });

      await this.cargarDatos();
    } catch (error) {
      console.error('Error al finalizar turno:', error);
      this.snackBar.open('Error al finalizar el turno', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.cargando = false;
    }
  }

  verResenia(turno: TurnoConNombres) {
    this.dialog.open(VerReseniaDialogComponent, {
      width: '600px',
      data: { turno, rol: 'especialista' }
    });
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

  // Métodos removidos - ahora se usa EstadoTurnoPipe
}
