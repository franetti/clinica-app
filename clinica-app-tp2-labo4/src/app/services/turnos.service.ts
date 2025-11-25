// turnos.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type EstadoTurno =  'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado';

export interface TurnoDTO {
  id: string;
  fecha: string;
  paciente?: string;       // id paciente
  especialista: string;   // id especialista
  estadoTurno?: EstadoTurno;
  comentario?: string;
  especialidad?: string;
  habilitado?: boolean;   // indica si el turno está disponible para asignar
  resenia?: string;     // reseña del paciente sobre el especialista
  calificacion?: number; // calificación del paciente sobre el especialista
}

@Injectable({
  providedIn: 'root'
})
export class TurnosService {

  constructor(private supabase: SupabaseService) {}

  async obtenerTurnos(): Promise<TurnoDTO[]> {
    const { data, error } = await this.supabase.getClient()
      .from('turnos')
      .select('*');
      
    if (error) throw error;
    return data as TurnoDTO[];
  }

  async actualizarEstado(id: string, estadoTurno: EstadoTurno): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('turnos')
      .update({ estadoTurno })
      .eq('id', id);

    if(error) throw error;
  }


  /**  ← NUEVO
   *  turnos de un paciente logueado
   */
  async obtenerTurnosPaciente(userId:string): Promise<TurnoDTO[]> {
    // const user = await this.supabase.getClient().auth.getUser();
    // const userId = user.data.user?.id;

    const { data, error } = await this.supabase.getClient()
      .from('turnos')
      .select('*')
      .eq('paciente', userId);

    if(error) throw error;
    return data as TurnoDTO[];
  }


  /**  ← NUEVO
   * turnos asignados a un especialista logueado
   */
  async obtenerTurnosEspecialista(userId:string): Promise<TurnoDTO[]> {
    // const user = await this.supabase.getClient().auth.getUser();
    // const userId = user.data.user?.id;

    const { data, error } = await this.supabase.getClient()
      .from('turnos')
      .select('*')
      .eq('especialista', userId);

    if(error) throw error;
    return data as TurnoDTO[];
  }

  /**
   * Crear un nuevo turno
   */
  async crearTurno(turno: Partial<TurnoDTO>): Promise<TurnoDTO> {
    const { data, error } = await this.supabase.getClient()
      .from('turnos')
      .insert([turno])
      .select()
      .single();

    if (error) throw error;
    return data as TurnoDTO;
  }

  /**
   * Obtener turnos habilitados de un especialista
   * Estos son los turnos que el especialista ha creado y están disponibles para que los pacientes los reserven
   */
  async obtenerTurnosHabilitadosEspecialista(especialistaId: string): Promise<TurnoDTO[]> {
    const { data, error } = await this.supabase.getClient()
      .from('turnos')
      .select('*')
      .eq('especialista', especialistaId)
      //.eq('habilitado', true)
      .order('fecha', { ascending: true });

    if (error) throw error;
    return data as TurnoDTO[];
  }

  /**
   * Actualizar un turno existente (para asignar paciente)
   */
  async actualizarTurno(id: string, turno: Partial<TurnoDTO>): Promise<TurnoDTO> {
    const { data, error } = await this.supabase.getClient()
      .from('turnos')
      .update(turno)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TurnoDTO;
  }

  /**
   * Eliminar turnos múltiples
   */
  async eliminarTurnos(ids: string[]): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('turnos')
      .delete()
      .in('id', ids);

    if (error) throw error;
  }

  /**
   * Obtener turnos disponibles por especialidad y fecha
   */
  async obtenerTurnosDisponibles(especialidad: string, fechaInicio?: string, fechaFin?: string): Promise<TurnoDTO[]> {
    let query = this.supabase.getClient()
      .from('turnos')
      .select('*')
      .eq('especialidad', especialidad)
      .eq('habilitado', true)
      .is('paciente', null);

    if (fechaInicio) {
      query = query.gte('fecha', fechaInicio);
    }
    if (fechaFin) {
      query = query.lte('fecha', fechaFin);
    }

    const { data, error } = await query.order('fecha', { ascending: true });

    if (error) throw error;
    return data as TurnoDTO[];
  }

}
