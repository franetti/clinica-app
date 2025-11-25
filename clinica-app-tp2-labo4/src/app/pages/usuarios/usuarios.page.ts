import { Component, OnInit } from '@angular/core';
import { UsuariosService } from '../../services/usuarios.service';
import { UsuarioDTO } from '../../models/usuario';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from "@angular/material/icon";
import { RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Inject } from '@angular/core';
import * as XLSX from 'xlsx';
import { HistoriaClinicaService, HistoriaClinicaDTO, DatoDinamico } from '../../services/historia-clinica.service';
import { TurnosService, TurnoDTO } from '../../services/turnos.service';
import { DniFormatoPipe } from '../../pipes/dni-formato.pipe';
import { HistoriaClinicaFormatoPipe } from '../../pipes/historia-clinica-formato.pipe';
import { HighlightDirective } from '../../directives/highlight.directive';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatTableModule, MatButtonModule, MatIcon, RouterLink, MatDialogModule, MatCardModule, MatTooltipModule, MatChipsModule, MatProgressSpinnerModule, DniFormatoPipe, HistoriaClinicaFormatoPipe, HighlightDirective],
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss']
})
export class UsuariosPage implements OnInit {
  pacientes: UsuarioDTO[] = [];
  especialistas: UsuarioDTO[] = [];
  especialistasMap: Map<string, UsuarioDTO> = new Map();
  descargandoUsuario: string | null = null;

  constructor(
    private usuariosService: UsuariosService,
    private historiaClinicaService: HistoriaClinicaService,
    private turnosService: TurnosService,
    private dialog: MatDialog
  ) { }

  async ngOnInit(): Promise<void> {
    await this.loadEspecialistas();
    this.loadPacientes();
  }

  async loadEspecialistas(): Promise<void> {
    this.usuariosService.getEspecialistas().subscribe(data => {
      this.especialistas = data;
      data.forEach(esp => {
        if (esp.id) {
          this.especialistasMap.set(esp.id, esp);
        }
      });
    });
  }

  loadPacientes() {
    this.usuariosService.getPacientes().subscribe(data => this.pacientes = data);
  }

  toggleHabilitado(usuario: UsuarioDTO) {
    this.usuariosService.toggleHabilitado(usuario).subscribe(updated => {
      if (updated != null) {
        usuario.habilitado = updated.habilitado;
      }
      this.loadPacientes();
      this.loadEspecialistas();
    });
  }

