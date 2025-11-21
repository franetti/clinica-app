import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import { TurnosService, TurnoDTO } from '../../services/turnos.service';
import { UsuarioDTO } from '../../models/usuario';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

interface HorarioDisponible {
  fecha: string;
  hora: string;
  disponible: boolean;
  turnoId?: string;  // ID del turno en la BD
}

@Component({
  selector: 'app-solicitar-turno',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatIconModule
  ],
  templateUrl: './solicitar-turno.component.html',
  styleUrls: ['./solicitar-turno.component.scss']
})
export class SolicitarTurnoComponent implements OnInit {
  turnoForm!: FormGroup;
  userSession: UsuarioDTO | null = null;
  esAdmin = false;

  // Listas para los selectores
  especialidades: string[] = [];
  especialidadesFiltradas!: Observable<string[]>;
  especialistas: UsuarioDTO[] = [];
  especialistasFiltrados: UsuarioDTO[] = [];
  pacientes: UsuarioDTO[] = [];
  
  // Para mostrar botones visuales
  especialidadesVisibles: string[] = [];
  mostrarTodasEspecialidades = false;
  especialistasVisibles: UsuarioDTO[] = [];
  mostrarTodosEspecialistas = false;
  
  // Horarios disponibles
  diasDisponibles: { fecha: Date, label: string }[] = [];
  horariosDisponibles: HorarioDisponible[] = [];
  
  // Estados de carga
  cargando = false;
  cargandoHorarios = false;
  cargandoDias = false;

  constructor(
    private authService: AuthService,
    private usuariosService: UsuariosService,
    private turnosService: TurnosService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  async ngOnInit() {
    // Obtener usuario actual
    this.authService.getUser().subscribe(user => {
      this.userSession = user;
      this.esAdmin = user?.tipoUsuario === 'admin';
      this.inicializarFormulario();
    });

    // Cargar datos iniciales
      await this.cargarEspecialistas();
      await this.cargarPacientes();
    if (this.esAdmin) {
      
    }
  }

  inicializarFormulario() {
    this.turnoForm = new FormGroup({
      especialidad: new FormControl('', Validators.required),
      especialista: new FormControl('', Validators.required),
      especialistaBusqueda: new FormControl(''),       // campo para el autocomplete
      fecha: new FormControl('', Validators.required),
      horario: new FormControl('', Validators.required)
    });

    // Si es admin, agregar campo de paciente
    if (this.esAdmin) {
      this.turnoForm.addControl('paciente', new FormControl('', Validators.required));
    }

    // Configurar autocomplete para especialidades
    this.especialidadesFiltradas = this.turnoForm.get('especialidad')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filtrarEspecialidades(value || ''))
    );

    // Configurar autocomplete para especialistas
    // this.especialistasFiltradosAutocomplete = this.turnoForm.get('especialistaBusqueda')!.valueChanges.pipe(
    //   startWith(''),
    //   map(value => this._filtrarEspecialistas(value || ''))
    // );

    this.turnoForm.get('especialista')!.valueChanges.subscribe(value => {
      this.filtrarEspecialistas(value || '');
    });

    // Listeners para actualizar datos dependientes
    this.turnoForm.get('especialidad')?.valueChanges.subscribe(() => {
      this.onEspecialidadChange();
    });

    this.turnoForm.get('especialista')?.valueChanges.subscribe((value) => {
      // Solo llamar si es un ID válido (no texto de búsqueda)
      if (value && this.especialistas.some(e => e.id === value)) {
        this.onEspecialistaChange();
      }
    });

