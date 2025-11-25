import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface LogDTO {
    id?: number;
    created_at?: Date;
    idUsuario: string;
    tipoLog: string;
}

@Injectable({
    providedIn: 'root'
})
export class LogService {
    private table = 'logs';

    constructor(private supabaseService: SupabaseService) { }

    async registrarLog(idUsuario: string, tipoLog: string): Promise<void> {
        const log: LogDTO = {
            idUsuario,
            tipoLog
        };

        const { error } = await this.supabaseService.getClient()
            .from(this.table)
            .insert([log]);

        if (error) {
            console.error('Error al registrar log:', error);
            throw error;
        }
    }

    obtenerLogsLogin(): Observable<LogDTO[]> {
        return from(
            this.supabaseService.getClient()
                .from(this.table)
                .select('*')
                .eq('tipoLog', 'login')
                .order('created_at', { ascending: false })
        ).pipe(
            map((response: any) => {
                if (response.error) {
                    throw response.error;
                }
                return response.data as LogDTO[];
            })
        );
    }

    async obtenerLogsConUsuarios(): Promise<any[]> {
        const { data: logs, error } = await this.supabaseService.getClient()
            .from(this.table)
            .select('*')
            .eq('tipoLog', 'login')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al obtener logs:', error);
            throw error;
        }

        if (!logs || logs.length === 0) {
            return [];
        }

        const { data: usuarios } = await this.supabaseService.getClient()
            .from('usuarios-datos')
            .select('id, nombre, apellido, email');

        const usuariosMap = new Map();
        usuarios?.forEach((u: any) => {
            usuariosMap.set(u.id, u);
        });

        return logs.map((log: any) => {
            const usuario = usuariosMap.get(log.idUsuario);
            return {
                ...log,
                usuario: usuario || null
            };
        });
    }
}

