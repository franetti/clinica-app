import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dniFormato',
    standalone: true
})
export class DniFormatoPipe implements PipeTransform {
    transform(dni: string | number | null | undefined, formato: 'conPuntos' | 'simple' = 'simple'): string {
        if (!dni) {
            return '';
        }

        const dniString = dni.toString().trim();

        if (formato === 'conPuntos') {
            // Formato: 12.345.678 (para DNI de 8 dígitos) o 1.234.567 (para DNI de 7 dígitos)
            if (dniString.length === 8) {
                return `${dniString.substring(0, 2)}.${dniString.substring(2, 5)}.${dniString.substring(5, 8)}`;
            } else if (dniString.length === 7) {
                return `${dniString.substring(0, 1)}.${dniString.substring(1, 4)}.${dniString.substring(4, 7)}`;
            }
        }

        return dniString;
    }
}


