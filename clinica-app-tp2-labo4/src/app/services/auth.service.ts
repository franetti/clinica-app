import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Router, provideRouter } from '@angular/router';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { UsuarioDTO } from '../models/usuario';
//import { UserData } from '../models/user-data';/
import { SupabaseService } from './supabase.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root',    
})
export class AuthService {       
    private currentUser$ = new BehaviorSubject<UsuarioDTO | null>(null);    
  
    constructor(private router: Router, private supabaseService: SupabaseService, private snackBar: MatSnackBar)        
    {
      this.initSession(); // carga al iniciar
    }
  
    private async initSession() {
        const { data } = await this.supabaseService.getClient().auth.getUser();
        let userData = await this.supabaseService.getClient().from('usuarios-datos')
        .select('*')
        .eq('id', data.user?.id)
        .single();
    
        let user: UsuarioDTO = userData.data as UsuarioDTO;

        this.currentUser$.next(user || null);
    }
  
    getUser(): Observable<UsuarioDTO | null> {
      return this.currentUser$.asObservable();
    }  
    
    log(userId: string, accion: string) { 
        this.supabaseService.getClient()
            .from('Logs')
            .insert([
                { IdUser: userId, descripcion: accion }
            ]).then(({ data, error }) => {
                if (error) {
                    console.error('Error al guardar el log:', error);
                }
            })
    }       

    login(email: string, password: string) {    
        try {
            this.supabaseService.getClient().auth.signInWithPassword({
                email: email,
                password:password
            }).then( async ({ data, error }) => {
                // //TODO TOASTER  
                if (error) {//
                    debugger
                    if(error.message.includes('Invalid login credentials')) {
                        this.snackBar.open('Credenciales invalidas', 'Cerrar', {
                            duration: 3000,
                            horizontalPosition: 'right',
                            verticalPosition: 'bottom',
                            panelClass: ['snack-error']
                        });
                        return
                    }
                    if (error.message.includes('Email not confirmed')) {
                        this.snackBar.open('Email sin verificar', 'Cerrar', {
                            duration: 3000,
                            horizontalPosition: 'right',
                            verticalPosition: 'bottom',
                            panelClass: ['snack-error']
                        });
                        return
                    }                                               
                    console.error('Error:', error.message);
                    this.snackBar.open('Ocurrió un error', 'Cerrar', {
                        duration: 3000,
                        horizontalPosition: 'right',
                        verticalPosition: 'bottom'
                    });
                    
                } else {   
                    
                    await this.getUserData(data.user!.id).then((data) => {
                        if (data != null) {
                            this.currentUser$.next(data);   
                        }
                    });
                    
                    let habilitado = this.esUsuarioHabilitado(this.currentUser$.value!);

                    if(!habilitado) {
                        this.snackBar.open('Usuario no habilitado', 'Cerrar', {
                            duration: 3000,
                            horizontalPosition: 'right',
                            verticalPosition: 'bottom',
                            panelClass: ['snack-error']
                        });
                        this.currentUser$.next(null);
                        this.supabaseService.getClient().auth.signOut();
                        return;
                    }
                    else {
                        this.snackBar.open('Sesión iniciada', 'Cerrar', {
                            duration: 3000,
                            horizontalPosition: 'right',
                            verticalPosition: 'bottom',
                            panelClass: ['snack-exito']
                        });
                        this.router.navigate(['/home']);
                    }                
                }
            });   
        }          
        catch (error) {
            console.error('Error:', error);
        }
    }

    async getUserData(uuid:any): Promise<UsuarioDTO> {
        let userData = await this.supabaseService.getClient().from('usuarios-datos')
            .select('*')
            .eq('id', uuid)
            .single();
        
        let user: UsuarioDTO = userData.data as UsuarioDTO;

        return user;  
    }

    esUsuarioHabilitado(user:UsuarioDTO): boolean {
        if (user && user.tipoUsuario != 'paciente' && user.tipoUsuario != 'admin' && user.habilitado === false) { 
            return false;
        }               
        return true;                 
    }

    async logout(): Promise<void> {                
        await this.supabaseService.getClient().auth.signOut()        
        this.log(this.currentUser$.value?.id!, "Logout");
        this.currentUser$.next(null);            
        this.router.navigate(['/home']);
        //this.toastr.success("", 'Sesión cerrada correctamente');
    }            

    async registrarUsuario(datos: UsuarioDTO) {
        try {
            const { data, error } = await this.supabaseService.getClient().auth.signUp({
                email: datos.email,
                password: datos.password,
            });
    
            if (error) {
                console.error('Error:', error.message);
                if (error.message.includes('User already registered')) {
                    this.snackBar.open('Usuario registrado ya existe', 'Cerrar', {
                        duration: 3000,
                        horizontalPosition: 'right',
                        verticalPosition: 'bottom'
                    });
                } else {
                    this.snackBar.open('Ocurrió un error', 'Cerrar', {
                        duration: 3000,
                        horizontalPosition: 'right',
                        verticalPosition: 'bottom'
                    });
                }
                return;
            }
    
            console.log('User registered:', data.user);
            await this.saveUserData(data.user!, datos);    
        } catch (err) {
            console.error('Error al registrar:', err);
            throw err;
        }
    }

    async saveUserData(user: User, datos: UsuarioDTO) {
        let img1 = null;
        let img2 = null;

        if (datos.imagen) {
            const urlImg = await this.saveFile(datos.imagen);
            if (urlImg) {
                img1 = urlImg;
            }
        }
    
        if (datos.imagen2) {
            const urlImg2 = await this.saveFile(datos.imagen2);
            if (urlImg2) {
                img2 = urlImg2;
            }
        }

        this.supabaseService.getClient().from('usuarios-datos').insert([
            {
                id: user.id, 
                nombre: datos.nombre,
                apellido: datos.apellido,
                edad: datos.edad,
                dni: datos.dni,
                email: datos.email,
                tipoUsuario: datos.tipoUsuario,
                imagen: img1,
                imagen2: img2,
                obraSocial: datos.obraSocial || null,
                especialidad: datos.especialidad || null                
            }
        ]).then(({ data, error }) => {
            if (error) {
                console.error('Error:', error.message);
                this.snackBar.open('Ocurrió un error', 'Cerrar', {
                    duration: 3000,
                    horizontalPosition: 'right',
                    verticalPosition: 'bottom'
                });
            } 
        });            
    }
      
    async saveFile(img: File | string | null | undefined) {
        if (!img) return null;
        img = img as File;
        const ahora = new Date();
        const fechaConMilis = ahora.toISOString();
        const filename = `${fechaConMilis}-${img.name}`;
        
        const { data, error } = await this.supabaseService.getClient()
            .storage
            .from('imagenes')
            .upload(`users/${filename}`, img, {
                cacheControl: '3600',
                upsert: false
            });
        if (error) console.error('Error subiendo imagen:', error.message);

            // Obtener public link
        const { data: publicData } = this.supabaseService.getClient()
            .storage
            .from('imagenes')
            .getPublicUrl(`users/${filename}`);
        
        
                // El enlace público está acá
        const publicUrl = publicData.publicUrl;

        return publicUrl;
    }
}
