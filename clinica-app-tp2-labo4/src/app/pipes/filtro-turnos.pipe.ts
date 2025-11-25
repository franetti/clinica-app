import { Pipe, PipeTransform, inject } from '@angular/core';
import { TurnoDTO } from '../services/turnos.service';
import { HistoriaClinicaService, HistoriaClinicaDTO } from '../services/historia-clinica.service';

export interface TurnoConNombres extends TurnoDTO {
    nombrePaciente?: string;
    nombreEspecialista?: string;
}

export interface FiltroTurnosOptions {
    buscarEnHistoriaClinica?: boolean;
    historiasClinicas?: Map<string, HistoriaClinicaDTO[]>;
    campos?: readonly string[]; // 'especialidad', 'paciente', 'especialista'
}

@Pipe({
    name: 'filtroTurnos',
    standalone: true,
    pure: false // Impure pipe para que se actualice cuando cambien las historias clínicas
})
export class FiltroTurnosPipe implements PipeTransform {
    private historiaClinicaService = inject(HistoriaClinicaService);

    transform(
        turnos: TurnoConNombres[],
        filtroTexto: string,
        options?: FiltroTurnosOptions
    ): TurnoConNombres[] {
        if (!turnos || turnos.length === 0) {
            return [];
        }

        const filtro = filtroTexto?.toLowerCase().trim() || '';

        if (!filtro) {
            return turnos;
        }

        const campos = options?.campos || ['especialidad', 'paciente', 'especialista'];
        const opts: FiltroTurnosOptions = {
            buscarEnHistoriaClinica: options?.buscarEnHistoriaClinica ?? false,
            historiasClinicas: options?.historiasClinicas,
            campos: campos
        };

        return turnos.filter(turno => {
            // Búsqueda en campos básicos
            let coincideBasico = false;

            if (campos.includes('especialidad')) {
                const especialidad = (turno.especialidad || '').toLowerCase();
                if (especialidad.includes(filtro)) {
                    coincideBasico = true;
                }
            }

            if (campos.includes('paciente') && turno.nombrePaciente) {
                const nombrePaciente = turno.nombrePaciente.toLowerCase();
                if (nombrePaciente.includes(filtro)) {
                    coincideBasico = true;
                }
            }

            if (campos.includes('especialista') && turno.nombreEspecialista) {
                const nombreEspecialista = turno.nombreEspecialista.toLowerCase();
                if (nombreEspecialista.includes(filtro)) {
                    coincideBasico = true;
                }
            }

            // Búsqueda en historia clínica
            let coincideHistoria = false;
            if (opts.buscarEnHistoriaClinica && opts.historiasClinicas) {
                coincideHistoria = this.buscarEnHistoriaClinica(turno, filtro, opts.historiasClinicas);
            }

            return coincideBasico || coincideHistoria;
        });
    }

    private buscarEnHistoriaClinica(
        turno: TurnoDTO,
        filtro: string,
        historiasClinicas: Map<string, HistoriaClinicaDTO[]>
    ): boolean {
        const historias = historiasClinicas.get(turno.id) || [];

        for (const historia of historias) {
            // Buscar en datos fijos
            if (
                historia.altura?.toLowerCase().includes(filtro) ||
                historia.peso?.toLowerCase().includes(filtro) ||
                historia.temperatura?.toLowerCase().includes(filtro) ||
                historia.presion?.toLowerCase().includes(filtro)
            ) {
                return true;
            }

            // Buscar en datos dinámicos
            const datosDinamicos = this.historiaClinicaService.parsearDatosDinamicos(historia.dinamicos);
            for (const dato of datosDinamicos) {
                if (
                    dato.clave?.toLowerCase().includes(filtro) ||
                    dato.valor?.toLowerCase().includes(filtro)
                ) {
                    return true;
                }
            }
        }

        return false;
    }
}

