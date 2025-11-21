import { Component, OnDestroy, OnInit,  } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { UsuarioDTO } from '../models/usuario';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from "@angular/material/icon";
import { MatSidenavContent, MatSidenavContainer, MatSidenav, MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule  } from "@angular/material/list";


@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [MatToolbarModule, RouterLink, NgIf, MatButtonModule, MatIcon, MatSidenavContent, RouterOutlet, MatSidenavContainer, MatSidenav, MatListModule ,MatSidenavModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {
  userSub: Subscription | undefined;
  userSession: UsuarioDTO | null = null;
  avatarUser = 'assets/panda.png';
  opened = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userSub = this.authService.getUser().subscribe(user => {
      debugger
      this.userSession = user;
      //console.log('User Session:', this.userSession);
    });
    debugger
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  logout() {
    this.authService.logout().then(() => {
      console.log('User logged out');
    }).catch(error => {
      console.error('Logout error:', error);
    });
  }
}