  descargarExcel() {
    this.usuariosService.getAll().subscribe(usuarios => {
      const datosExcel = usuarios.map(usuario => ({
        'Nombre': usuario.nombre,
        'Apellido': usuario.apellido,
        'Email': usuario.email,
        'DNI': usuario.dni,
        'Edad': usuario.edad,
        'Tipo Usuario': usuario.tipoUsuario,
        'Obra Social': usuario.obraSocial || '',
        'Especialidad': usuario.especialidad || '',
        'Habilitado': usuario.habilitado ? 'Sí' : 'No',
        'Fecha Creación': usuario.fechaCreacion ? new Date(usuario.fechaCreacion).toLocaleDateString('es-AR') : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(datosExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

      const columnWidths = [
        { wch: 15 },
        { wch: 15 },
        { wch: 25 },
        { wch: 12 },
        { wch: 8 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 12 },
        { wch: 15 }
      ];
      worksheet['!cols'] = columnWidths;

      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `usuarios_${fecha}.xlsx`;
      XLSX.writeFile(workbook, nombreArchivo);
    });
  }

  verHistoriaClinica(usuario: UsuarioDTO) {
    if (!usuario.id) return;

    this.historiaClinicaService.obtenerHistoriaClinicaPaciente(usuario.id).then(historias => {
      this.dialog.open(HistoriaClinicaDialogComponent, {
        width: '800px',
        maxHeight: '90vh',
        data: {
          usuario: usuario,
          historias: historias
        }
      });
    }).catch(error => {
      console.error('Error al cargar historia clínica:', error);
    });
  }

  parsearDatosDinamicos(dinamicos: string): DatoDinamico[] {
    return this.historiaClinicaService.parsearDatosDinamicos(dinamicos);
  }

  async descargarInfoUsuario(usuario: UsuarioDTO) {
    if (!usuario.id) return;

    this.descargandoUsuario = usuario.id;

    try {
      let turnos: TurnoDTO[] = [];
      if (usuario.tipoUsuario === 'paciente') {
        turnos = await this.turnosService.obtenerTurnosPaciente(usuario.id);
      } else if (usuario.tipoUsuario === 'especialista') {
        turnos = await this.turnosService.obtenerTurnosEspecialista(usuario.id);
      }

      const todosUsuarios = await this.usuariosService.getAll().toPromise() || [];
      const usuariosMap = new Map<string, UsuarioDTO>();
      todosUsuarios.forEach(u => {
        if (u.id) {
          usuariosMap.set(u.id, u);
        }
      });

      const turnosEnriquecidos = turnos.map(turno => {
        let nombreEspecialista = 'N/A';
        let nombrePaciente = 'N/A';

        if (turno.especialista) {
          const especialista = usuariosMap.get(turno.especialista);
          nombreEspecialista = especialista
            ? `${especialista.nombre} ${especialista.apellido}`
            : 'Desconocido';
        }

        if (turno.paciente) {
          const paciente = usuariosMap.get(turno.paciente);
          nombrePaciente = paciente
            ? `${paciente.nombre} ${paciente.apellido}`
            : 'Desconocido';
        }

        const fecha = new Date(turno.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-AR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const horaFormateada = fecha.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit'
        });

        return {
          'Fecha': fechaFormateada,
          'Hora': horaFormateada,
          'Especialista': nombreEspecialista,
          'Paciente': nombrePaciente,
          'Especialidad': turno.especialidad || 'N/A',
          'Estado': this.getEstadoTexto(turno.estadoTurno || 'pendiente')
        };
      });

      const workbook = XLSX.utils.book_new();

      const datosUsuario = [{
        'Nombre': usuario.nombre,
        'Apellido': usuario.apellido,
        'Email': usuario.email,
        'DNI': usuario.dni,
        'Edad': usuario.edad,
        'Obra Social': usuario.obraSocial || 'N/A',
        'Tipo Usuario': usuario.tipoUsuario,
        'Fecha Creación': usuario.fechaCreacion ? new Date(usuario.fechaCreacion).toLocaleDateString('es-AR') : 'N/A'
      }];
      const wsUsuario = XLSX.utils.json_to_sheet(datosUsuario);
      XLSX.utils.book_append_sheet(workbook, wsUsuario, 'Información Usuario');

      const wsTurnos = XLSX.utils.json_to_sheet(turnosEnriquecidos);
      XLSX.utils.book_append_sheet(workbook, wsTurnos, 'Turnos');

      wsUsuario['!cols'] = [
        { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 12 },
        { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];
      wsTurnos['!cols'] = [
        { wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 15 }
      ];

      const nombreArchivo = `usuario_${usuario.nombre}_${usuario.apellido}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, nombreArchivo);
    } catch (error) {
      console.error('Error al descargar información del usuario:', error);
    } finally {
      this.descargandoUsuario = null;
    }
  }

  getEstadoTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'aceptado': 'Aceptado',
      'realizado': 'Realizado',
      'cancelado': 'Cancelado',
      'rechazado': 'Rechazado'
    };
    return estados[estado] || estado;
  }
}

@Component({
  selector: 'app-historia-clinica-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatCardModule, MatButtonModule, MatIcon, MatTooltipModule, HistoriaClinicaFormatoPipe],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>medical_services</mat-icon>
      Historia Clínica - {{ data.usuario.nombre }} {{ data.usuario.apellido }}
    </h2>
    <mat-dialog-content>
      <div *ngIf="data.historias.length === 0" class="no-historia">
        <mat-icon>medical_information</mat-icon>
        <p>No hay registros de historia clínica</p>
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
