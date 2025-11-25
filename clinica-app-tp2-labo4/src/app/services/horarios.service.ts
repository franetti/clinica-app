// horarios.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface HorarioDTO {
  id?: string;
  idEspecialista: string;
  especialidad: string;
  dias: string; // "1,2,3,4,5" donde 1=Lunes, 2=Martes, etc.
  horario: string; // "9-18"
}

@Injectable({
  providedIn: 'root'
})
export class HorariosService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Obtener todos los horarios de un especialista
   */
  async obtenerHorariosEspecialista(idEspecialista: string): Promise<HorarioDTO[]> {
    const { data, error } = await this.supabase.getClient()
      .from('horarios')
      .select('*')
      .eq('idEspecialista', idEspecialista);

    if (error) throw error;
    return data as HorarioDTO[];
  }

  /**
   * Obtener horarios por especialista y especialidad
   */
  async obtenerHorariosPorEspecialidad(idEspecialista: string, especialidad: string): Promise<HorarioDTO[]> {
    const { data, error } = await this.supabase.getClient()
      .from('horarios')
      .select('*')
      .eq('idEspecialista', idEspecialista)
      .eq('especialidad', especialidad);

    if (error) throw error;
    return data as HorarioDTO[];
  }

  /**
   * Crear un nuevo horario
   */
  async crearHorario(horario: Omit<HorarioDTO, 'id'>): Promise<HorarioDTO> {
    const { data, error } = await this.supabase.getClient()
      .from('horarios')
      .insert([horario])
      .select()
      .single();

    if (error) throw error;
    return data as HorarioDTO;
  }

  /**
   * Actualizar un horario existente
   */
  async actualizarHorario(id: string, horario: Partial<HorarioDTO>): Promise<HorarioDTO> {
    const { data, error } = await this.supabase.getClient()
      .from('horarios')
      .update(horario)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as HorarioDTO;
  }

  /**
   * Eliminar un horario
   */
  async eliminarHorario(id: string): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('horarios')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Verificar si ya existe un horario para una especialidad
   */
  async existeHorario(idEspecialista: string, especialidad: string): Promise<boolean> {
    const { data, error } = await this.supabase.getClient()
      .from('horarios')
      .select('id')
      .eq('idEspecialista', idEspecialista)
      .eq('especialidad', especialidad)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 es "no rows returned"
      throw error;
    }

    return !!data;
  }
}