    this.turnoForm.get('fecha')?.valueChanges.subscribe(() => {
      this.onFechaChange();
    });
  }

  private _filtrarEspecialidades(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.especialidades.filter(especialidad => 
      especialidad.toLowerCase().includes(filterValue)
    );
  }

  private _filtrarEspecialistas(value: string): UsuarioDTO[] {
    if (!value || typeof value !== 'string') {
      return this.especialistasFiltrados;
    }
    const filterValue = value.toLowerCase();
    return this.especialistasFiltrados.filter(especialista => 
      especialista.nombre.toLowerCase().includes(filterValue) ||
      especialista.apellido.toLowerCase().includes(filterValue)
    );
  }

  async cargarEspecialistas() {
    this.usuariosService.getEspecialistas().subscribe(especialistas => {
      this.especialistas = especialistas.filter(e => e.habilitado !== false);
      // Extraer especialidades únicas
      this.especialidades = [...new Set(this.especialistas.map(e => e.especialidad!.toLowerCase()
        .replace(/^\w/, c => c.toUpperCase())) as string[])];
      // Mostrar primeras 5 especialidades
      this.especialidadesVisibles = this.especialidades.slice(0, 5);
    });
  }

  async cargarPacientes() {
    this.usuariosService.getPacientes().subscribe(pacientes => {
      this.pacientes = pacientes;
    });
  }

  filtrarEspecialistas(idEspecialista: string) {

    this.especialistasVisibles = this.especialistasFiltrados.filter(e =>
      e.id == idEspecialista
    ).slice(0, 20); // límite para que no explote
  }

  onEspecialidadChange() {
    
    const especialidadSeleccionada = this.turnoForm.get('especialidad')?.value;
    
    // Solo filtrar si la especialidad existe en la lista
    if (this.especialidades.includes(especialidadSeleccionada)) {
      // Filtrar especialistas por especialidad
      this.especialistasFiltrados = this.especialistas.filter(
        e => e.especialidad === especialidadSeleccionada
      );
      // Mostrar primeros 5 especialistas
      this.especialistasVisibles = this.especialistasFiltrados.slice(0, 5);
      this.mostrarTodosEspecialistas = false;
    } else {
      this.especialistasFiltrados = [];
      this.especialistasVisibles = [];
    }

    // Resetear campos dependientes
    this.turnoForm.patchValue({
      especialistaBusqueda: '',
      especialista: '',
      fecha: '',
      horario: ''
    });
    this.diasDisponibles = [];
    this.horariosDisponibles = [];
  }

  async onEspecialistaChange() {
    this.cargandoDias = true;
    const especialistaId = this.turnoForm.get('especialista')?.value;

    if (especialistaId) {
      // Cargar días disponibles desde la BD
      await this.cargarDiasDisponibles(especialistaId);
    }

    // Resetear campos dependientes
    this.turnoForm.patchValue({
      fecha: '',
      horario: ''
    });
    this.horariosDisponibles = [];
    this.cargandoDias = false;
  }

  async cargarDiasDisponibles(especialistaId: string) {
    this.diasDisponibles = [];
    debugger
    try {
      // Obtener turnos habilitados del especialista
      const turnosHabilitados = await this.turnosService.obtenerTurnosHabilitadosEspecialista(especialistaId);
      
      // Filtrar turnos dentro de los próximos 15 días y sin paciente asignado
      const hoy = new Date();
      const limite = new Date();
      limite.setDate(hoy.getDate() + 15);
      
      const turnosFiltrados = turnosHabilitados.filter(turno => {
        debugger
        const fechaTurno = new Date(turno.fecha);
        // Solo incluir turnos futuros, dentro de 15 días y sin paciente asignado (o paciente vacío)
        return fechaTurno > hoy && 
               fechaTurno <= limite && 
               (!turno.paciente || turno.paciente === '');
      });
      
      // Extraer fechas únicas y crear los días disponibles
      const fechasUnicas = new Map<string, Date>();
      
      turnosFiltrados.forEach(turno => {
        const fechaTurno = new Date(turno.fecha);
        const fechaKey = this.formatearFechaISO(fechaTurno);
        
        if (!fechasUnicas.has(fechaKey)) {
          fechasUnicas.set(fechaKey, fechaTurno);
        }
      });
      
      // Convertir a array y ordenar
      this.diasDisponibles = Array.from(fechasUnicas.values())
        .sort((a, b) => a.getTime() - b.getTime())
        .map(fecha => ({
          fecha: fecha,
          label: `${fecha.getDate()} / ${fecha.getMonth() +1 }`
        }));
        
    } catch (error) {
      console.error('Error al cargar días disponibles:', error);
      this.snackBar.open('Error al cargar días disponibles', 'Cerrar', { duration: 3000 });
    }
  }

  async onFechaChange() {
    const fecha = this.turnoForm.get('fecha')?.value;
    const especialistaId = this.turnoForm.get('especialista')?.value;

    if (fecha && especialistaId) {
      this.cargandoHorarios = true;
      await this.generarHorariosDisponibles(fecha, especialistaId);
      this.cargandoHorarios = false;
    }

    // Resetear horario
    this.turnoForm.patchValue({ horario: '' });
  }

  async generarHorariosDisponibles(fecha: Date, especialistaId: string) {
    this.horariosDisponibles = [];
    
    try {
      // Obtener turnos habilitados del especialista
      const turnosHabilitados = await this.turnosService.obtenerTurnosHabilitadosEspecialista(especialistaId);
      
      // Filtrar turnos del día seleccionado
      const turnosDelDia = turnosHabilitados.filter(turno => {
        const fechaTurno = new Date(turno.fecha);
        return this.mismoDia(fechaTurno, fecha);
      });
      
      // Crear horarios disponibles basados en los turnos de la BD
      this.horariosDisponibles = turnosDelDia.map(turno => {
        const fechaTurno = new Date(turno.fecha);
       const hours = fechaTurno.getHours();
        const minutes = fechaTurno.getMinutes();

        const sufijo = hours >= 12 ? 'PM' : 'AM';
        const horas12 = hours % 12 === 0 ? 12 : hours % 12;

        const hora = `${horas12.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')} ${sufijo}`;
        
        // Disponible si no tiene paciente asignado (o paciente vacío)
        const disponible = !turno.paciente || turno.paciente === '';
        
        return {
          fecha: this.formatearFechaISO(fechaTurno),
          hora: hora,
          disponible: disponible,
          turnoId: turno.id
        };
      }).sort((a, b) => a.hora.localeCompare(b.hora));
      
    } catch (error) {
      console.error('Error al cargar horarios disponibles:', error);
      this.snackBar.open('Error al cargar horarios disponibles', 'Cerrar', { duration: 3000 });
    }
  }

  mismoDia(fecha1: Date, fecha2: Date): boolean {
    return fecha1.getFullYear() === fecha2.getFullYear() &&
           fecha1.getMonth() === fecha2.getMonth() &&
           fecha1.getDate() === fecha2.getDate();
  }

  formatearFechaISO(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  async onSubmit() {
    debugger
    if (this.turnoForm.invalid) {
      this.snackBar.open('Por favor complete todos los campos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.cargando = true;

    try {
      debugger
      const formValue = this.turnoForm.value;

      // Determinar el paciente
      let pacienteId: string;
      if (this.esAdmin) {
        pacienteId = formValue.paciente;
      } else {
        pacienteId = this.userSession?.id || '';
      }

      // Buscar el turno seleccionado en horariosDisponibles
      const horarioSeleccionado = this.horariosDisponibles.find(h => h.hora === formValue.horario);
      
      if (!horarioSeleccionado || !horarioSeleccionado.turnoId) {
        throw new Error('No se encontró el turno seleccionado');
      }

      // Actualizar el turno existente asignándole el paciente
      await this.turnosService.actualizarTurno(horarioSeleccionado.turnoId, {
        paciente: pacienteId,
        estadoTurno: 'pendiente'
      });

      this.snackBar.open('Turno solicitado con éxito', 'Cerrar', { duration: 3000 });
      this.turnoForm.reset();
      this.diasDisponibles = [];
      this.horariosDisponibles = [];
      this.router.navigate(['/mis-turnos']);
    } catch (error) {
      console.error('Error al solicitar turno:', error);
      this.snackBar.open('Error al solicitar el turno', 'Cerrar', { duration: 3000 });
    } finally {
      this.cargando = false;
    }
  }

  seleccionarHorario(horario: HorarioDisponible) {
    if (horario.disponible) {
      this.turnoForm.patchValue({ horario: horario.hora });
    }
  }

  seleccionarEspecialidad(especialidad: string) {
    this.turnoForm.patchValue({ especialidad: especialidad });
    debugger
    this.onEspecialidadChange();
  }


  seleccionarEspecialista(especialista: UsuarioDTO) {
    this.turnoForm.patchValue({
      especialista: especialista.id,         // ID final (para enviar)
      especialistaBusqueda: "Dr. / Dra. " + especialista.nombre + ' ' + especialista.apellido
    });
    console.log(this.turnoForm.get('especialista')!.value);
    this.onEspecialistaChange();
  }

  getImagenEspecialidad(especialidad: string): string {
    return `./assets/especialidades/${especialidad.toLowerCase()}.png`;
  }

  ponerImagenFallback(event: any) {
    event.target.src = './assets/especialidades/default.png';
  }

  getImagenEspecialista(especialista: UsuarioDTO): string {
    // Si tiene imagen propia, usarla, sino placeholder
    debugger
    return especialista.imagen 
      ? especialista.imagen as string
      : 'https://via.placeholder.com/80/2196F3/ffffff?text=' + especialista.nombre.charAt(0);
  }

  displayEspecialista(especialistaId: string): string {
    const especialista = this.especialistas.find(e => e.id === especialistaId);
    return especialista ? `Dr./Dra. ${especialista.nombre} ${especialista.apellido}` : '';
  }
}

