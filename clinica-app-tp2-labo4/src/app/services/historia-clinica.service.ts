// historia-clinica.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface HistoriaClinicaDTO {
    id?: number;
    created_at?: Date;
    idPaciente: string;
    idEspecialista: string;
    altura: string;
    peso: string;
    temperatura: string;
    presion: string;
    dinamicos: string; // JSON string con los datos dinámicos
}

export interface DatoDinamico {
    clave: string;
    valor: string;
}

@Injectable({
    providedIn: 'root'
})
export class HistoriaClinicaService {

    constructor(private supabase: SupabaseService) { }

    /**
     * Crear un nuevo registro de historia clínica
     */
    async crearHistoriaClinica(historia: HistoriaClinicaDTO): Promise<HistoriaClinicaDTO> {
        const { data, error } = await this.supabase.getClient()
            .from('historia-clinica')
            .insert([historia])
            .select()
            .single();

        if (error) throw error;
        return data as HistoriaClinicaDTO;
    }

    /**
     * Obtener todas las historias clínicas de un paciente
     */
    async obtenerHistoriaClinicaPaciente(idPaciente: string): Promise<HistoriaClinicaDTO[]> {
        const { data, error } = await this.supabase.getClient()
            .from('historia-clinica')
            .select('*')
            .eq('idPaciente', idPaciente)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as HistoriaClinicaDTO[];
    }

    /**
     * Obtener historias clínicas de pacientes atendidos por un especialista
     */
    async obtenerHistoriaClinicaPorEspecialista(idEspecialista: string): Promise<HistoriaClinicaDTO[]> {
        const { data, error } = await this.supabase.getClient()
            .from('historia-clinica')
            .select('*')
            .eq('idEspecialista', idEspecialista)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as HistoriaClinicaDTO[];
    }

    /**
     * Obtener todas las historias clínicas (para administradores)
     */
    async obtenerTodasLasHistoriasClinicas(): Promise<HistoriaClinicaDTO[]> {
        const { data, error } = await this.supabase.getClient()
            .from('historia-clinica')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as HistoriaClinicaDTO[];
    }

    /**
     * Obtener pacientes únicos atendidos por un especialista
     */
    async obtenerPacientesAtendidosPorEspecialista(idEspecialista: string): Promise<string[]> {
        const { data, error } = await this.supabase.getClient()
            .from('historia-clinica')
            .select('idPaciente')
            .eq('idEspecialista', idEspecialista);

        if (error) throw error;

        // Obtener IDs únicos
        const idsUnicos = [...new Set((data || []).map((h: any) => h.idPaciente))];
        return idsUnicos;
    }

    /**
     * Obtener la historia clínica completa de un paciente (todos los registros)
     */
    async obtenerHistoriaClinicaCompleta(idPaciente: string): Promise<HistoriaClinicaDTO[]> {
        return this.obtenerHistoriaClinicaPaciente(idPaciente);
    }

    /**
     * Parsear datos dinámicos desde JSON string
     */
    parsearDatosDinamicos(dinamicos: string): DatoDinamico[] {
        try {
            if (!dinamicos) return [];
            return JSON.parse(dinamicos);
        } catch (error) {
            console.error('Error al parsear datos dinámicos:', error);
            return [];
        }
    }

    /**
     * Convertir datos dinámicos a JSON string
     */
    convertirDatosDinamicos(datos: DatoDinamico[]): string {
        return JSON.stringify(datos);
    }
}

