import { Routes } from '@angular/router';
import { LayoutWrapperComponent } from './layout/layout-wrapper.component';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { MisTurnosComponent } from './pages/mis-turnos/mis-turnos.component';

export const routes: Routes = [
    {
        path: '',
        component: LayoutWrapperComponent,
        children: [
            {
                path: 'home',
                loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
            },
            {
                path: 'usuarios',
                loadComponent: () => import('./pages/usuarios/usuarios.page').then(m => m.UsuariosPage),
                //meter guard de admin
            },
            {
                path: 'login',
                loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
                 canDeactivate: [] //agregar guard para redirigir si ya esta logueado
            },
            {
                path: 'register',
                loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
            },
            {
                path: 'mis-turnos',
                loadComponent: () => import('./pages/mis-turnos/mis-turnos.component').then(m => m.MisTurnosComponent),
            },
            {
                path: 'solicitar-turno',
                loadComponent: () => import('./pages/solicitar-turno/solicitar-turno.component').then(m => m.SolicitarTurnoComponent),
            },
            
            {
                path: '',
                redirectTo: 'home',
                pathMatch: 'full'
            },
            // {
            // path: '**',
            // redirectTo: 'home' // o a 'pagenotfound'
            // }
        ]
    }
];
