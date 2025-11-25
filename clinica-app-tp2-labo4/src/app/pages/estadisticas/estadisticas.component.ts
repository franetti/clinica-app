import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as XLSX from 'xlsx';
import { LogService } from '../../services/log.service';
import { TurnosService, TurnoDTO } from '../../services/turnos.service';
import { UsuariosService } from '../../services/usuarios.service';
import { UsuarioDTO } from '../../models/usuario';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.scss'
})
export class EstadisticasComponent implements OnInit {
  cargando = false;
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;

  logs: any[] = [];
  turnos: TurnoDTO[] = [];
  usuarios: UsuarioDTO[] = [];
  usuariosMap: Map<string, UsuarioDTO> = new Map();

  private obtenerTurnosFiltrados(): TurnoDTO[] {
    let turnosFiltrados = this.turnos;
    if (this.fechaInicio && this.fechaFin) {
      turnosFiltrados = this.turnos.filter(t => {
        const fechaTurno = new Date(t.fecha);
        return fechaTurno >= this.fechaInicio! && fechaTurno <= this.fechaFin!;
      });
    }
    return turnosFiltrados;
  }

  constructor(
    private logService: LogService,
    private turnosService: TurnosService,
    private usuariosService: UsuariosService,
    private snackBar: MatSnackBar
  ) { }

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando = true;
    try {
      this.usuarios = await this.usuariosService.getAll().toPromise() || [];
      this.usuarios.forEach(u => {
        if (u.id) {
          this.usuariosMap.set(u.id, u);
        }
      });

      this.logs = await this.logService.obtenerLogsConUsuarios();

      this.turnos = await this.turnosService.obtenerTurnos();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.snackBar.open('Error al cargar los datos', 'Cerrar', { duration: 3000 });
    } finally {
      this.cargando = false;
    }
  }

  aplicarFiltroFechas() {
    if (this.fechaInicio && this.fechaFin) {
      this.snackBar.open('Filtro aplicado. Los reportes usarán este rango de fechas.', 'Cerrar', { duration: 3000 });
    } else {
      this.snackBar.open('Seleccione ambas fechas', 'Cerrar', { duration: 3000 });
    }
  }

  limpiarFiltroFechas() {
    this.fechaInicio = null;
    this.fechaFin = null;
    this.snackBar.open('Filtro limpiado', 'Cerrar', { duration: 2000 });
  }

  descargarExcelLogs() {
    const datos = this.logs.map(log => {
      const fecha = new Date(log.created_at);
      const usuario = log.usuario;
      return {
        'Usuario': usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Desconocido',
        'Email': usuario?.email || 'N/A',
        'Día': fecha.toLocaleDateString('es-AR'),
        'Horario': fecha.toLocaleTimeString('es-AR'),
        'Tipo Log': log.tipoLog
      };
    });

    this.descargarExcel(datos, 'Logs_Ingresos');
  }

  descargarExcelTurnosEspecialidad() {
    const turnosFiltrados = this.obtenerTurnosFiltrados();
    const turnosPorEspecialidad = new Map<string, any[]>();

    turnosFiltrados.forEach(turno => {
      const especialidad = turno.especialidad || 'Sin especialidad';
      if (!turnosPorEspecialidad.has(especialidad)) {
        turnosPorEspecialidad.set(especialidad, []);
      }
      const fecha = new Date(turno.fecha);
      const medico = turno.especialista ? this.usuariosMap.get(turno.especialista) : null;
      const paciente = turno.paciente ? this.usuariosMap.get(turno.paciente) : null;

      turnosPorEspecialidad.get(especialidad)!.push({
        'Fecha': fecha.toLocaleDateString('es-AR'),
        'Hora': fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        'Médico': medico ? `${medico.nombre} ${medico.apellido}` : 'N/A',
        'Paciente': paciente ? `${paciente.nombre} ${paciente.apellido}` : 'N/A',
        'Estado': turno.estadoTurno || 'N/A'
      });
    });

    const datos: any[] = [];
    turnosPorEspecialidad.forEach((turnos, especialidad) => {
      datos.push({
        'Especialidad': especialidad,
        'Cantidad Total': turnos.length,
        'Detalle': `Ver hoja "${especialidad}"`
      });
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datos), 'Resumen');

    turnosPorEspecialidad.forEach((turnos, especialidad) => {
      const nombreHoja = especialidad.substring(0, 31); // Excel limita nombres de hojas a 31 caracteres
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(turnos), nombreHoja);
    });

    XLSX.writeFile(wb, `Turnos_Por_Especialidad_${new Date().toISOString().split('T')[0]}.xlsx`);
    this.snackBar.open('Excel descargado correctamente', 'Cerrar', { duration: 3000 });
  }

  descargarExcelTurnosDia() {
    const turnosFiltrados = this.obtenerTurnosFiltrados();
    const turnosPorDia = new Map<string, any[]>();

    turnosFiltrados.forEach(turno => {
      const fecha = new Date(turno.fecha);
      const dia = fecha.toLocaleDateString('es-AR');
      if (!turnosPorDia.has(dia)) {
        turnosPorDia.set(dia, []);
      }
      const medico = turno.especialista ? this.usuariosMap.get(turno.especialista) : null;
      const paciente = turno.paciente ? this.usuariosMap.get(turno.paciente) : null;

      turnosPorDia.get(dia)!.push({
        'Hora': fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        'Especialidad': turno.especialidad || 'N/A',
        'Médico': medico ? `${medico.nombre} ${medico.apellido}` : 'N/A',
        'Paciente': paciente ? `${paciente.nombre} ${paciente.apellido}` : 'N/A',
        'Estado': turno.estadoTurno || 'N/A'
      });
    });

    const datos: any[] = [];
    const diasOrdenados = Array.from(turnosPorDia.keys()).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    diasOrdenados.forEach(dia => {
      const turnos = turnosPorDia.get(dia)!;
      datos.push({
        'Día': dia,
        'Cantidad': turnos.length
      });
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datos), 'Resumen');

    turnosPorDia.forEach((turnos, dia) => {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(turnos), dia);
    });

    XLSX.writeFile(wb, `Turnos_Por_Dia_${new Date().toISOString().split('T')[0]}.xlsx`);
    this.snackBar.open('Excel descargado correctamente', 'Cerrar', { duration: 3000 });
  }

  descargarExcelTurnosSolicitados() {
    const turnosFiltrados = this.obtenerTurnosFiltrados();
    const turnosPorMedico = new Map<string, any[]>();

    turnosFiltrados.forEach(turno => {
      if (turno.especialista) {
        const medico = this.usuariosMap.get(turno.especialista);
        const nombreMedico = medico ? `${medico.nombre} ${medico.apellido}` : 'Desconocido';

        if (!turnosPorMedico.has(nombreMedico)) {
          turnosPorMedico.set(nombreMedico, []);
        }

        const fecha = new Date(turno.fecha);
        const paciente = turno.paciente ? this.usuariosMap.get(turno.paciente) : null;

        turnosPorMedico.get(nombreMedico)!.push({
          'Fecha': fecha.toLocaleDateString('es-AR'),
          'Hora': fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          'Especialidad': turno.especialidad || 'N/A',
          'Paciente': paciente ? `${paciente.nombre} ${paciente.apellido}` : 'N/A',
          'Estado': turno.estadoTurno || 'N/A'
        });
      }
    });

    const datos: any[] = [];
    turnosPorMedico.forEach((turnos, medico) => {
      datos.push({
        'Médico': medico,
        'Cantidad de Turnos Solicitados': turnos.length
      });
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datos), 'Resumen');

    turnosPorMedico.forEach((turnos, medico) => {
      const nombreHoja = medico.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(turnos), nombreHoja);
    });

    XLSX.writeFile(wb, `Turnos_Solicitados_Por_Medico_${new Date().toISOString().split('T')[0]}.xlsx`);
    this.snackBar.open('Excel descargado correctamente', 'Cerrar', { duration: 3000 });
  }

  descargarExcelTurnosFinalizados() {
    const turnosFiltrados = this.obtenerTurnosFiltrados()
      .filter(t => t.estadoTurno === 'realizado');

    const turnosPorMedico = new Map<string, any[]>();

    turnosFiltrados.forEach(turno => {
      if (turno.especialista) {
        const medico = this.usuariosMap.get(turno.especialista);
        const nombreMedico = medico ? `${medico.nombre} ${medico.apellido}` : 'Desconocido';

        if (!turnosPorMedico.has(nombreMedico)) {
          turnosPorMedico.set(nombreMedico, []);
        }

        const fecha = new Date(turno.fecha);
        const paciente = turno.paciente ? this.usuariosMap.get(turno.paciente) : null;

        turnosPorMedico.get(nombreMedico)!.push({
          'Fecha': fecha.toLocaleDateString('es-AR'),
          'Hora': fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          'Especialidad': turno.especialidad || 'N/A',
          'Paciente': paciente ? `${paciente.nombre} ${paciente.apellido}` : 'N/A'
        });
      }
    });

    const datos: any[] = [];
    turnosPorMedico.forEach((turnos, medico) => {
      datos.push({
        'Médico': medico,
        'Cantidad de Turnos Finalizados': turnos.length
      });
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datos), 'Resumen');

    turnosPorMedico.forEach((turnos, medico) => {
      const nombreHoja = medico.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(turnos), nombreHoja);
    });

    XLSX.writeFile(wb, `Turnos_Finalizados_Por_Medico_${new Date().toISOString().split('T')[0]}.xlsx`);
    this.snackBar.open('Excel descargado correctamente', 'Cerrar', { duration: 3000 });
  }

  private descargarExcel(datos: any[], nombreArchivo: string) {
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    XLSX.writeFile(wb, `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.xlsx`);
    this.snackBar.open('Excel descargado correctamente', 'Cerrar', { duration: 3000 });
  }
}
