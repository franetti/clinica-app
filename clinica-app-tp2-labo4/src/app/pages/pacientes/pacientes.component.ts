import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import { HistoriaClinicaService, HistoriaClinicaDTO, DatoDinamico } from '../../services/historia-clinica.service';
import { TurnosService, TurnoDTO } from '../../services/turnos.service';
import { UsuarioDTO } from '../../models/usuario';
import { HistoriaClinicaFormatoPipe } from '../../pipes/historia-clinica-formato.pipe';
import { DniFormatoPipe } from '../../pipes/dni-formato.pipe';
import { EstadoTurnoPipe } from '../../pipes/estado-turno.pipe';

interface PacienteConTurnos extends UsuarioDTO {
  ultimosTurnos?: TurnoDTO[];
}

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    HistoriaClinicaFormatoPipe,
    DniFormatoPipe,
    EstadoTurnoPipe
  ],
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.scss']
})
export class PacientesComponent implements OnInit {
  pacientes: PacienteConTurnos[] = [];
  cargando = false;
  usuarioActual: UsuarioDTO | null = null;

  constructor(
    private authService: AuthService,
    private usuariosService: UsuariosService,
    private historiaClinicaService: HistoriaClinicaService,
    private turnosService: TurnosService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  async ngOnInit() {
    this.authService.getUser().subscribe(async user => {
      this.usuarioActual = user;
      if (user?.id && user?.tipoUsuario === 'especialista') {
        await this.cargarPacientes(user.id);
      }
    });
  }

  async cargarPacientes(idEspecialista: string) {
    this.cargando = true;
    try {
      // Obtener IDs de pacientes atendidos por este especialista
      const idsPacientes = await this.historiaClinicaService.obtenerPacientesAtendidosPorEspecialista(idEspecialista);

      if (idsPacientes.length === 0) {
        this.pacientes = [];
        this.cargando = false;
        return;
      }

      // Obtener todos los pacientes
      const todosLosPacientes = await this.usuariosService.getPacientes().toPromise();

      // Filtrar solo los pacientes atendidos
      const pacientesFiltrados = (todosLosPacientes || []).filter(p =>
        p.id && idsPacientes.includes(p.id)
      );

      // Cargar los últimos 3 turnos de cada paciente
      this.pacientes = await Promise.all(
        pacientesFiltrados.map(async (paciente) => {
          const pacienteConTurnos: PacienteConTurnos = { ...paciente };
          if (paciente.id) {
            try {
              const turnos = await this.turnosService.obtenerTurnosPaciente(paciente.id);
              // Filtrar solo los turnos con este especialista y ordenar por fecha descendente
              const turnosConEspecialista = turnos
                .filter(t => t.especialista === idEspecialista)
                .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                .slice(0, 3); // Últimos 3 turnos
              pacienteConTurnos.ultimosTurnos = turnosConEspecialista;
            } catch (error) {
              console.error(`Error al cargar turnos del paciente ${paciente.id}:`, error);
              pacienteConTurnos.ultimosTurnos = [];
            }
          }
          return pacienteConTurnos;
        })
      );
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      this.snackBar.open('Error al cargar los pacientes', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.cargando = false;
    }
  }

  formatearFecha(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoTexto(estado?: string): string {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'aceptado': return 'Aceptado';
      case 'realizado': return 'Realizado';
      case 'cancelado': return 'Cancelado';
      case 'rechazado': return 'Rechazado';
      default: return 'Desconocido';
    }
  }

  verHistoriaClinica(usuario: UsuarioDTO) {
    if (!usuario.id || !this.usuarioActual?.id) return;

    this.historiaClinicaService.obtenerHistoriaClinicaPorEspecialista(this.usuarioActual.id).then(historias => {
      // Filtrar solo las historias de este paciente
      const historiasPaciente = historias.filter(h => h.idPaciente === usuario.id);

      this.dialog.open(HistoriaClinicaDialogComponent, {
        width: '800px',
        maxHeight: '90vh',
        data: {
          usuario: usuario,
          historias: historiasPaciente
        }
      });
    }).catch(error => {
      console.error('Error al cargar historia clínica:', error);
      this.snackBar.open('Error al cargar la historia clínica', 'Cerrar', {
        duration: 3000
      });
    });
  }
}

// Componente de diálogo para mostrar historia clínica
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-historia-clinica-dialog-pacientes',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatCardModule, MatButtonModule, MatIconModule, HistoriaClinicaFormatoPipe],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>medical_services</mat-icon>
      Historia Clínica - {{ data.usuario.nombre }} {{ data.usuario.apellido }}
    </h2>
    <mat-dialog-content>
      <div *ngIf="data.historias.length === 0" class="no-historia">
        <mat-icon>medical_information</mat-icon>
        <p>No hay registros de historia clínica para este paciente</p>
      </div>
      <div *ngIf="data.historias.length > 0" class="historias-list">
        <mat-card *ngFor="let registro of data.historias" class="historia-item">
          <mat-card-content>
            <div class="historia-header">
              <div class="historia-fecha">
                <mat-icon>calendar_today</mat-icon>
                <span>{{ formatearFecha(registro.created_at) }}</span>
              </div>
            </div>
            <div class="historia-datos">
              <h4>Datos Fijos</h4>
              <div class="datos-grid">
                <div class="dato-item" *ngIf="registro.altura">
                  <mat-icon>height</mat-icon>
                  <div>
                    <span class="dato-label">Altura</span>
                    <span class="dato-value">{{ registro.altura | historiaClinicaFormato:'altura' }}</span>
                  </div>
                </div>
                <div class="dato-item" *ngIf="registro.peso">
                  <mat-icon>monitor_weight</mat-icon>
                  <div>
                    <span class="dato-label">Peso</span>
                    <span class="dato-value">{{ registro.peso | historiaClinicaFormato:'peso' }}</span>
                  </div>
                </div>
                <div class="dato-item" *ngIf="registro.temperatura">
                  <mat-icon>thermostat</mat-icon>
                  <div>
                    <span class="dato-label">Temperatura</span>
                    <span class="dato-value">{{ registro.temperatura | historiaClinicaFormato:'temperatura' }}</span>
                  </div>
                </div>
                <div class="dato-item" *ngIf="registro.presion">
                  <mat-icon>favorite</mat-icon>
                  <div>
                    <span class="dato-label">Presión</span>
                    <span class="dato-value">{{ registro.presion | historiaClinicaFormato:'presion' }}</span>
                  </div>
                </div>
              </div>
              <div *ngIf="parsearDatosDinamicos(registro.dinamicos).length > 0" class="datos-dinamicos-section">
                <h4>Otros Datos</h4>
                <div class="dinamicos-list">
                  <div *ngFor="let dato of parsearDatosDinamicos(registro.dinamicos)" class="dato-dinamico">
                    <span class="dato-clave">{{ dato.clave }}:</span>
                    <span class="dato-valor">{{ dato.valor }}</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cerrar()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #4caf50;
    }
    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
      padding: 1rem 0;
    }
    .no-historia {
      text-align: center;
      padding: 2rem;
      color: #6c757d;
    }
    .historias-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .historia-item {
      .historia-header {
        border-bottom: 2px solid #e9ecef;
        padding-bottom: 0.5rem;
        margin-bottom: 1rem;
      }
      .historia-fecha {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #495057;
        font-weight: 600;
      }
      .datos-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin: 1rem 0;
      }
      .dato-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: #f8f9fa;
        border-radius: 8px;
      }
      .datos-dinamicos-section {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e9ecef;
      }
      .dinamicos-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      .dato-dinamico {
        padding: 0.5rem 0.75rem;
        background: #e8f5e9;
        border-radius: 6px;
      }
    }
  `]
})
class HistoriaClinicaDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<HistoriaClinicaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { usuario: UsuarioDTO, historias: HistoriaClinicaDTO[] },
    private historiaClinicaService: HistoriaClinicaService
  ) { }

  parsearDatosDinamicos(dinamicos: string): DatoDinamico[] {
    return this.historiaClinicaService.parsearDatosDinamicos(dinamicos);
  }

  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return '';
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return fechaObj.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  cerrar() {
    this.dialogRef.close();
  }
}

