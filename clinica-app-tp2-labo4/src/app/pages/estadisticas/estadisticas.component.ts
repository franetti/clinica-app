import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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
import * as ExcelJS from 'exceljs';
import { LogService } from '../../services/log.service';
import { TurnosService, TurnoDTO } from '../../services/turnos.service';
import { UsuariosService } from '../../services/usuarios.service';
import { UsuarioDTO } from '../../models/usuario';
import {
  ChartData,
  ChartOptions,
  Chart
} from 'chart.js';


type GenericChartInput = {
  labels: string[];          // Etiquetas comunes
  data: number[];            // Valores
  colors?: string[];         // Colores (pie/bar)
  title?: string;            // Nombre de dataset
  tension?: number;          // Para line chart
  fill?: boolean;            // Para line chart
}
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
export class EstadisticasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('especialidadChart') especialidadChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('turnosSolicitadosChart') turnosSolicitadosChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('turnosFinalizadosChart') turnosFinalizadosChart!: ElementRef<HTMLCanvasElement>;
  chartPieEsp: Chart | null = null;
  chartTurnosSolicitados: Chart | null = null;
  chartTurnosFinalizados: Chart | null = null;
  private viewLoaded = false;


  cargando = false;
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;

  logs: any[] = [];
  turnos: TurnoDTO[] = [];
  usuarios: UsuarioDTO[] = [];
  usuariosMap: Map<string, UsuarioDTO> = new Map();




  constructor(
    private logService: LogService,
    private turnosService: TurnosService,
    private usuariosService: UsuariosService,
    private snackBar: MatSnackBar
  ) {
  }

  async ngOnInit() {
    await this.cargarDatos();
  }

  ngAfterViewInit() {
    this.viewLoaded = true;

    // si los datos ya están cargados, dibujo los charts
    if (this.turnos.length > 0) {
      // Usar setTimeout para asegurar que el DOM esté completamente renderizado
      setTimeout(() => {
        this.obtenerDataPieTurnosEspecialidad();
        this.obtenerDataPieTurnosSolicitados();
        this.obtenerDataPieTurnosFinalizados();
      }, 0);
    }
  }

  ngOnDestroy() {
    // Destruir los charts cuando el componente se destruya
    if (this.chartPieEsp) {
      this.chartPieEsp.destroy();
      this.chartPieEsp = null;
    }
    if (this.chartTurnosSolicitados) {
      this.chartTurnosSolicitados.destroy();
      this.chartTurnosSolicitados = null;
    }
    if (this.chartTurnosFinalizados) {
      this.chartTurnosFinalizados.destroy();
      this.chartTurnosFinalizados = null;
    }
  }

  private obtenerTurnosFiltrados(): TurnoDTO[] {
    let turnosFiltrados = this.turnos;
    if (this.fechaInicio && this.fechaFin) {
      turnosFiltrados = this.turnos.filter(t => {
        const fechaTurno = new Date(t.fecha);
        // Normalizar fechas para comparación (solo fecha, sin hora)
        const fechaInicioNormalizada = new Date(this.fechaInicio!);
        fechaInicioNormalizada.setHours(0, 0, 0, 0);
        const fechaFinNormalizada = new Date(this.fechaFin!);
        fechaFinNormalizada.setHours(23, 59, 59, 999);
        const fechaTurnoNormalizada = new Date(fechaTurno);
        fechaTurnoNormalizada.setHours(0, 0, 0, 0);
        return fechaTurnoNormalizada >= fechaInicioNormalizada && fechaTurnoNormalizada <= fechaFinNormalizada;
      });
    }
    return turnosFiltrados;
  }

  private obtenerLogsFiltrados(): any[] {
    let logsFiltrados = this.logs;
    if (this.fechaInicio && this.fechaFin) {
      logsFiltrados = this.logs.filter(log => {
        const fechaLog = new Date(log.created_at);
        // Normalizar fechas para comparación (solo fecha, sin hora)
        const fechaInicioNormalizada = new Date(this.fechaInicio!);
        fechaInicioNormalizada.setHours(0, 0, 0, 0);
        const fechaFinNormalizada = new Date(this.fechaFin!);
        fechaFinNormalizada.setHours(23, 59, 59, 999);
        const fechaLogNormalizada = new Date(fechaLog);
        fechaLogNormalizada.setHours(0, 0, 0, 0);
        return fechaLogNormalizada >= fechaInicioNormalizada && fechaLogNormalizada <= fechaFinNormalizada;
      });
    }
    return logsFiltrados;
  }

  async cargarDatos() {
    this.cargando = true;
    try {
      this.usuarios = await this.usuariosService.getAll().toPromise() || [];

      this.usuarios.forEach(u => {
        if (u.id) this.usuariosMap.set(u.id, u);
      });

      this.logs = await this.logService.obtenerLogsConUsuarios();
      this.turnos = await this.turnosService.obtenerTurnos();

      // Si la vista está lista → puedo renderizar
      if (this.viewLoaded) {
        // Usar setTimeout para asegurar que el DOM esté completamente renderizado
        setTimeout(() => {
          this.obtenerDataPieTurnosEspecialidad();
          this.obtenerDataPieTurnosSolicitados();
          this.obtenerDataPieTurnosFinalizados();
        }, 0);
      }

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
      // Actualizar los charts con los datos filtrados
      if (this.viewLoaded && this.turnos.length > 0) {
        setTimeout(() => {
          this.obtenerDataPieTurnosEspecialidad();
          this.obtenerDataPieTurnosSolicitados();
          this.obtenerDataPieTurnosFinalizados();
        }, 0);
      }
    } else {
      this.snackBar.open('Seleccione ambas fechas', 'Cerrar', { duration: 3000 });
    }
  }

  limpiarFiltroFechas() {
    this.fechaInicio = null;
    this.fechaFin = null;
    this.snackBar.open('Filtro limpiado', 'Cerrar', { duration: 2000 });
    // Actualizar los charts sin filtros
    if (this.viewLoaded && this.turnos.length > 0) {
      setTimeout(() => {
        this.obtenerDataPieTurnosEspecialidad();
        this.obtenerDataPieTurnosSolicitados();
        this.obtenerDataPieTurnosFinalizados();
      }, 0);
    }
  }

  async descargarExcelLogs() {
    // Obtener logs filtrados por fecha
    const logsFiltrados = this.obtenerLogsFiltrados();

    // Preparar datos para la tabla
    const datos = logsFiltrados.map(log => {
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

    // Contar logins por usuario (usando logs filtrados)
    const loginsPorUsuario = new Map<string, number>();
    logsFiltrados.forEach(log => {
      if (log.usuario) {
        const nombreUsuario = `${log.usuario.nombre} ${log.usuario.apellido}`;
        loginsPorUsuario.set(nombreUsuario, (loginsPorUsuario.get(nombreUsuario) || 0) + 1);
      } else {
        const nombreUsuario = 'Desconocido';
        loginsPorUsuario.set(nombreUsuario, (loginsPorUsuario.get(nombreUsuario) || 0) + 1);
      }
    });

    // Crear workbook con ExcelJS
    const workbook = new ExcelJS.Workbook();

    // Hoja con los datos de logs
    const sheetDatos = workbook.addWorksheet('Logs de Ingresos');
    sheetDatos.columns = [
      { header: 'Usuario', key: 'Usuario', width: 30 },
      { header: 'Email', key: 'Email', width: 30 },
      { header: 'Día', key: 'Día', width: 15 },
      { header: 'Horario', key: 'Horario', width: 15 },
      { header: 'Tipo Log', key: 'Tipo Log', width: 15 }
    ];
    sheetDatos.addRows(datos);

    // Generar y agregar el gráfico de barras
    if (loginsPorUsuario.size > 0) {
      console.log('Generando gráfico para', loginsPorUsuario.size, 'usuarios');
      const imagenBuffer = await this.generarChartLoginsPorUsuario(loginsPorUsuario);
      console.log('Imagen generada:', imagenBuffer ? 'Sí' : 'No');

      if (imagenBuffer) {
        try {
          const sheetGrafico = workbook.addWorksheet('Gráfico Logins');

          // Agregar título
          sheetGrafico.getCell('A1').value = 'Logins por Usuario';
          sheetGrafico.getCell('A1').font = { size: 14, bold: true };
          sheetGrafico.getRow(1).height = 25;

          // Insertar la imagen
          const imageId = workbook.addImage({
            buffer: imagenBuffer as any,
            extension: 'png',
          });

          // Insertar imagen en la celda A3 con dimensiones
          sheetGrafico.addImage(imageId, {
            tl: { col: 0, row: 2 }, // Top-left position (columna 0, fila 2 = celda A3)
            ext: { width: 600, height: 400 } // Tamaño de la imagen
          });

          // Ajustar altura de filas para que la imagen se vea bien
          sheetGrafico.getRow(2).height = 310;
          sheetGrafico.getColumn(1).width = 80;
          console.log('Hoja de gráfico agregada correctamente');
        } catch (error) {
          console.error('Error al agregar hoja de gráfico:', error);
        }
      } else {
        console.warn('No se pudo generar la imagen del gráfico');
        // Agregar hoja de gráfico vacía con mensaje
        const sheetGrafico = workbook.addWorksheet('Gráfico Logins');
        sheetGrafico.getCell('A1').value = 'No se pudo generar el gráfico';
      }
    } else {
      console.warn('No hay datos para generar el gráfico');
    }

    // Descargar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Logs_Ingresos_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Excel descargado correctamente con gráfico', 'Cerrar', { duration: 3000 });
  }

  private async generarChartLoginsPorUsuario(loginsPorUsuario: Map<string, number>): Promise<ArrayBuffer | null> {
    try {
      // Crear un canvas temporal y agregarlo al DOM (oculto) para que Chart.js funcione correctamente
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      canvas.style.position = 'absolute';
      canvas.style.left = '-9999px';
      canvas.style.top = '-9999px';
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.error('No se pudo obtener el contexto del canvas');
        document.body.removeChild(canvas);
        return null;
      }

      // Preparar datos para el chart
      const labels = Array.from(loginsPorUsuario.keys());
      const data = Array.from(loginsPorUsuario.values());

      console.log('Datos del gráfico:', { labels, data });

      // Crear el chart en el canvas temporal
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Cantidad de Logins',
            data: data,
            backgroundColor: this.generarColores(data.length),
            borderColor: '#333',
            borderWidth: 1
          }]
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            duration: 0 // Desactivar animación para renderizado más rápido
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
            title: {
              display: true,
              text: 'Cantidad de Logins por Usuario',
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.dataset.label}: ${context.parsed.y}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              },
              title: {
                display: true,
                text: 'Cantidad de Logins'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Usuarios'
              },
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            }
          }
        }
      });

      // Esperar a que el chart se renderice completamente
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Convertir canvas a ArrayBuffer
      return new Promise((resolve) => {
        canvas.toBlob((blob: Blob | null) => {
          // Limpiar: destruir chart y remover canvas del DOM
          chart.destroy();
          document.body.removeChild(canvas);

          if (!blob) {
            console.error('No se pudo convertir el canvas a blob');
            resolve(null);
            return;
          }

          blob.arrayBuffer().then(buffer => {
            console.log('Imagen convertida correctamente, tamaño:', buffer.byteLength, 'bytes');
            resolve(buffer);
          }).catch(error => {
            console.error('Error al convertir blob a ArrayBuffer:', error);
            resolve(null);
          });
        }, 'image/png');
      });
    } catch (error) {
      console.error('Error al generar chart de logins:', error);
      return null;
    }
  }

  async descargarExcelTurnosEspecialidad() {
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

    // Crear workbook con ExcelJS
    const workbook = new ExcelJS.Workbook();

    // Hoja de Resumen
    const sheetResumen = workbook.addWorksheet('Resumen');
    const datosResumen: any[] = [];
    turnosPorEspecialidad.forEach((turnos, especialidad) => {
      datosResumen.push({
        'Especialidad': especialidad,
        'Cantidad Total': turnos.length,
        'Detalle': `Ver hoja "${especialidad}"`
      });
    });

    // Agregar encabezados y datos al resumen
    sheetResumen.columns = [
      { header: 'Especialidad', key: 'Especialidad', width: 30 },
      { header: 'Cantidad Total', key: 'Cantidad Total', width: 15 },
      { header: 'Detalle', key: 'Detalle', width: 40 }
    ];
    sheetResumen.addRows(datosResumen);

    // Hoja con el gráfico
    if (this.chartPieEsp && this.especialidadChart) {
      const imagenBuffer = await this.obtenerImagenChartBuffer();
      if (imagenBuffer) {
        const sheetGrafico = workbook.addWorksheet('Gráfico');

        // Agregar título
        sheetGrafico.getCell('A1').value = 'Gráfico de Turnos por Especialidad';
        sheetGrafico.getCell('A1').font = { size: 14, bold: true };
        sheetGrafico.getRow(1).height = 25;

        // Insertar la imagen (ExcelJS acepta ArrayBuffer en el navegador)
        const imageId = workbook.addImage({
          buffer: imagenBuffer as any,
          extension: 'png',
        });

        // Insertar imagen en la celda A3 con dimensiones
        sheetGrafico.addImage(imageId, {
          tl: { col: 0, row: 2 }, // Top-left position (columna 0, fila 2 = celda A3)
          ext: { width: 500, height: 300 } // Tamaño de la imagen
        });

        // Ajustar altura de filas para que la imagen se vea bien
        sheetGrafico.getRow(2).height = 230;
        sheetGrafico.getColumn(1).width = 70;
      }
    }

    // Agregar hojas por especialidad
    turnosPorEspecialidad.forEach((turnos, especialidad) => {
      const nombreHoja = especialidad.substring(0, 31); // Excel limita nombres de hojas a 31 caracteres
      const sheet = workbook.addWorksheet(nombreHoja);

      if (turnos.length > 0) {
        // Obtener las claves del primer objeto para crear los encabezados
        const headers = Object.keys(turnos[0]);
        sheet.columns = headers.map(header => ({
          header: header,
          key: header,
          width: header === 'Fecha' || header === 'Hora' ? 15 : header === 'Estado' ? 12 : 25
        }));

        sheet.addRows(turnos);
      }
    });

    // Descargar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Turnos_Por_Especialidad_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Excel descargado correctamente con gráfico', 'Cerrar', { duration: 3000 });
  }

  private async obtenerImagenChartBuffer(): Promise<ArrayBuffer | null> {
    if (!this.chartPieEsp || !this.especialidadChart) {
      return null;
    }

    try {
      const canvas = this.especialidadChart.nativeElement;
      // Convertir canvas a blob y luego a ArrayBuffer
      return new Promise((resolve) => {
        canvas.toBlob((blob: Blob | null) => {
          if (!blob) {
            resolve(null);
            return;
          }
          blob.arrayBuffer().then(buffer => {
            resolve(buffer);
          });
        }, 'image/png');
      });
    } catch (error) {
      console.error('Error al obtener imagen del chart:', error);
      return null;
    }
  }

  obtenerDataPieTurnosEspecialidad() {
    // Verificar que el ViewChild esté disponible
    if (!this.especialidadChart || !this.especialidadChart.nativeElement) {
      console.warn('Canvas no está disponible aún');
      return;
    }

    // Destruir el chart anterior si existe
    if (this.chartPieEsp) {
      this.chartPieEsp.destroy();
      this.chartPieEsp = null;
    }

    const turnosFiltrados = this.obtenerTurnosFiltrados();
    const conteoPorEspecialidad = new Map<string, number>();

    turnosFiltrados.forEach(turno => {
      const especialidad = turno.especialidad || 'Sin especialidad';
      conteoPorEspecialidad.set(especialidad, (conteoPorEspecialidad.get(especialidad) || 0) + 1);
    });

    // Si no hay datos, no crear el chart
    if (conteoPorEspecialidad.size === 0) {
      console.warn('No hay datos para mostrar en el gráfico');
      return;
    }

    const labels = Array.from(conteoPorEspecialidad.keys());
    const data = Array.from(conteoPorEspecialidad.values());

    // Generar colores consistentes para cada especialidad
    const colors = this.generarColores(labels.length);

    const ctx = this.especialidadChart.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('No se pudo obtener el contexto del canvas');
      return;
    }

    try {
      this.chartPieEsp = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            label: 'Turnos por Especialidad',
            data,
            backgroundColor: colors,
            borderColor: '#fff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error al crear el gráfico:', error);
    }
  }

  obtenerDataPieTurnosSolicitados() {
    // Verificar que el ViewChild esté disponible
    if (!this.turnosSolicitadosChart || !this.turnosSolicitadosChart.nativeElement) {
      console.warn('Canvas de turnos solicitados no está disponible aún');
      return;
    }

    // Destruir el chart anterior si existe
    if (this.chartTurnosSolicitados) {
      this.chartTurnosSolicitados.destroy();
      this.chartTurnosSolicitados = null;
    }

    const turnosFiltrados = this.obtenerTurnosFiltrados();
    const turnosPorMedico = new Map<string, number>();

    turnosFiltrados.forEach(turno => {
      if (turno.especialista) {
        const medico = this.usuariosMap.get(turno.especialista);
        const nombreMedico = medico ? `${medico.nombre} ${medico.apellido}` : 'Desconocido';
        turnosPorMedico.set(nombreMedico, (turnosPorMedico.get(nombreMedico) || 0) + 1);
      }
    });

    // Si no hay datos, no crear el chart
    if (turnosPorMedico.size === 0) {
      console.warn('No hay datos de turnos solicitados para mostrar en el gráfico');
      return;
    }

    const labels = Array.from(turnosPorMedico.keys());
    const data = Array.from(turnosPorMedico.values());
    const colors = this.generarColores(labels.length);

    const ctx = this.turnosSolicitadosChart.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('No se pudo obtener el contexto del canvas de turnos solicitados');
      return;
    }

    try {
      this.chartTurnosSolicitados = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            label: 'Turnos Solicitados',
            data,
            backgroundColor: colors,
            borderColor: '#fff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error al crear el gráfico de turnos solicitados:', error);
    }
  }

  obtenerDataPieTurnosFinalizados() {
    // Verificar que el ViewChild esté disponible
    if (!this.turnosFinalizadosChart || !this.turnosFinalizadosChart.nativeElement) {
      console.warn('Canvas de turnos finalizados no está disponible aún');
      return;
    }

    // Destruir el chart anterior si existe
    if (this.chartTurnosFinalizados) {
      this.chartTurnosFinalizados.destroy();
      this.chartTurnosFinalizados = null;
    }

    const turnosFiltrados = this.obtenerTurnosFiltrados()
      .filter(t => t.estadoTurno === 'realizado');
    const turnosPorMedico = new Map<string, number>();

    turnosFiltrados.forEach(turno => {
      if (turno.especialista) {
        const medico = this.usuariosMap.get(turno.especialista);
        const nombreMedico = medico ? `${medico.nombre} ${medico.apellido}` : 'Desconocido';
        turnosPorMedico.set(nombreMedico, (turnosPorMedico.get(nombreMedico) || 0) + 1);
      }
    });

    // Si no hay datos, no crear el chart
    if (turnosPorMedico.size === 0) {
      console.warn('No hay datos de turnos finalizados para mostrar en el gráfico');
      return;
    }

    const labels = Array.from(turnosPorMedico.keys());
    const data = Array.from(turnosPorMedico.values());
    const colors = this.generarColores(labels.length);

    const ctx = this.turnosFinalizadosChart.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('No se pudo obtener el contexto del canvas de turnos finalizados');
      return;
    }

    try {
      this.chartTurnosFinalizados = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            label: 'Turnos Finalizados',
            data,
            backgroundColor: colors,
            borderColor: '#fff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error al crear el gráfico de turnos finalizados:', error);
    }
  }

  private generarColores(cantidad: number): string[] {
    // Paleta de colores predefinida para mejor consistencia visual
    const coloresBase = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
      '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
    ];

    const colores: string[] = [];
    for (let i = 0; i < cantidad; i++) {
      if (i < coloresBase.length) {
        colores.push(coloresBase[i]);
      } else {
        // Generar colores aleatorios si necesitamos más
        colores.push('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
      }
    }
    return colores;
  }

  renderChart(data: GenericChartInput, type: string, idChart: string) {
    const chartData: ChartData = {
      labels: data.labels,
      datasets: [
        {
          label: data.title || '',
          data: data.data,
          backgroundColor: data.colors,
          tension: data.tension,
          fill: data.fill
        }
      ]
    };
    return new Chart(idChart, {
      type: type as any,
      data: chartData
    });
  }

  async descargarExcelTurnosDia() {
    try {
      const turnosFiltrados = this.obtenerTurnosFiltrados();

      if (turnosFiltrados.length === 0) {
        this.snackBar.open('No hay turnos para descargar en el rango de fechas seleccionado', 'Cerrar', { duration: 3000 });
        return;
      }

      const turnosPorDia = new Map<string, any[]>();
      const conteoPorDia = new Map<string, number>();

      turnosFiltrados.forEach(turno => {
        const fecha = new Date(turno.fecha);
        // Usar formato ISO para ordenamiento correcto, pero mostrar formato local
        const diaISO = fecha.toISOString().split('T')[0]; // YYYY-MM-DD para ordenamiento
        const diaMostrar = fecha.toLocaleDateString('es-AR'); // DD/MM/YYYY para mostrar

        if (!turnosPorDia.has(diaISO)) {
          turnosPorDia.set(diaISO, []);
          conteoPorDia.set(diaISO, 0);
        }
        const medico = turno.especialista ? this.usuariosMap.get(turno.especialista) : null;
        const paciente = turno.paciente ? this.usuariosMap.get(turno.paciente) : null;

        turnosPorDia.get(diaISO)!.push({
          'Hora': fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          'Especialidad': turno.especialidad || 'N/A',
          'Médico': medico ? `${medico.nombre} ${medico.apellido}` : 'N/A',
          'Paciente': paciente ? `${paciente.nombre} ${paciente.apellido}` : 'N/A',
          'Estado': turno.estadoTurno || 'N/A'
        });
        conteoPorDia.set(diaISO, (conteoPorDia.get(diaISO) || 0) + 1);
      });

      // Crear workbook con ExcelJS
      const workbook = new ExcelJS.Workbook();

      // Hoja de Resumen
      const datos: any[] = [];
      const diasOrdenados = Array.from(conteoPorDia.keys()).sort((a, b) => {
        // Ordenar por fecha ISO (YYYY-MM-DD)
        return a.localeCompare(b);
      });

      diasOrdenados.forEach(diaISO => {
        const cantidad = conteoPorDia.get(diaISO) || 0;
        // Convertir ISO a formato local para mostrar
        const fechaMostrar = new Date(diaISO + 'T00:00:00').toLocaleDateString('es-AR');
        datos.push({
          'Día': fechaMostrar,
          'Cantidad': cantidad
        });
      });

      const sheetResumen = workbook.addWorksheet('Resumen');
      sheetResumen.columns = [
        { header: 'Día', key: 'Día', width: 15 },
        { header: 'Cantidad', key: 'Cantidad', width: 15 }
      ];
      sheetResumen.addRows(datos);

      // Generar y agregar el gráfico de barras
      if (conteoPorDia.size > 0) {
        // Crear un Map con fechas en formato local para el gráfico
        const conteoPorDiaLocal = new Map<string, number>();
        diasOrdenados.forEach(diaISO => {
          const fechaMostrar = new Date(diaISO + 'T00:00:00').toLocaleDateString('es-AR');
          conteoPorDiaLocal.set(fechaMostrar, conteoPorDia.get(diaISO) || 0);
        });

        const imagenBuffer = await this.generarChartBarTurnosPorDia(conteoPorDiaLocal);
        if (imagenBuffer) {
          const sheetGrafico = workbook.addWorksheet('Gráfico');
          sheetGrafico.getCell('A1').value = 'Turnos por Día';
          sheetGrafico.getCell('A1').font = { size: 14, bold: true };
          sheetGrafico.getRow(1).height = 25;

          const imageId = workbook.addImage({
            buffer: imagenBuffer as any,
            extension: 'png',
          });

          sheetGrafico.addImage(imageId, {
            tl: { col: 0, row: 2 },
            ext: { width: 600, height: 400 }
          });

          sheetGrafico.getRow(2).height = 310;
          sheetGrafico.getColumn(1).width = 80;
        }
      }

      // Agregar hojas por día
      const diasOrdenadosParaHojas = Array.from(turnosPorDia.keys()).sort((a, b) => {
        // Ordenar por fecha ISO
        return a.localeCompare(b);
      });

      diasOrdenadosParaHojas.forEach(diaISO => {
        const turnos = turnosPorDia.get(diaISO)!;
        // Convertir ISO a formato para el nombre de la hoja (sin caracteres especiales)
        // Usar formato DD-MM-YYYY en lugar de DD/MM/YYYY para evitar caracteres prohibidos
        const fecha = new Date(diaISO + 'T00:00:00');
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const año = fecha.getFullYear();
        const nombreHoja = `${dia}-${mes}-${año}`;
        const sheet = workbook.addWorksheet(nombreHoja);
        if (turnos.length > 0) {
          const headers = Object.keys(turnos[0]);
          sheet.columns = headers.map(header => ({
            header: header,
            key: header,
            width: header === 'Hora' ? 12 : header === 'Estado' ? 12 : 25
          }));
          sheet.addRows(turnos);
        }
      });

      // Descargar el archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Turnos_Por_Dia_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.snackBar.open('Excel descargado correctamente con gráfico', 'Cerrar', { duration: 3000 });
    } catch (error) {
      console.error('Error al descargar Excel de turnos por día:', error);
      this.snackBar.open('Error al descargar el Excel', 'Cerrar', { duration: 3000 });
    }
  }

  private async generarChartBarTurnosPorDia(conteoPorDia: Map<string, number>): Promise<ArrayBuffer | null> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      canvas.style.position = 'absolute';
      canvas.style.left = '-9999px';
      canvas.style.top = '-9999px';
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        document.body.removeChild(canvas);
        return null;
      }

      // Ordenar los días cronológicamente
      const diasOrdenados = Array.from(conteoPorDia.keys()).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
      });

      const labels = diasOrdenados;
      const data = diasOrdenados.map(dia => conteoPorDia.get(dia) || 0);

      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Cantidad de Turnos',
            data,
            backgroundColor: '#36A2EB',
            borderColor: '#333',
            borderWidth: 1
          }]
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            duration: 0
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
            title: {
              display: true,
              text: 'Cantidad de Turnos por Día',
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.dataset.label}: ${context.parsed.y}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              },
              title: {
                display: true,
                text: 'Cantidad de Turnos'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Días'
              },
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            }
          }
        }
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      return new Promise((resolve) => {
        canvas.toBlob((blob: Blob | null) => {
          chart.destroy();
          document.body.removeChild(canvas);

          if (!blob) {
            resolve(null);
            return;
          }

          blob.arrayBuffer().then(buffer => {
            resolve(buffer);
          }).catch(error => {
            console.error('Error al convertir blob a ArrayBuffer:', error);
            resolve(null);
          });
        }, 'image/png');
      });
    } catch (error) {
      console.error('Error al generar chart de turnos por día:', error);
      return null;
    }
  }

  async descargarExcelTurnosSolicitados() {
    const turnosFiltrados = this.obtenerTurnosFiltrados();
    const turnosPorMedico = new Map<string, any[]>();
    const conteoPorMedico = new Map<string, number>();

    turnosFiltrados.forEach(turno => {
      if (turno.especialista) {
        const medico = this.usuariosMap.get(turno.especialista);
        const nombreMedico = medico ? `${medico.nombre} ${medico.apellido}` : 'Desconocido';

        if (!turnosPorMedico.has(nombreMedico)) {
          turnosPorMedico.set(nombreMedico, []);
          conteoPorMedico.set(nombreMedico, 0);
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
        conteoPorMedico.set(nombreMedico, (conteoPorMedico.get(nombreMedico) || 0) + 1);
      }
    });

    // Crear workbook con ExcelJS
    const workbook = new ExcelJS.Workbook();

    // Hoja de Resumen
    const datos: any[] = [];
    conteoPorMedico.forEach((cantidad, medico) => {
      datos.push({
        'Médico': medico,
        'Cantidad de Turnos Solicitados': cantidad
      });
    });

    const sheetResumen = workbook.addWorksheet('Resumen');
    sheetResumen.columns = [
      { header: 'Médico', key: 'Médico', width: 30 },
      { header: 'Cantidad de Turnos Solicitados', key: 'Cantidad de Turnos Solicitados', width: 25 }
    ];
    sheetResumen.addRows(datos);

    // Generar y agregar el gráfico
    if (conteoPorMedico.size > 0) {
      const imagenBuffer = await this.generarChartPiePorMedico(conteoPorMedico, 'Turnos Solicitados');
      if (imagenBuffer) {
        const sheetGrafico = workbook.addWorksheet('Gráfico');
        sheetGrafico.getCell('A1').value = 'Turnos Solicitados por Médico';
        sheetGrafico.getCell('A1').font = { size: 14, bold: true };
        sheetGrafico.getRow(1).height = 25;

        const imageId = workbook.addImage({
          buffer: imagenBuffer as any,
          extension: 'png',
        });

        sheetGrafico.addImage(imageId, {
          tl: { col: 0, row: 2 },
          ext: { width: 500, height: 300 }
        });

        sheetGrafico.getRow(2).height = 230;
        sheetGrafico.getColumn(1).width = 70;
      }
    }

    // Agregar hojas por médico
    turnosPorMedico.forEach((turnos, medico) => {
      const nombreHoja = medico.substring(0, 31);
      const sheet = workbook.addWorksheet(nombreHoja);
      if (turnos.length > 0) {
        const headers = Object.keys(turnos[0]);
        sheet.columns = headers.map(header => ({
          header: header,
          key: header,
          width: header === 'Fecha' || header === 'Hora' ? 15 : header === 'Estado' ? 12 : 25
        }));
        sheet.addRows(turnos);
      }
    });

    // Descargar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Turnos_Solicitados_Por_Medico_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Excel descargado correctamente con gráfico', 'Cerrar', { duration: 3000 });
  }

  async descargarExcelTurnosFinalizados() {
    const turnosFiltrados = this.obtenerTurnosFiltrados()
      .filter(t => t.estadoTurno === 'realizado');

    const turnosPorMedico = new Map<string, any[]>();
    const conteoPorMedico = new Map<string, number>();

    turnosFiltrados.forEach(turno => {
      if (turno.especialista) {
        const medico = this.usuariosMap.get(turno.especialista);
        const nombreMedico = medico ? `${medico.nombre} ${medico.apellido}` : 'Desconocido';

        if (!turnosPorMedico.has(nombreMedico)) {
          turnosPorMedico.set(nombreMedico, []);
          conteoPorMedico.set(nombreMedico, 0);
        }

        const fecha = new Date(turno.fecha);
        const paciente = turno.paciente ? this.usuariosMap.get(turno.paciente) : null;

        turnosPorMedico.get(nombreMedico)!.push({
          'Fecha': fecha.toLocaleDateString('es-AR'),
          'Hora': fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          'Especialidad': turno.especialidad || 'N/A',
          'Paciente': paciente ? `${paciente.nombre} ${paciente.apellido}` : 'N/A'
        });
        conteoPorMedico.set(nombreMedico, (conteoPorMedico.get(nombreMedico) || 0) + 1);
      }
    });

    // Crear workbook con ExcelJS
    const workbook = new ExcelJS.Workbook();

    // Hoja de Resumen
    const datos: any[] = [];
    conteoPorMedico.forEach((cantidad, medico) => {
      datos.push({
        'Médico': medico,
        'Cantidad de Turnos Finalizados': cantidad
      });
    });

    const sheetResumen = workbook.addWorksheet('Resumen');
    sheetResumen.columns = [
      { header: 'Médico', key: 'Médico', width: 30 },
      { header: 'Cantidad de Turnos Finalizados', key: 'Cantidad de Turnos Finalizados', width: 25 }
    ];
    sheetResumen.addRows(datos);

    // Generar y agregar el gráfico
    if (conteoPorMedico.size > 0) {
      const imagenBuffer = await this.generarChartPiePorMedico(conteoPorMedico, 'Turnos Finalizados');
      if (imagenBuffer) {
        const sheetGrafico = workbook.addWorksheet('Gráfico');
        sheetGrafico.getCell('A1').value = 'Turnos Finalizados por Médico';
        sheetGrafico.getCell('A1').font = { size: 14, bold: true };
        sheetGrafico.getRow(1).height = 25;

        const imageId = workbook.addImage({
          buffer: imagenBuffer as any,
          extension: 'png',
        });

        sheetGrafico.addImage(imageId, {
          tl: { col: 0, row: 2 },
          ext: { width: 500, height: 300 }
        });

        sheetGrafico.getRow(2).height = 230;
        sheetGrafico.getColumn(1).width = 70;
      }
    }

    // Agregar hojas por médico
    turnosPorMedico.forEach((turnos, medico) => {
      const nombreHoja = medico.substring(0, 31);
      const sheet = workbook.addWorksheet(nombreHoja);
      if (turnos.length > 0) {
        const headers = Object.keys(turnos[0]);
        sheet.columns = headers.map(header => ({
          header: header,
          key: header,
          width: header === 'Fecha' || header === 'Hora' ? 15 : 25
        }));
        sheet.addRows(turnos);
      }
    });

    // Descargar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Turnos_Finalizados_Por_Medico_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Excel descargado correctamente con gráfico', 'Cerrar', { duration: 3000 });
  }

  private async generarChartPiePorMedico(conteoPorMedico: Map<string, number>, titulo: string): Promise<ArrayBuffer | null> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      canvas.style.position = 'absolute';
      canvas.style.left = '-9999px';
      canvas.style.top = '-9999px';
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        document.body.removeChild(canvas);
        return null;
      }

      const labels = Array.from(conteoPorMedico.keys());
      const data = Array.from(conteoPorMedico.values());

      const chart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            label: titulo,
            data,
            backgroundColor: this.generarColores(data.length),
            borderColor: '#fff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            duration: 0
          },
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
            },
            title: {
              display: true,
              text: titulo + ' por Médico',
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      return new Promise((resolve) => {
        canvas.toBlob((blob: Blob | null) => {
          chart.destroy();
          document.body.removeChild(canvas);

          if (!blob) {
            resolve(null);
            return;
          }

          blob.arrayBuffer().then(buffer => {
            resolve(buffer);
          }).catch(error => {
            console.error('Error al convertir blob a ArrayBuffer:', error);
            resolve(null);
          });
        }, 'image/png');
      });
    } catch (error) {
      console.error('Error al generar chart de pie por médico:', error);
      return null;
    }
  }

  private descargarExcel(datos: any[], nombreArchivo: string) {
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    XLSX.writeFile(wb, `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.xlsx`);
    this.snackBar.open('Excel descargado correctamente', 'Cerrar', { duration: 3000 });
  }
}
