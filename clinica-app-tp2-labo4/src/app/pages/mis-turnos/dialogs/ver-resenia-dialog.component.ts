import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TurnoDTO } from '../../../services/turnos.service';

interface TurnoConNombres extends TurnoDTO {
  nombreEspecialista?: string;
  nombrePaciente?: string;
}

@Component({
  selector: 'app-ver-resenia-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>description</mat-icon>
      {{ data.rol === 'paciente' ? 'Reseña del Especialista' : 'Comentario del Turno' }}
    </h2>
    
    <mat-dialog-content>
      <div class="turno-info">
        <p *ngIf="data.rol === 'paciente'"><strong>Especialista:</strong> {{ data.turno.nombreEspecialista }}</p>
        <p *ngIf="data.rol === 'especialista'"><strong>Paciente:</strong> {{ data.turno.nombrePaciente }}</p>
        <p><strong>Especialidad:</strong> {{ data.turno.especialidad }}</p>
        <p><strong>Fecha:</strong> {{ formatearFecha(data.turno.fecha) }}</p>
        <p><strong>Estado:</strong> <span [class]="getEstadoClass()">{{ getEstadoTexto() }}</span></p>
      </div>

      <div class="resenia-container">
        <h3>
          <mat-icon>comment</mat-icon>
          {{ data.turno.comentario ? 'Comentario:' : 'Reseña:' }}
        </h3>
        <div class="resenia-content">
          {{ data.turno.comentario || data.turno.resenia }}
        </div>
      </div>

      <div *ngIf="data.turno.calificacion" class="calificacion-container">
        <h3>
          <mat-icon>star</mat-icon>
          Calificación del Paciente:
        </h3>
        <div class="estrellas">
          <mat-icon *ngFor="let star of getEstrellas()" [class.filled]="star">
            {{ star ? 'star' : 'star_border' }}
          </mat-icon>
        </div>
        <p *ngIf="data.turno.resenia" class="resenia-paciente">{{ data.turno.resenia }}</p>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" (click)="onCerrar()">
        <mat-icon>close</mat-icon>
        Cerrar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #2196f3;
      mat-icon {
        font-size: 1.8rem;
        width: 1.8rem;
        height: 1.8rem;
      }
    }

    mat-dialog-content {
      padding: 1.5rem 0;
      min-width: 500px;
    }

    .turno-info {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      border-left: 4px solid #2196f3;
      p {
        margin: 0.5rem 0;
        color: #424242;
        strong {
          color: #212121;
        }
      }
    }

    .resenia-container, .calificacion-container {
      margin-top: 1.5rem;
      h3 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #424242;
        margin-bottom: 1rem;
        mat-icon {
          font-size: 1.3rem;
          width: 1.3rem;
          height: 1.3rem;
          color: #2196f3;
        }
      }
    }

    .resenia-content {
      background: #fff3cd;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
      line-height: 1.6;
      color: #212529;
      white-space: pre-wrap;
    }

    .estrellas {
      display: flex;
      gap: 0.25rem;
      mat-icon {
        font-size: 2rem;
        width: 2rem;
        height: 2rem;
        color: #ccc;
        &.filled {
          color: #ffc107;
        }
      }
    }

    .resenia-paciente {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #f5f5f5;
      border-radius: 6px;
      font-style: italic;
      color: #666;
    }

    mat-dialog-actions {
      padding: 1rem 0 0;
      button mat-icon {
        margin-right: 0.5rem;
      }
    }
  `]
})
export class VerReseniaDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<VerReseniaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { turno: TurnoConNombres, rol: 'paciente' | 'especialista' }
  ) {}

  onCerrar(): void {
    this.dialogRef.close();
  }

  formatearFecha(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoClass(): string {
    return `estado-${this.data.turno.estadoTurno || 'pendiente'}`;
  }

  getEstadoTexto(): string {
    const estados: any = {
      'pendiente': 'Pendiente',
      'aceptado': 'Aceptado',
      'realizado': 'Realizado',
      'cancelado': 'Cancelado',
      'rechazado': 'Rechazado'
    };
    return estados[this.data.turno.estadoTurno || 'pendiente'];
  }

  getEstrellas(): boolean[] {
    const calificacion = this.data.turno.calificacion || 0;
    return Array(6).fill(false).map((_, i) => i < calificacion);
  }
}

