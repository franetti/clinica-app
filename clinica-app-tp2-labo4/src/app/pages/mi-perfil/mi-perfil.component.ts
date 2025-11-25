import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TurnosService, TurnoDTO } from '../../services/turnos.service';
import { HorariosService, HorarioDTO } from '../../services/horarios.service';
import { UsuarioDTO } from '../../models/usuario';
import { HistoriaClinicaService, HistoriaClinicaDTO, DatoDinamico } from '../../services/historia-clinica.service';
import { UsuariosService } from '../../services/usuarios.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HistoriaClinicaFormatoPipe } from '../../pipes/historia-clinica-formato.pipe';
import { DniFormatoPipe } from '../../pipes/dni-formato.pipe';
import { EstadoTurnoPipe } from '../../pipes/estado-turno.pipe';
import { HoverZoomDirective } from '../../directives/hover-zoom.directive';
import { HighlightDirective } from '../../directives/highlight.directive';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    HistoriaClinicaFormatoPipe,
    DniFormatoPipe,
    HoverZoomDirective,
    HighlightDirective
  ],
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.scss']
})
export class MiPerfilComponent implements OnInit {
  usuario: UsuarioDTO | null = null;
  especialidades: string[] = [];

  especialidadSeleccionada: string = '';
  diasSeleccionados: number[] = [];
  horaInicio: number = 9;
  horaFin: number = 18;
  horariosExistentes: HorarioDTO[] = [];
  cargando = false;

  diasSemana = [
    { numero: 1, nombre: 'Lunes', corto: 'L' },
    { numero: 2, nombre: 'Martes', corto: 'M' },
    { numero: 3, nombre: 'Miércoles', corto: 'X' },
    { numero: 4, nombre: 'Jueves', corto: 'J' },
    { numero: 5, nombre: 'Viernes', corto: 'V' }
  ];

  horasDisponibles = [
    { valor: 8, texto: '8:00 AM' },
    { valor: 9, texto: '9:00 AM' },
    { valor: 10, texto: '10:00 AM' },
    { valor: 11, texto: '11:00 AM' },
    { valor: 12, texto: '12:00 PM' },
    { valor: 13, texto: '1:00 PM' },
    { valor: 14, texto: '2:00 PM' },
    { valor: 15, texto: '3:00 PM' },
    { valor: 16, texto: '4:00 PM' },
    { valor: 17, texto: '5:00 PM' },
    { valor: 18, texto: '6:00 PM' },
    { valor: 19, texto: '7:00 PM' },
    { valor: 20, texto: '8:00 PM' }
  ];

  historiaClinica: HistoriaClinicaDTO[] = [];
  historiaClinicaCompleta: HistoriaClinicaDTO[] = [];
  historiaClinicaFiltrada: HistoriaClinicaDTO[] = [];
  mostrarHistoriaClinica = false;
  especialidadesDisponibles: string[] = [];
  especialidadSeleccionadaPDF: string = 'todas';
  turnosPaciente: TurnoDTO[] = [];
  especialistasMap: Map<string, UsuarioDTO> = new Map();
  descargandoPDF = false;
  descargandoPDFTurnos = false;

  constructor(
    private authService: AuthService,
    private horariosService: HorariosService,
    private historiaClinicaService: HistoriaClinicaService,
    private turnosService: TurnosService,
    private usuariosService: UsuariosService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.authService.getUser().subscribe(async user => {
      this.usuario = user;
      if (user?.especialidad) {
        this.especialidades = user.especialidad.split(',').map(e => e.trim());
        if (this.especialidades.length > 0) {
          this.especialidadSeleccionada = this.especialidades[0];
        }
      }
      if (user?.tipoUsuario === 'especialista') {
        this.cargarHorariosEspecialista();
      } else if (user?.tipoUsuario === 'paciente' && user?.id) {
        await this.cargarHistoriaClinica(user.id);
        await this.cargarTurnosPaciente(user.id);
        await this.cargarEspecialistas();
      }
    });
  }

