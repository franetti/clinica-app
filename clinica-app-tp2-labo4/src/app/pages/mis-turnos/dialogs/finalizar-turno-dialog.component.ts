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
  nombrePaciente?: string;
}

@Component({
  selector: 'app-finalizar-turno-dialog',
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
    <h2 mat-dialog-title>
      <mat-icon>done_all</mat-icon>
      Finalizar Turno
    </h2>
    
    <mat-dialog-content>
      <div class="turno-info">
        <p><strong>Paciente:</strong> {{ data.turno.nombrePaciente }}</p>
        <p><strong>Especialidad:</strong> {{ data.turno.especialidad }}</p>
        <p><strong>Fecha:</strong> {{ formatearFecha(data.turno.fecha) }}</p>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Reseña de la consulta y diagnóstico</mat-label>
        <textarea
          matInput
          [(ngModel)]="comentario"
          rows="6"
          placeholder="Ingrese el diagnóstico, tratamiento recomendado y observaciones de la consulta..."
          required>
        </textarea>
        <mat-icon matPrefix>description</mat-icon>
        <mat-hint>Esta reseña quedará registrada en el turno</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancelar()">
        <mat-icon>close</mat-icon>
        Volver
      </button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!comentario || comentario.trim().length < 20"
        (click)="onConfirmar()">
        <mat-icon>done_all</mat-icon>
        Finalizar Turno
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #4caf50;
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
      border-left: 4px solid #4caf50;
      p {
        margin: 0.5rem 0;
        color: #424242;
        strong {
          color: #212121;
        }
      }
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
export class FinalizarTurnoDialogComponent {
  comentario: string = '';

  constructor(
    public dialogRef: MatDialogRef<FinalizarTurnoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { turno: TurnoConNombres }
  ) {}

  onCancelar(): void {
    this.dialogRef.close();
  }

  onConfirmar(): void {
    if (this.comentario && this.comentario.trim().length >= 20) {
      this.dialogRef.close(this.comentario.trim());
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

