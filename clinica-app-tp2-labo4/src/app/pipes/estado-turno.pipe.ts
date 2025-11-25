import { Pipe, PipeTransform } from '@angular/core';
import { EstadoTurno } from '../models/estadoTurno';

@Pipe({
    name: 'estadoTurno',
    standalone: true
})
export class EstadoTurnoPipe implements PipeTransform {
    transform(estado: EstadoTurno | string | undefined | null, tipo: 'texto' | 'icono' | 'clase' = 'texto'): string {
        if (!estado) {
            return this.getDefaultValue(tipo);
        }

        switch (tipo) {
            case 'texto':
                return this.getEstadoTexto(estado as EstadoTurno);
            case 'icono':
                return this.getEstadoIcon(estado as EstadoTurno);
            case 'clase':
                return this.getEstadoClass(estado as EstadoTurno);
            default:
                return this.getEstadoTexto(estado as EstadoTurno);
        }
    }

    private getEstadoTexto(estado: EstadoTurno): string {
        const estados: { [key: string]: string } = {
            'pendiente': 'Pendiente',
            'aceptado': 'Aceptado',
            'realizado': 'Realizado',
            'cancelado': 'Cancelado',
            'rechazado': 'Rechazado'
        };
        return estados[estado] || 'Desconocido';
    }

    private getEstadoIcon(estado: EstadoTurno): string {
        const iconos: { [key: string]: string } = {
            'pendiente': 'schedule',
            'aceptado': 'check_circle',
            'realizado': 'done_all',
            'cancelado': 'cancel',
            'rechazado': 'block'
        };
        return iconos[estado] || 'help';
    }

    private getEstadoClass(estado: EstadoTurno): string {
        const clases: { [key: string]: string } = {
            'pendiente': 'estado-pendiente',
            'aceptado': 'estado-aceptado',
            'realizado': 'estado-realizado',
            'cancelado': 'estado-cancelado',
            'rechazado': 'estado-rechazado'
        };
        return clases[estado] || '';
    }

    private getDefaultValue(tipo: string): string {
        switch (tipo) {
            case 'texto': return 'Desconocido';
            case 'icono': return 'help';
            case 'clase': return '';
            default: return 'Desconocido';
        }
    }
}

