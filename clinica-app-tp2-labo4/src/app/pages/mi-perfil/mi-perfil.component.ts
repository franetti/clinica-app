import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TurnosService, TurnoDTO } from '../../services/turnos.service';
import { HorariosService, HorarioDTO } from '../../services/horarios.service';
import { UsuarioDTO } from '../../models/usuario';
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
    MatTooltipModule
  ],
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.scss']
})
export class MiPerfilComponent implements OnInit {
  usuario: UsuarioDTO | null = null;
  especialidades: string[] = [];
  
  // Para la gestión de horarios
  especialidadSeleccionada: string = '';
  diasSeleccionados: number[] = []; // 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes
  horaInicio: number = 9; // Hora de inicio (0-23)
  horaFin: number = 18; // Hora de fin (0-23)
  horariosExistentes: HorarioDTO[] = [];
  cargando = false;
  
  // Días de la semana
  diasSemana = [
    { numero: 1, nombre: 'Lunes', corto: 'L' },
    { numero: 2, nombre: 'Martes', corto: 'M' },
    { numero: 3, nombre: 'Miércoles', corto: 'X' },
    { numero: 4, nombre: 'Jueves', corto: 'J' },
    { numero: 5, nombre: 'Viernes', corto: 'V' }
  ];

  // Horarios disponibles para selección (8 AM - 8 PM)
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

  constructor(
    private authService: AuthService,
    private horariosService: HorariosService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.authService.getUser().subscribe(user => {
      this.usuario = user;
      if (user?.especialidad) {
        // Las especialidades pueden estar separadas por comas
        this.especialidades = user.especialidad.split(',').map(e => e.trim());
        if (this.especialidades.length > 0) {
          this.especialidadSeleccionada = this.especialidades[0];
        }
      }
      if (user?.tipoUsuario === 'especialista') {
        this.cargarHorariosEspecialista();
      }
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

