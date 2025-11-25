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
            },
            {
                path: 'turnos',
                loadComponent: () => import('./pages/turnos-admin/turnos-admin.component').then(m => m.TurnosAdminComponent),
            },
            {
                path: 'estadisticas',
                loadComponent: () => import('./pages/estadisticas/estadisticas.component').then(m => m.EstadisticasComponent),
            },
            {
                path: 'login',
                loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
                canDeactivate: []
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
                path: 'mi-perfil',
                loadComponent: () => import('./pages/mi-perfil/mi-perfil.component').then(m => m.MiPerfilComponent),
            },
            {
                path: 'pacientes',
                loadComponent: () => import('./pages/pacientes/pacientes.component').then(m => m.PacientesComponent),
            },

            {
                path: '',
                redirectTo: 'home',
                pathMatch: 'full'
            }
        ]
    }
];
