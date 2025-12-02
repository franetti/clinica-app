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
import { DniFormatoPipe } from '../../pipes/dni-formato.pipe';
import { AuthService } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import { TurnosService, TurnoDTO } from '../../services/turnos.service';
import { HorariosService, HorarioDTO } from '../../services/horarios.service';
import { UsuarioDTO } from '../../models/usuario';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CustomCaptchaDirective } from '../../directives/custom-captcha.directive';

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
    MatIconModule,
    DniFormatoPipe,
    CustomCaptchaDirective
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

  // Captcha
  recaptchaToken: string | null = null;

  constructor(
    private authService: AuthService,
    private usuariosService: UsuariosService,
    private turnosService: TurnosService,
    private horariosService: HorariosService,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

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
      this.especialidades = Array.from(
        new Set(
          this.especialistas.flatMap(e =>
            e.especialidad!
              .split(',')                          // separa por comas
              .map(s => s.trim())                  // elimina espacios
              .filter(s => s.length > 0)           // descarta vacíos
              .map(s => s.replace(/^\w/, c => c.toUpperCase()))       // capitaliza cada una
          )
        )
      );
      // this.especialidades = [...new Set(this.especialistas.map(e => e.especialidad!.toLowerCase()
      //   .replace(/^\w/, c => c.toUpperCase())) as string[])];
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
        e => e.especialidad!.includes(especialidadSeleccionada)
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

    try {
      const especialidadSeleccionada = this.turnoForm.get('especialidad')?.value;
      if (!especialidadSeleccionada) return;

      // Obtener horarios configurados del especialista para la especialidad seleccionada
      const horarios = await this.horariosService.obtenerHorariosPorEspecialidad(especialistaId, especialidadSeleccionada);

      if (horarios.length === 0) {
        this.snackBar.open('El especialista no tiene horarios configurados para esta especialidad', 'Cerrar', { duration: 3000 });
        return;
      }

      // Obtener los días de trabajo del primer horario (debería haber solo uno por especialidad)
      const horario = horarios[0];
      const diasTrabajo = horario.dias.split(',').map(d => parseInt(d.trim())); // [1,2,3,4,5] = Lunes a Viernes

      // Generar días disponibles en los próximos 15 días que coincidan con los días de trabajo
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const limite = new Date();
      limite.setDate(hoy.getDate() + 15);

      const fechasDisponibles: Date[] = [];
      const fechaActual = new Date(hoy);
      fechaActual.setDate(fechaActual.getDate() + 1); // Empezar desde mañana

      while (fechaActual <= limite) {
        // getDay() devuelve 0=Domingo, 1=Lunes, ..., 6=Sábado
        // Convertir a nuestro formato: 1=Lunes, 2=Martes, etc.
        const diaSemana = fechaActual.getDay();
        const diaNumero = diaSemana === 0 ? 7 : diaSemana; // Convertir domingo de 0 a 7

        // Verificar si este día está en los días de trabajo
        if (diasTrabajo.includes(diaNumero)) {
          fechasDisponibles.push(new Date(fechaActual));
        }

        // Avanzar al siguiente día
        fechaActual.setDate(fechaActual.getDate() + 1);
      }

      // Convertir a formato para el selector
      this.diasDisponibles = fechasDisponibles.map(fecha => ({
        fecha: fecha,
        label: `${fecha.getDate()} / ${fecha.getMonth() + 1}`
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
      const especialidadSeleccionada = this.turnoForm.get('especialidad')?.value;
      if (!especialidadSeleccionada) return;

      // Obtener horarios configurados del especialista para esta especialidad
      const horarios = await this.horariosService.obtenerHorariosPorEspecialidad(especialistaId, especialidadSeleccionada);

      if (horarios.length === 0) {
        this.snackBar.open('El especialista no tiene horarios configurados', 'Cerrar', { duration: 3000 });
        return;
      }

      // Obtener el rango de horarios del primer horario (debería haber solo uno por especialidad)
      const horario = horarios[0];
      const [horaInicio, horaFin] = horario.horario.split('-').map(h => parseInt(h.trim()));

      // Generar todos los horarios posibles en el rango configurado cada 30 minutos
      const horariosGenerados: HorarioDisponible[] = [];

      // Obtener componentes de la fecha para evitar problemas de zona horaria
      const fechaObj = new Date(fecha);
      const año = fechaObj.getFullYear();
      const mes = fechaObj.getMonth();
      const dia = fechaObj.getDate();

      for (let hora = horaInicio; hora < horaFin; hora++) {
        for (let minuto of [0, 30]) {
          // Crear fecha usando componentes para evitar problemas de zona horaria
          const fechaHorario = new Date(año, mes, dia, hora, minuto, 0, 0);

          const hours = hora;
          const minutes = minuto;
          const sufijo = hours >= 12 ? 'PM' : 'AM';
          const horas12 = hours % 12 === 0 ? 12 : hours % 12;
          const horaFormateada = `${horas12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${sufijo}`;

          horariosGenerados.push({
            fecha: this.formatearFechaISO(fechaHorario),
            hora: horaFormateada,
            disponible: true,
            turnoId: undefined
          });
        }
      }

      // Obtener turnos existentes para este especialista y fecha
      const turnosExistentes = await this.turnosService.obtenerTurnosHabilitadosEspecialista(especialistaId);

      // Filtrar turnos del día seleccionado y especialidad
      const turnosDelDia = turnosExistentes.filter(turno => {
        const fechaTurno = new Date(turno.fecha);
        return this.mismoDia(fechaTurno, fecha) && turno.especialidad === especialidadSeleccionada;
      });

      // Marcar horarios ocupados
      horariosGenerados.forEach(horario => {
        const turnoOcupado = turnosDelDia.find(turno => {
          const fechaTurno = new Date(turno.fecha);
          const hours = fechaTurno.getHours();
          const minutes = fechaTurno.getMinutes();
          const sufijo = hours >= 12 ? 'PM' : 'AM';
          const horas12 = hours % 12 === 0 ? 12 : hours % 12;
          const horaTurno = `${horas12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${sufijo}`;

          return horaTurno === horario.hora && turno.paciente && turno.paciente !== '';
        });

        if (turnoOcupado) {
          horario.disponible = false;
          horario.turnoId = turnoOcupado.id;
        }
      });

      this.horariosDisponibles = horariosGenerados;

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

  /**
   * Formatea una fecha a ISO string preservando la hora local (sin conversión a UTC)
   */
  formatearFechaISOLocal(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const segundos = String(fecha.getSeconds()).padStart(2, '0');

    return `${año}-${mes}-${dia}T${horas}:${minutos}:${segundos}`;
  }

  onCaptchaResolved(token: string | null): void {
    this.recaptchaToken = token;
  }

  async onSubmit() {
    if (this.turnoForm.invalid) {
      this.snackBar.open('Por favor complete todos los campos', 'Cerrar', { duration: 3000 });
      return;
    }

    // Validar captcha si es requerido
    if (this.recaptchaToken === null || this.recaptchaToken === 'no-captcha-required') {
      // Si el token es null, significa que el captcha expiró o hubo error
      if (this.recaptchaToken === null) {
        this.snackBar.open('Por favor complete el captcha de verificación', 'Cerrar', { duration: 3000 });
        return;
      }
    }

    this.cargando = true;

    try {
      const formValue = this.turnoForm.value;

      // Determinar el paciente
      let pacienteId: string;
      if (this.esAdmin) {
        pacienteId = formValue.paciente;
      } else {
        pacienteId = this.userSession?.id || '';
      }

      // Buscar el horario seleccionado
      const horarioSeleccionado = this.horariosDisponibles.find(h => h.hora === formValue.horario);

      if (!horarioSeleccionado || !horarioSeleccionado.disponible) {
        throw new Error('El horario seleccionado no está disponible');
      }

      // Obtener la fecha y hora seleccionadas
      const fechaSeleccionada = this.turnoForm.get('fecha')?.value;
      const horaSeleccionada = formValue.horario;

      // Parsear la hora (formato "09:00 AM" o "03:30 PM")
      const [horaStr, sufijo] = horaSeleccionada.split(' ');
      const [horas12, minutos] = horaStr.split(':').map((n: string) => parseInt(n));
      let horas24 = horas12;

      if (sufijo === 'PM' && horas12 !== 12) {
        horas24 = horas12 + 12;
      } else if (sufijo === 'AM' && horas12 === 12) {
        horas24 = 0;
      }

      // Crear la fecha completa del turno usando los componentes de la fecha seleccionada
      // Esto evita problemas de zona horaria
      const fechaObj = new Date(fechaSeleccionada);
      const fechaTurno = new Date(
        fechaObj.getFullYear(),
        fechaObj.getMonth(),
        fechaObj.getDate(),
        horas24,
        minutos,
        0,
        0
      );

      // Si ya existe un turno en esta fecha/hora, actualizarlo; sino, crear uno nuevo
      if (horarioSeleccionado.turnoId) {
        // Actualizar turno existente
        await this.turnosService.actualizarTurno(horarioSeleccionado.turnoId, {
          paciente: pacienteId,
          estadoTurno: 'pendiente'
        });
      } else {
        // Crear nuevo turno
        // Usar formatearFechaISOLocal para preservar la hora local sin conversión a UTC
        const nuevoTurno: Partial<TurnoDTO> = {
          fecha: this.formatearFechaISOLocal(fechaTurno),
          especialista: formValue.especialista,
          especialidad: formValue.especialidad,
          paciente: pacienteId,
          estadoTurno: 'pendiente',
          habilitado: true
        };

        await this.turnosService.crearTurno(nuevoTurno);
      }

      this.snackBar.open('Turno solicitado con éxito', 'Cerrar', { duration: 3000 });
      this.turnoForm.reset();
      this.diasDisponibles = [];
      this.horariosDisponibles = [];
      this.recaptchaToken = null;

      // Redirigir según el tipo de usuario
      if (this.esAdmin) {
        this.router.navigate(['/turnos']);
      } else {
        this.router.navigate(['/mis-turnos']);
      }
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

