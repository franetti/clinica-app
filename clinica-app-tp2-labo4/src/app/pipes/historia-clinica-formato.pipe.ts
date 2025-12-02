import { Pipe, PipeTransform } from '@angular/core';

type TipoDatoClinico = 'altura' | 'peso' | 'temperatura' | 'presion';

@Pipe({
    name: 'historiaClinicaFormato',
    standalone: true
})
export class HistoriaClinicaFormatoPipe implements PipeTransform {
    transform(valor: string | null | undefined, tipo: TipoDatoClinico): string {
        if (!valor || valor.trim() === '') {
            return '';
        }

        const valorLimpio = valor.trim();

        switch (tipo) {
            case 'altura':
                return `${valorLimpio} cm`;
            case 'peso':
                return `${valorLimpio} kg`;
            case 'temperatura':
                return `${valorLimpio} °C`;
            case 'presion':
                return `${valorLimpio} mmHg`;
            default:
                return valorLimpio;
        }
    }
}


