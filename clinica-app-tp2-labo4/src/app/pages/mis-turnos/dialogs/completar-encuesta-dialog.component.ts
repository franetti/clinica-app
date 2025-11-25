import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TurnoDTO } from '../../../services/turnos.service';

interface TurnoConNombres extends TurnoDTO {
  nombreEspecialista?: string;
}

@Component({
  selector: 'app-completar-encuesta-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatRadioModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>assignment</mat-icon>
      Completar Encuesta
    </h2>
    
    <mat-dialog-content>
      <div class="turno-info">
        <p><strong>Especialista:</strong> {{ data.turno.nombreEspecialista }}</p>
        <p><strong>Especialidad:</strong> {{ data.turno.especialidad }}</p>
        <p><strong>Fecha:</strong> {{ formatearFecha(data.turno.fecha) }}</p>
      </div>

      <div class="encuesta">
        <div class="pregunta">
          <h3>1. ¿Cómo calificaría la puntualidad del especialista?</h3>
          <mat-radio-group [(ngModel)]="respuestas.puntualidad">
            <mat-radio-button value="excelente">Excelente</mat-radio-button>
            <mat-radio-button value="buena">Buena</mat-radio-button>
            <mat-radio-button value="regular">Regular</mat-radio-button>
            <mat-radio-button value="mala">Mala</mat-radio-button>
          </mat-radio-group>
        </div>

        <div class="pregunta">
          <h3>2. ¿Cómo fue la atención recibida?</h3>
          <mat-radio-group [(ngModel)]="respuestas.atencion">
            <mat-radio-button value="excelente">Excelente</mat-radio-button>
            <mat-radio-button value="buena">Buena</mat-radio-button>
            <mat-radio-button value="regular">Regular</mat-radio-button>
            <mat-radio-button value="mala">Mala</mat-radio-button>
          </mat-radio-group>
        </div>

        <div class="pregunta">
          <h3>3. ¿El especialista explicó claramente el diagnóstico?</h3>
          <mat-radio-group [(ngModel)]="respuestas.claridad">
            <mat-radio-button value="si">Sí</mat-radio-button>
            <mat-radio-button value="parcialmente">Parcialmente</mat-radio-button>
            <mat-radio-button value="no">No</mat-radio-button>
          </mat-radio-group>
        </div>

        <div class="pregunta">
          <h3>4. ¿Recomendaría este especialista?</h3>
          <mat-radio-group [(ngModel)]="respuestas.recomendaria">
            <mat-radio-button value="si">Sí</mat-radio-button>
            <mat-radio-button value="tal-vez">Tal vez</mat-radio-button>
            <mat-radio-button value="no">No</mat-radio-button>
          </mat-radio-group>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Comentarios adicionales (opcional)</mat-label>
          <textarea
            matInput
            [(ngModel)]="respuestas.comentarios"
            rows="3"
            placeholder="Puede dejar comentarios adicionales sobre su experiencia...">
          </textarea>
          <mat-icon matPrefix>comment</mat-icon>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancelar()">
        <mat-icon>close</mat-icon>
        Cancelar
      </button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!formularioCompleto()"
        (click)="onConfirmar()">
        <mat-icon>send</mat-icon>
        Enviar Encuesta
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
      max-height: 70vh;
      overflow-y: auto;
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

    .encuesta {
      .pregunta {
        margin-bottom: 2rem;
        h3 {
          font-size: 0.95rem;
          color: #424242;
          margin-bottom: 0.75rem;
          font-weight: 500;
        }
        mat-radio-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          mat-radio-button {
            margin-left: 1rem;
          }
        }
      }
    }

    .full-width {
      width: 100%;
      margin-top: 1rem;
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
export class CompletarEncuestaDialogComponent {
  respuestas = {
    puntualidad: '',
    atencion: '',
    claridad: '',
    recomendaria: '',
    comentarios: ''
  };

  constructor(
    public dialogRef: MatDialogRef<CompletarEncuestaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { turno: TurnoConNombres }
  ) {}

  onCancelar(): void {
    this.dialogRef.close();
  }

  onConfirmar(): void {
    if (this.formularioCompleto()) {
      this.dialogRef.close(this.respuestas);
    }
  }

  formularioCompleto(): boolean {
    return !!(this.respuestas.puntualidad && 
              this.respuestas.atencion && 
              this.respuestas.claridad && 
              this.respuestas.recomendaria);
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

