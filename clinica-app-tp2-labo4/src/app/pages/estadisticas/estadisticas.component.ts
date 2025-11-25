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
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
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
    BaseChartDirective
  ],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.scss'
})
export class EstadisticasComponent implements OnInit {
  cargando = false;
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;

  // Datos
  logs: any[] = [];
  turnos: TurnoDTO[] = [];
  usuarios: UsuarioDTO[] = [];
  usuariosMap: Map<string, UsuarioDTO> = new Map();

  // Gráfico 1: Log de ingresos
  public logIngresosChartType: ChartType = 'bar';
  public logIngresosChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Ingresos',
      data: [],
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };
  public logIngresosChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: 'Log de Ingresos al Sistema' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  // Gráfico 2: Turnos por especialidad
  public turnosEspecialidadChartType: ChartType = 'pie';
  public turnosEspecialidadChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)'
      ]
    }]
  };
  public turnosEspecialidadChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'right' },
      title: { display: true, text: 'Cantidad de Turnos por Especialidad' }
    }
  };

  // Gráfico 3: Turnos por día
  public turnosDiaChartType: ChartType = 'line';
  public turnosDiaChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Turnos',
      data: [],
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1
    }]
  };
  public turnosDiaChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: 'Cantidad de Turnos por Día' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  // Gráfico 4: Turnos solicitados por médico
  public turnosSolicitadosChartType: ChartType = 'bar';
  public turnosSolicitadosChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Turnos Solicitados',
      data: [],
      backgroundColor: 'rgba(255, 99, 132, 0.6)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1
    }]
  };
  public turnosSolicitadosChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: 'Turnos Solicitados por Médico' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  // Gráfico 5: Turnos finalizados por médico
  public turnosFinalizadosChartType: ChartType = 'bar';
  public turnosFinalizadosChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Turnos Finalizados',
      data: [],
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };
  public turnosFinalizadosChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: 'Turnos Finalizados por Médico' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

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
      // Cargar usuarios
      this.usuarios = await this.usuariosService.getAll().toPromise() || [];
      this.usuarios.forEach(u => {
        if (u.id) {
          this.usuariosMap.set(u.id, u);
        }
      });

      // Cargar logs
      this.logs = await this.logService.obtenerLogsConUsuarios();
      this.actualizarGraficoLogs();

      // Cargar turnos
      this.turnos = await this.turnosService.obtenerTurnos();
      this.actualizarGraficosTurnos();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.snackBar.open('Error al cargar los datos', 'Cerrar', { duration: 3000 });
    } finally {
      this.cargando = false;
    }
  }

  actualizarGraficoLogs() {
    // Agrupar logs por día
    const logsPorDia = new Map<string, number>();
    this.logs.forEach(log => {
      if (log.created_at) {
        const fecha = new Date(log.created_at);
        const dia = fecha.toLocaleDateString('es-AR');
        logsPorDia.set(dia, (logsPorDia.get(dia) || 0) + 1);
      }
    });

    const dias = Array.from(logsPorDia.keys()).sort();
    const cantidades = dias.map(dia => logsPorDia.get(dia) || 0);

    this.logIngresosChartData = {
      labels: dias,
      datasets: [{
        label: 'Ingresos',
        data: cantidades,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };
  }

  actualizarGraficosTurnos() {
    // Filtrar turnos por rango de fechas si está definido
    let turnosFiltrados = this.turnos;
    if (this.fechaInicio && this.fechaFin) {
      turnosFiltrados = this.turnos.filter(t => {
        const fechaTurno = new Date(t.fecha);
        return fechaTurno >= this.fechaInicio! && fechaTurno <= this.fechaFin!;
      });
    }

    // Gráfico 2: Turnos por especialidad
    const turnosPorEspecialidad = new Map<string, number>();
    turnosFiltrados.forEach(turno => {
      const especialidad = turno.especialidad || 'Sin especialidad';
      turnosPorEspecialidad.set(especialidad, (turnosPorEspecialidad.get(especialidad) || 0) + 1);
    });

    this.turnosEspecialidadChartData = {
      labels: Array.from(turnosPorEspecialidad.keys()),
      datasets: [{
        data: Array.from(turnosPorEspecialidad.values()),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ]
      }]
    };

    // Gráfico 3: Turnos por día
    const turnosPorDia = new Map<string, number>();
    turnosFiltrados.forEach(turno => {
      const fecha = new Date(turno.fecha);
      const dia = fecha.toLocaleDateString('es-AR');
      turnosPorDia.set(dia, (turnosPorDia.get(dia) || 0) + 1);
    });

    const dias = Array.from(turnosPorDia.keys()).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
    const cantidadesPorDia = dias.map(dia => turnosPorDia.get(dia) || 0);

    this.turnosDiaChartData = {
      labels: dias,
      datasets: [{
        label: 'Turnos',
        data: cantidadesPorDia,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }]
    };

    // Gráfico 4: Turnos solicitados por médico
    const turnosSolicitadosPorMedico = new Map<string, number>();
    turnosFiltrados.forEach(turno => {
      if (turno.especialista) {
        const medico = this.usuariosMap.get(turno.especialista);
        const nombreMedico = medico ? `${medico.nombre} ${medico.apellido}` : 'Desconocido';
        turnosSolicitadosPorMedico.set(nombreMedico, (turnosSolicitadosPorMedico.get(nombreMedico) || 0) + 1);
      }
    });

    this.turnosSolicitadosChartData = {
      labels: Array.from(turnosSolicitadosPorMedico.keys()),
      datasets: [{
        label: 'Turnos Solicitados',
        data: Array.from(turnosSolicitadosPorMedico.values()),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    };

    // Gráfico 5: Turnos finalizados por médico
    const turnosFinalizadosPorMedico = new Map<string, number>();
    turnosFiltrados
      .filter(t => t.estadoTurno === 'realizado')
      .forEach(turno => {
        if (turno.especialista) {
          const medico = this.usuariosMap.get(turno.especialista);
          const nombreMedico = medico ? `${medico.nombre} ${medico.apellido}` : 'Desconocido';
          turnosFinalizadosPorMedico.set(nombreMedico, (turnosFinalizadosPorMedico.get(nombreMedico) || 0) + 1);
        }
      });

    this.turnosFinalizadosChartData = {
      labels: Array.from(turnosFinalizadosPorMedico.keys()),
      datasets: [{
        label: 'Turnos Finalizados',
        data: Array.from(turnosFinalizadosPorMedico.values()),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    };
  }

  aplicarFiltroFechas() {
    if (this.fechaInicio && this.fechaFin) {
      this.actualizarGraficosTurnos();
    } else {
      this.snackBar.open('Seleccione ambas fechas', 'Cerrar', { duration: 3000 });
    }
  }

  limpiarFiltroFechas() {
    this.fechaInicio = null;
    this.fechaFin = null;
    this.actualizarGraficosTurnos();
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
    const datos: any[] = [];
    this.turnosEspecialidadChartData.labels?.forEach((label, index) => {
      datos.push({
        'Especialidad': label,
        'Cantidad': this.turnosEspecialidadChartData.datasets[0].data[index]
      });
    });

    this.descargarExcel(datos, 'Turnos_Por_Especialidad');
  }

  descargarExcelTurnosDia() {
    const datos: any[] = [];
    this.turnosDiaChartData.labels?.forEach((label, index) => {
      datos.push({
        'Día': label,
        'Cantidad': this.turnosDiaChartData.datasets[0].data[index]
      });
    });

    this.descargarExcel(datos, 'Turnos_Por_Dia');
  }

  descargarExcelTurnosSolicitados() {
    const datos: any[] = [];
    this.turnosSolicitadosChartData.labels?.forEach((label, index) => {
      datos.push({
        'Médico': label,
        'Cantidad de Turnos Solicitados': this.turnosSolicitadosChartData.datasets[0].data[index]
      });
    });

    this.descargarExcel(datos, 'Turnos_Solicitados_Por_Medico');
  }

  descargarExcelTurnosFinalizados() {
    const datos: any[] = [];
    this.turnosFinalizadosChartData.labels?.forEach((label, index) => {
      datos.push({
        'Médico': label,
        'Cantidad de Turnos Finalizados': this.turnosFinalizadosChartData.datasets[0].data[index]
      });
    });

    this.descargarExcel(datos, 'Turnos_Finalizados_Por_Medico');
  }

  private descargarExcel(datos: any[], nombreArchivo: string) {
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    XLSX.writeFile(wb, `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.xlsx`);
    this.snackBar.open('Excel descargado correctamente', 'Cerrar', { duration: 3000 });
  }
}
