import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, HostListener } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { UsuarioDTO } from '../models/usuario';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from "@angular/material/icon";
import { MatSidenavContent, MatSidenavContainer, MatSidenav, MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [MatToolbarModule, RouterLink, NgIf, MatButtonModule, MatIcon, MatSidenavContent, RouterOutlet, MatSidenavContainer, MatSidenav, MatListModule, MatSidenavModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  userSub: Subscription | undefined;
  routerSub: Subscription | undefined;
  userSession: UsuarioDTO | null = null;
  avatarUser = 'assets/panda.png';
  opened = false;
  currentRoute: string = '';
  shouldShowBackground: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userSub = this.authService.getUser().subscribe(user => {
      debugger
      this.userSession = user;
      //console.log('User Session:', this.userSession);
    });
    debugger

    // Suscribirse a los cambios de ruta
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
      this.updateBackgroundVisibility();
    });

    // Verificar la ruta inicial
    this.currentRoute = this.router.url;
    this.updateBackgroundVisibility();
  }

  updateBackgroundVisibility(): void {
    // Rutas que NO deben tener fondo
    const excludedRoutes = ['/home', '/login', '/register', 'home', 'login', 'register'];
    // Normalizar la ruta (remover query params y fragmentos)
    const normalizedRoute = this.currentRoute.split('?')[0].split('#')[0];
    this.shouldShowBackground = !excludedRoutes.some(route => normalizedRoute === route || normalizedRoute === `/${route}`);
  }

  ngAfterViewInit(): void {
    // Sincronizar el estado del sidenav
    if (this.sidenav) {
      this.sidenav.openedChange.subscribe(opened => {
        this.opened = opened;
      });
    }
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  logout() {
    this.authService.logout().then(() => {
      console.log('User logged out');
    }).catch(error => {
      console.error('Logout error:', error);
    });
  }

  toggleSidenav(event: Event): void {
    event.stopPropagation();
    if (this.sidenav) {
      this.sidenav.toggle();
      this.opened = this.sidenav.opened;
    }
  }

  onSidenavContentClick(event: MouseEvent): void {
    // Si el sidenav está abierto y se hace clic en el contenido, cerrarlo
    if (this.opened && this.sidenav) {
      const target = event.target as HTMLElement;
      const sidenavElement = document.querySelector('mat-sidenav');

      // Verificar que el clic no fue dentro del sidenav
      if (sidenavElement && !sidenavElement.contains(target)) {
        this.sidenav.close();
        this.opened = false;
      }
    }
  }
}