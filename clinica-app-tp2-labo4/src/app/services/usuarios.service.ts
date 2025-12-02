// usuarios.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { UsuarioDTO } from '../models/usuario';
import { map } from 'rxjs/operators';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private table = 'usuarios-datos';

  constructor(private supabaseService: SupabaseService) { }

  // Obtener todos los usuarios
  getAll(): Observable<UsuarioDTO[]> {
    return from(this.supabaseService.getClient()
      .from(this.table)
      .select('*')
    ).pipe(
      map(res => res.data || [])
    );
  }

  // Obtener pacientes
  getPacientes(): Observable<UsuarioDTO[]> {
    return from(this.supabaseService.getClient()
      .from(this.table)
      .select('*')
      .eq('tipoUsuario', 'paciente')
    ).pipe(map(res => res.data || []));
  }

  // Obtener especialistas
  getEspecialistas(): Observable<UsuarioDTO[]> {
    return from(this.supabaseService.getClient()
      .from(this.table)
      .select('*')
      .neq('tipoUsuario', 'paciente')
      .neq('tipoUsuario', 'admin')
    ).pipe(map(res => res.data || []));
  }

  // Crear usuario
  create(usuario: UsuarioDTO): Observable<UsuarioDTO | null> {
    return from(this.supabaseService.getClient()
      .from(this.table)
      .insert([usuario])
    ).pipe(map(res => (res.data && res.data[0]) || null));
  }

  // Actualizar usuario
  update(usuario: UsuarioDTO): Observable<UsuarioDTO | null> {
    return from(this.supabaseService.getClient()
      .from(this.table)
      .update(usuario)
      .eq('id', usuario.id)
    ).pipe(map(res => (res.data && res.data[0]) || null));
  }

  // Eliminar usuario
  delete(id: string): Observable<void> {
    return from(this.supabaseService.getClient()
      .from(this.table)
      .delete()
      .eq('id', id)
    ).pipe(map(() => { }));
  }

  // Habilitar / deshabilitar especialista
  toggleHabilitado(usuario: UsuarioDTO): Observable<UsuarioDTO | null> {
    return from(this.supabaseService.getClient()
      .from(this.table)
      .update({ habilitado: !usuario.habilitado })
      .eq('id', usuario.id)
    ).pipe(map(res => (res.data && res.data[0]) || null));
  }

  // Actualizar campo captcha
  updateCaptcha(id: string, captcha: boolean): Observable<UsuarioDTO | null> {
    return from(this.supabaseService.getClient()
      .from(this.table)
      .update({ captcha: captcha })
      .eq('id', id)
    ).pipe(map(res => (res.data && res.data[0]) || null));
  }

  // Verificar si un email ya existe
  verificarEmailExiste(email: string): Observable<boolean> {
    return from(this.supabaseService.getClient()
      .from(this.table)
      .select('email')
      .eq('email', email)
      .maybeSingle()
    ).pipe(
      map(res => res.data !== null)
    );
  }
}
