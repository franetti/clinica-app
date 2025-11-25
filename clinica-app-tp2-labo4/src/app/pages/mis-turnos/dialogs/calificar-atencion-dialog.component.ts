import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TurnoDTO } from '../../../services/turnos.service';

interface TurnoConNombres extends TurnoDTO {
  nombreEspecialista?: string;
}

@Component({
  selector: 'app-calificar-atencion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
  <div style="margin:15px;">
    <h2 mat-dialog-title>
      Calificar Atención
    </h2>
    
    <mat-dialog-content>
      <div class="turno-info">
        <p><strong>Especialista:</strong> {{ data.turno.nombreEspecialista }}</p>
        <p><strong>Especialidad:</strong> {{ data.turno.especialidad }}</p>
        <p><strong>Fecha:</strong> {{ formatearFecha(data.turno.fecha) }}</p>
      </div>

      <div class="calificacion-section">
        <h3>Calificación</h3>
        <div class="estrellas">
          <mat-icon
            *ngFor="let star of [1, 2, 3, 4, 5]"
            [class.filled]="star <= calificacion"
            [class.hover]="star <= hoverStar"
            (click)="setCalificacion(star)"
            (mouseenter)="hoverStar = star"
            (mouseleave)="hoverStar = 0">
            {{ star <= calificacion ? 'star' : 'star_border' }}
          </mat-icon>
        </div>
        <p class="calificacion-texto" *ngIf="calificacion > 0">
          {{ getCalificacionTexto() }}
        </p>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Comentario sobre la atención</mat-label>
        <textarea
          matInput
          [(ngModel)]="resenia"
          rows="4"
          placeholder="Cuéntenos sobre su experiencia con el especialista..."
          required>
        </textarea>
      </mat-form-field>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancelar()">
        Cancelar
      </button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!calificacion || !resenia || resenia.trim().length < 15"
        (click)="onConfirmar()">
        Enviar Calificación
      </button>
    </mat-dialog-actions>
    </div>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #ffc107;
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
      border-left: 4px solid #ffc107;
      p {
        margin: 0.5rem 0;
        color: #424242;
        strong {
          color: #212121;
        }
      }
    }

    .calificacion-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #fffbf0;
      border-radius: 8px;
      h3 {
        margin: 0 0 0.5rem 0;
        color: #424242;
        font-size: 1rem;
      }
      .instruccion {
        margin: 0 0 1rem 0;
        font-size: 0.9rem;
        color: #666;
      }
    }

    .estrellas {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      margin-bottom: 0.75rem;
      mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: #ddd;
        cursor: pointer;
        transition: all 0.3s ease;
        &.filled, &.hover {
          color: #ffc107;
          transform: scale(1.1);
        }
        &:hover {
          transform: scale(1.2);
        }
      }
    }

    .calificacion-texto {
      text-align: center;
      font-size: 1.1rem;
      font-weight: 500;
      color: #ffc107;
      margin: 0.5rem 0 0 0;
    }

    .full-width {
      width: 100%;
    }

    mat-dialog-actions {
      padding: 1rem 0 0;
      gap: 0.5rem;
      button mat-icon {
        margin-right: 0.5rem;
      }
    }
  `]
})
export class CalificarAtencionDialogComponent {
  calificacion: number = 0;
  hoverStar: number = 0;
  resenia: string = '';

  constructor(
    public dialogRef: MatDialogRef<CalificarAtencionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { turno: TurnoConNombres }
  ) { }

  setCalificacion(star: number): void {
    this.calificacion = star;
  }

  getCalificacionTexto(): string {
    const textos = [
      '',
      'Muy Mala',
      'Mala',
      'Regular',
      'Buena',
      'Muy Buena',
      'Excelente'
    ];
    return textos[this.calificacion] || '';
  }

  onCancelar(): void {
    this.dialogRef.close();
  }

  onConfirmar(): void {
    if (this.calificacion && this.resenia && this.resenia.trim().length >= 15) {
      this.dialogRef.close({
        calificacion: this.calificacion,
        resenia: this.resenia.trim()
      });
    }
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
}