  async cargarEspecialistas(): Promise<void> {
    try {
      const especialistas = await this.usuariosService.getEspecialistas().toPromise() || [];
      especialistas.forEach(esp => {
        if (esp.id) {
          this.especialistasMap.set(esp.id, esp);
        }
      });
    } catch (error) {
      console.error('Error al cargar especialistas:', error);
    }
  }

  async cargarTurnosPaciente(idPaciente: string): Promise<void> {
    try {
      this.turnosPaciente = await this.turnosService.obtenerTurnosPaciente(idPaciente);

      const especialidadesSet = new Set<string>();
      this.turnosPaciente.forEach(turno => {
        if (turno.especialidad) {
          especialidadesSet.add(turno.especialidad);
        }
      });
      this.especialidadesDisponibles = Array.from(especialidadesSet).sort();

      // Relacionar historia clínica con turnos para obtener especialidades
      this.relacionarHistoriaConTurnos();
    } catch (error) {
      console.error('Error al cargar turnos del paciente:', error);
    }
  }

  relacionarHistoriaConTurnos(): void {
    this.historiaClinicaCompleta = this.historiaClinica.map(historia => {
      const turnosRelacionados = this.turnosPaciente.filter(turno =>
        turno.especialista === historia.idEspecialista &&
        turno.paciente === historia.idPaciente &&
        turno.estadoTurno === 'realizado'
      );

      // Si hay turnos relacionados, buscar el más cercano en fecha a la historia clínica
      let turnoAsociado: TurnoDTO | undefined;
      if (turnosRelacionados.length > 0) {
        const fechaHistoria = historia.created_at ? new Date(historia.created_at).getTime() : 0;
        turnoAsociado = turnosRelacionados.reduce((closest, turno) => {
          const fechaTurno = new Date(turno.fecha).getTime();
          const fechaClosest = closest ? new Date(closest.fecha).getTime() : 0;
          const diffClosest = Math.abs(fechaClosest - fechaHistoria);
          const diffTurno = Math.abs(fechaTurno - fechaHistoria);
          return diffTurno < diffClosest ? turno : closest;
        });
      }

      return {
        ...historia,
        especialidad: turnoAsociado?.especialidad || 'Desconocida'
      } as HistoriaClinicaDTO & { especialidad?: string };
    });

    this.aplicarFiltroEspecialidad();
  }

  aplicarFiltroEspecialidad(): void {
    if (this.especialidadSeleccionadaPDF === 'todas') {
      this.historiaClinicaFiltrada = [...this.historiaClinicaCompleta];
    } else {
      this.historiaClinicaFiltrada = this.historiaClinicaCompleta.filter(
        (historia: any) => historia.especialidad === this.especialidadSeleccionadaPDF
      );
    }
  }

  onEspecialidadPDFChange(): void {
    this.aplicarFiltroEspecialidad();
  }

  turnosFiltradosPorEspecialidad(): TurnoDTO[] {
    if (this.especialidadSeleccionadaPDF === 'todas') {
      return [];
    }
    return this.turnosPaciente.filter(turno =>
      turno.especialidad === this.especialidadSeleccionadaPDF
    );
  }

  async descargarPDFTurnos(): Promise<void> {
    if (!this.usuario?.id || this.especialidadSeleccionadaPDF === 'todas') {
      this.snackBar.open('Seleccione una especialidad para descargar los turnos', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    const turnosFiltrados = this.turnosFiltradosPorEspecialidad();
    if (turnosFiltrados.length === 0) {
      this.snackBar.open('No hay turnos para la especialidad seleccionada', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.descargandoPDFTurnos = true;
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      const margin = 20;
      const lineHeight = 7;
      const maxWidth = pageWidth - (margin * 2);

      // Cargar y agregar logo
      try {
        const logoImg = await this.loadImageAsBase64('/assets/clinica-pdf.png');
        if (logoImg) {
          const logoWidth = 150;
          const logoHeight = 28;
          const logoX = (pageWidth - logoWidth) / 2; // Centrar horizontalmente
          pdf.addImage(logoImg, 'PNG', logoX, yPosition, logoWidth, logoHeight);
          yPosition += logoHeight + 10;
        }
      } catch (error) {
        console.error('Error al cargar logo:', error);
      }

      // Título
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Historial de Turnos', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Información del paciente
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Paciente: ${this.usuario.nombre} ${this.usuario.apellido}`, margin, yPosition);
      yPosition += lineHeight;
      pdf.text(`DNI: ${this.usuario.dni}`, margin, yPosition);
      yPosition += lineHeight;
      pdf.text(`Especialidad: ${this.especialidadSeleccionadaPDF}`, margin, yPosition);
      yPosition += lineHeight;

      // Fecha de emisión
      const fechaEmision = new Date().toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(`Fecha de emisión: ${fechaEmision}`, margin, yPosition);
      yPosition += 15;

      // Línea separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Tabla de turnos
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Turnos', margin, yPosition);
      yPosition += 10;

      // Encabezados de tabla
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const colWidths = [30, 50, 60, 40]; // Fecha, Hora, Especialista, Estado
      const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

      pdf.text('Fecha', colPositions[0], yPosition);
      pdf.text('Hora', colPositions[1], yPosition);
      pdf.text('Especialista', colPositions[2], yPosition);
      pdf.text('Estado', colPositions[3], yPosition);
      yPosition += lineHeight + 2;

      // Línea debajo de encabezados
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
      yPosition += 5;

      // Datos de turnos
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);

      for (let i = 0; i < turnosFiltrados.length; i++) {
        const turno = turnosFiltrados[i];

        // Verificar si necesitamos una nueva página
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
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

        // Obtener nombre del especialista
        const especialista = this.especialistasMap.get(turno.especialista);
        const nombreEspecialista = especialista
          ? `${especialista.nombre} ${especialista.apellido}`
          : 'Desconocido';

        // Estado del turno
        const estadoTexto = this.getEstadoTurnoTexto(turno.estadoTurno || 'pendiente');

        // Agregar fila
        pdf.text(fechaFormateada, colPositions[0], yPosition);
        pdf.text(horaFormateada, colPositions[1], yPosition);

        // Truncar nombre del especialista si es muy largo
        const nombreTruncado = pdf.splitTextToSize(nombreEspecialista, colWidths[2] - 5);
        pdf.text(nombreTruncado[0], colPositions[2], yPosition);

        pdf.text(estadoTexto, colPositions[3], yPosition);
        yPosition += lineHeight + 2;

        // Si el nombre se truncó, continuar en la siguiente línea
        if (nombreTruncado.length > 1) {
          yPosition += lineHeight;
        }
      }

      // Guardar PDF
      const nombreArchivo = `turnos_${this.especialidadSeleccionadaPDF}_${this.usuario.nombre}_${this.usuario.apellido}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(nombreArchivo);

      this.snackBar.open('PDF de turnos descargado exitosamente', 'Cerrar', {
        duration: 3000
      });
    } catch (error) {
      console.error('Error al generar PDF de turnos:', error);
      this.snackBar.open('Error al generar el PDF de turnos', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.descargandoPDFTurnos = false;
    }
  }

  getEstadoTurnoTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'aceptado': 'Aceptado',
      'realizado': 'Realizado',
      'cancelado': 'Cancelado',
      'rechazado': 'Rechazado'
    };
    return estados[estado] || estado;
  }

  async cargarHistoriaClinica(idPaciente: string): Promise<void> {
    try {
      this.cargando = true;
      this.historiaClinica = await this.historiaClinicaService.obtenerHistoriaClinicaPaciente(idPaciente);
      this.historiaClinicaCompleta = [...this.historiaClinica];
      this.historiaClinicaFiltrada = [...this.historiaClinica];
    } catch (error) {
      console.error('Error al cargar historia clínica:', error);
      this.snackBar.open('Error al cargar la historia clínica', 'Cerrar', {
        duration: 3000,
        panelClass: ['snack-error']
      });
    } finally {
      this.cargando = false;
    }
  }

  parsearDatosDinamicos(dinamicos: string): DatoDinamico[] {
    return this.historiaClinicaService.parsearDatosDinamicos(dinamicos);
  }

  formatearFechaHistoria(fecha: Date | string | undefined): string {
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

  esPaciente(): boolean {
    return this.usuario?.tipoUsuario === 'paciente';
  }

  async descargarPDFHistoriaClinica(): Promise<void> {
    if (!this.usuario?.id || this.historiaClinica.length === 0) {
      this.snackBar.open('No hay historia clínica para descargar', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.descargandoPDF = true;
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      const margin = 20;
      const lineHeight = 7;
      const maxWidth = pageWidth - (margin * 2);

      // Cargar y agregar logo
      try {
        const logoImg = await this.loadImageAsBase64('/assets/clinica-pdf.png');
        if (logoImg) {
          const logoWidth = 150;
          const logoHeight = 28;
          const logoX = (pageWidth - logoWidth) / 2; // Centrar horizontalmente
          pdf.addImage(logoImg, 'PNG', logoX, yPosition, logoWidth, logoHeight);
          yPosition += logoHeight + 10;
        }
      } catch (error) {
        console.error('Error al cargar logo:', error);
      }

      // Título
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Historia Clínica', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Información del paciente
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Paciente: ${this.usuario.nombre} ${this.usuario.apellido}`, margin, yPosition);
      yPosition += lineHeight;
      pdf.text(`DNI: ${this.usuario.dni}`, margin, yPosition);
      yPosition += lineHeight;

      // Fecha de emisión
      const fechaEmision = new Date().toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(`Fecha de emisión: ${fechaEmision}`, margin, yPosition);
      yPosition += 15;

      // Línea separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Registros de historia clínica
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Registros de Atención', margin, yPosition);
      yPosition += 10;

      // Usar historiaClinicaCompleta para obtener las especialidades relacionadas
      const historiasConEspecialidad = this.historiaClinica.map(historia => {
        const turnosRelacionados = this.turnosPaciente.filter(turno =>
          turno.especialista === historia.idEspecialista &&
          turno.paciente === historia.idPaciente &&
          turno.estadoTurno === 'realizado'
        );
        let turnoAsociado: TurnoDTO | undefined;
        if (turnosRelacionados.length > 0) {
          const fechaHistoria = historia.created_at ? new Date(historia.created_at).getTime() : 0;
          turnoAsociado = turnosRelacionados.reduce((closest, turno) => {
            const fechaTurno = new Date(turno.fecha).getTime();
            const fechaClosest = closest ? new Date(closest.fecha).getTime() : 0;
            const diffClosest = Math.abs(fechaClosest - fechaHistoria);
            const diffTurno = Math.abs(fechaTurno - fechaHistoria);
            return diffTurno < diffClosest ? turno : closest;
          });
        }
        return {
          ...historia,
          especialidad: turnoAsociado?.especialidad || 'Desconocida'
        } as HistoriaClinicaDTO & { especialidad?: string };
      });

      for (let i = 0; i < historiasConEspecialidad.length; i++) {
        const registro = historiasConEspecialidad[i] as any;

        // Verificar si necesitamos una nueva página
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = 20;
        }

        // Fecha de atención
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        const fechaAtencion = this.formatearFechaHistoria(registro.created_at);
        pdf.text(`Atención ${i + 1} - ${fechaAtencion}`, margin, yPosition);
        yPosition += lineHeight;

        // Especialista
        const especialista = this.especialistasMap.get(registro.idEspecialista);
        const nombreEspecialista = especialista
          ? `Dr./Dra. ${especialista.nombre} ${especialista.apellido}`
          : 'Especialista no encontrado';
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text(`Atendido por: ${nombreEspecialista}`, margin, yPosition);
        yPosition += lineHeight;

        // Especialidad
        if (registro.especialidad) {
          pdf.text(`Especialidad: ${registro.especialidad}`, margin, yPosition);
          yPosition += lineHeight;
        }

        // Datos fijos
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('Datos Fijos:', margin, yPosition);
        yPosition += lineHeight;
        pdf.setFont('helvetica', 'normal');

        if (registro.altura) {
          pdf.text(`  • Altura: ${registro.altura} cm`, margin + 5, yPosition);
          yPosition += lineHeight;
        }
        if (registro.peso) {
          pdf.text(`  • Peso: ${registro.peso} kg`, margin + 5, yPosition);
          yPosition += lineHeight;
        }
        if (registro.temperatura) {
          pdf.text(`  • Temperatura: ${registro.temperatura} °C`, margin + 5, yPosition);
          yPosition += lineHeight;
        }
        if (registro.presion) {
          pdf.text(`  • Presión: ${registro.presion} mmHg`, margin + 5, yPosition);
          yPosition += lineHeight;
        }

        // Datos dinámicos
        const datosDinamicos = this.parsearDatosDinamicos(registro.dinamicos);
        if (datosDinamicos.length > 0) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('Otros Datos:', margin, yPosition);
          yPosition += lineHeight;
          pdf.setFont('helvetica', 'normal');
          datosDinamicos.forEach(dato => {
            pdf.text(`  • ${dato.clave}: ${dato.valor}`, margin + 5, yPosition);
            yPosition += lineHeight;
          });
        }

        yPosition += 5;

        // Línea separadora entre registros
        if (i < historiasConEspecialidad.length - 1) {
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 10;
        }
      }

      // Guardar PDF
      const nombreArchivo = `historia_clinica_${this.usuario.nombre}_${this.usuario.apellido}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(nombreArchivo);

      this.snackBar.open('PDF descargado exitosamente', 'Cerrar', {
        duration: 3000
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.snackBar.open('Error al generar el PDF', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.descargandoPDF = false;
    }
  }

  private loadImageAsBase64(path: string): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
          } catch (error) {
            console.error('Error al convertir imagen:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      img.onerror = () => {
        console.error('Error al cargar imagen:', path);
        resolve(null);
      };
      img.src = path;
    });
  }

  async cargarHorariosEspecialista(): Promise<void> {
    if (!this.usuario?.id) return;

    try {
      this.cargando = true;
      this.horariosExistentes = await this.horariosService.obtenerHorariosEspecialista(this.usuario.id);

      // Si existe un horario para la especialidad seleccionada, cargar los días
      this.cargarDiasDeEspecialidad();
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      this.snackBar.open('Error al cargar horarios existentes', 'Cerrar', {
        duration: 3000,
        panelClass: ['snack-error']
      });
    } finally {
      this.cargando = false;
    }
  }

  onEspecialidadChange(): void {
    // Cargar días de la especialidad seleccionada
    this.cargarDiasDeEspecialidad();
  }

  cargarDiasDeEspecialidad(): void {
    if (!this.especialidadSeleccionada) {
      this.diasSeleccionados = [];
      this.horaInicio = 9;
      this.horaFin = 18;
      return;
    }

    const horario = this.horariosExistentes.find(
      h => h.especialidad === this.especialidadSeleccionada
    );

    if (horario && horario.dias) {
      // Convertir string "1,2,3" a array de números [1,2,3]
      this.diasSeleccionados = horario.dias.split(',').map(d => parseInt(d.trim()));

      // Cargar horario configurado (formato "9-18")
      if (horario.horario) {
        const [inicio, fin] = horario.horario.split('-').map(h => parseInt(h.trim()));
        this.horaInicio = inicio;
        this.horaFin = fin;
      }
    } else {
      this.diasSeleccionados = [];
      this.horaInicio = 9;
      this.horaFin = 18;
    }
  }

  toggleDia(dia: number): void {
    const index = this.diasSeleccionados.indexOf(dia);
    if (index > -1) {
      this.diasSeleccionados.splice(index, 1);
    } else {
      this.diasSeleccionados.push(dia);
    }
  }

  isDiaSeleccionado(dia: number): boolean {
    return this.diasSeleccionados.includes(dia);
  }

  seleccionarTodosLosDias(): void {
    if (this.diasSeleccionados.length === this.diasSemana.length) {
      this.diasSeleccionados = [];
    } else {
      this.diasSeleccionados = this.diasSemana.map(d => d.numero);
    }
  }

  todosDiasMarcados(): boolean {
    return this.diasSeleccionados.length === this.diasSemana.length;
  }

  async guardarHorarios(): Promise<void> {
    if (!this.especialidadSeleccionada || this.diasSeleccionados.length === 0) {
      this.snackBar.open('Debe seleccionar especialidad y al menos un día', 'Cerrar', {
        duration: 3000,
        panelClass: ['snack-error']
      });
      return;
    }

    // Validar que el horario de fin sea mayor que el de inicio
    if (this.horaFin <= this.horaInicio) {
      this.snackBar.open('La hora de fin debe ser posterior a la hora de inicio', 'Cerrar', {
        duration: 3000,
        panelClass: ['snack-error']
      });
      return;
    }

    if (!this.usuario?.id) return;

    try {
      this.cargando = true;

      // Convertir array de días a string separado por comas
      const diasString = this.diasSeleccionados.sort((a, b) => a - b).join(',');

      // Formato del horario "inicio-fin" (ej: "9-18")
      const horarioString = `${this.horaInicio}-${this.horaFin}`;

      // Verificar si ya existe un horario para esta especialidad
      const horarioExistente = this.horariosExistentes.find(
        h => h.especialidad === this.especialidadSeleccionada
      );

      if (horarioExistente && horarioExistente.id) {
        // Actualizar horario existente
        await this.horariosService.actualizarHorario(horarioExistente.id, {
          dias: diasString,
          horario: horarioString
        });

        this.snackBar.open('Horario actualizado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['snack-exito']
        });
      } else {
        // Crear nuevo horario
        await this.horariosService.crearHorario({
          idEspecialista: this.usuario.id,
          especialidad: this.especialidadSeleccionada,
          dias: diasString,
          horario: horarioString
        });

        this.snackBar.open('Horario creado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['snack-exito']
        });
      }

      // Recargar horarios
      await this.cargarHorariosEspecialista();

    } catch (error) {
      console.error('Error al guardar horarios:', error);
      this.snackBar.open('Error al guardar horarios', 'Cerrar', {
        duration: 3000,
        panelClass: ['snack-error']
      });
    } finally {
      this.cargando = false;
    }
  }

  async eliminarHorario(horario: HorarioDTO): Promise<void> {
    if (!horario.id) return;

    try {
      this.cargando = true;
      await this.horariosService.eliminarHorario(horario.id);

      this.snackBar.open('Horario eliminado exitosamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['snack-exito']
      });

      await this.cargarHorariosEspecialista();
    } catch (error) {
      console.error('Error al eliminar horario:', error);
      this.snackBar.open('Error al eliminar horario', 'Cerrar', {
        duration: 3000,
        panelClass: ['snack-error']
      });
    } finally {
      this.cargando = false;
    }
  }

  obtenerNombreDia(numeroDia: number): string {
    const dia = this.diasSemana.find(d => d.numero === numeroDia);
    return dia ? dia.nombre : '';
  }

  obtenerDiasFormateados(diasString: string): string {
    const numeroDias = diasString.split(',').map(d => parseInt(d.trim()));
    return numeroDias.map(num => this.obtenerNombreDia(num)).join(', ');
  }

  obtenerHoraTexto(hora: number): string {
    if (hora === 12) return '12:00 PM';
    if (hora === 0) return '12:00 AM';
    if (hora > 12) return `${hora - 12}:00 PM`;
    return `${hora}:00 AM`;
  }

  obtenerHorarioFormateado(horarioString: string): string {
    const [inicio, fin] = horarioString.split('-').map(h => parseInt(h.trim()));
    return `${this.obtenerHoraTexto(inicio)} - ${this.obtenerHoraTexto(fin)}`;
  }

  calcularTurnosPorDia(): number {
    const duracion = this.horaFin - this.horaInicio;
    return duracion * 2; // 2 turnos por hora (cada 30 min)
  }

  getHorasFinDisponibles(): { valor: number; texto: string }[] {
    return this.horasDisponibles.filter(h => h.valor > this.horaInicio);
  }

  esEspecialista(): boolean {
    return this.usuario?.tipoUsuario === 'especialista';
  }
}

