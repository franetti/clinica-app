import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TurnoDTO } from '../../../services/turnos.service';
import { HistoriaClinicaService, DatoDinamico } from '../../../services/historia-clinica.service';

interface TurnoConNombres extends TurnoDTO {
  nombrePaciente?: string;
}

interface CampoRango {
  clave: string;
  valor: number;
}

interface CampoNumerico {
  clave: string;
  valor: number;
}

interface CampoSwitch {
  clave: string;
  valor: boolean;
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
    MatIconModule,
    MatDividerModule,
    MatSlideToggleModule
  ],
  template: `
  <div style="overflow:hidden;">
    <h2 mat-dialog-title>
      Finalizar Turno
    </h2>
    
    <mat-dialog-content>
      <div class="turno-info">
        <p><strong>Paciente:</strong> {{ data.turno.nombrePaciente }}</p>
        <p><strong>Especialidad:</strong> {{ data.turno.especialidad }}</p>
        <p><strong>Fecha:</strong> {{ formatearFecha(data.turno.fecha) }}</p>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Reseña de la consulta</mat-label>
        <textarea
          matInput
          [(ngModel)]="comentario"
          rows="6"
          placeholder="Ingrese reseña,comentario o diagnostico de la consulta..."
          required>
        </textarea>
      </mat-form-field>

      <mat-divider style="margin: 1.5rem 0;"></mat-divider>

      <h3 style="margin: 1rem 0; color: #4caf50;">
        Historia Clínica
      </h3>

      <div class="historia-clinica-section">
        <h4>Datos Fijos</h4>
        <div class="datos-fijos-grid">
          <mat-form-field appearance="outline">
            <mat-label>Altura (cm)</mat-label>
            <input matInput type="text" [(ngModel)]="altura" placeholder="Ej: 175">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Peso (kg)</mat-label>
            <input matInput type="text" [(ngModel)]="peso" placeholder="Ej: 70">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Temperatura (°C)</mat-label>
            <input matInput type="text" [(ngModel)]="temperatura" placeholder="Ej: 36.5">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Presión (mmHg)</mat-label>
            <input matInput type="text" [(ngModel)]="presion" placeholder="Ej: 120/80">
          </mat-form-field>
        </div>

        <h4>Campos Especiales</h4>
        <div class="campos-especiales-section">
          <!-- Campo Rango -->
          <div class="campo-especial-item" *ngIf="campoRango">
            <div class="campo-especial-header">
              <span class="campo-tipo">Campo Rango (0-100)</span>
              <button mat-icon-button color="warn" (click)="eliminarCampoRango()">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
            <div class="campo-especial-content">
              <mat-form-field appearance="outline" style="flex: 1;">
                <mat-label>Clave</mat-label>
                <input matInput [(ngModel)]="campoRango.clave" placeholder="Ej: nivel_dolor" required>
              </mat-form-field>
              <div style="flex: 1; padding: 0 1rem;">
                <label style="display: block; margin-bottom: 0.5rem;">Valor: {{ campoRango.valor }}</label>
                <input 
                  type="range" 
                  [(ngModel)]="campoRango.valor"
                  min="0" 
                  max="100" 
                  step="1"
                  style="width: 100%;">
              </div>
            </div>
          </div>
          <button 
            *ngIf="!campoRango"
            mat-stroked-button 
            color="primary" 
            (click)="crearCampoRango()"
            style="margin-bottom: 1rem;">
            <mat-icon>add</mat-icon>
            Crear Campo Rango
          </button>

          <!-- Campo Numérico -->
          <div class="campo-especial-item" *ngIf="campoNumerico">
            <div class="campo-especial-header">
              <span class="campo-tipo">Campo Numérico</span>
              <button mat-icon-button color="warn" (click)="eliminarCampoNumerico()">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
            <div class="campo-especial-content">
              <mat-form-field appearance="outline" style="flex: 1;">
                <mat-label>Clave</mat-label>
                <input matInput [(ngModel)]="campoNumerico.clave" placeholder="Ej: frecuencia_cardiaca" required>
              </mat-form-field>
              <mat-form-field appearance="outline" style="flex: 1;">
                <mat-label>Valor</mat-label>
                <input matInput type="number" [(ngModel)]="campoNumerico.valor" placeholder="Ej: 75" required>
              </mat-form-field>
            </div>
          </div>
          <button 
            *ngIf="!campoNumerico"
            mat-stroked-button 
            color="primary" 
            (click)="crearCampoNumerico()"
            style="margin-bottom: 1rem;">
            <mat-icon>add</mat-icon>
            Crear Campo Numérico
          </button>

          <!-- Campo Switch -->
          <div class="campo-especial-item" *ngIf="campoSwitch">
            <div class="campo-especial-header">
              <span class="campo-tipo">Campo Sí/No</span>
              <button mat-icon-button color="warn" (click)="eliminarCampoSwitch()">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
            <div class="campo-especial-content">
              <mat-form-field appearance="outline" style="flex: 1;">
                <mat-label>Clave</mat-label>
                <input matInput [(ngModel)]="campoSwitch.clave" placeholder="Ej: alergia_medicamentos" required>
              </mat-form-field>
              <div style="flex: 1; display: flex; align-items: center; padding: 0 1rem;">
                <mat-slide-toggle [(ngModel)]="campoSwitch.valor" color="primary">
                  {{ campoSwitch.valor ? 'Sí' : 'No' }}
                </mat-slide-toggle>
              </div>
            </div>
          </div>
          <button 
            *ngIf="!campoSwitch"
            mat-stroked-button 
            color="primary" 
            (click)="crearCampoSwitch()"
            style="margin-bottom: 1rem;">
            <mat-icon>add</mat-icon>
            Crear Campo Sí/No
          </button>
        </div>

        <mat-divider style="margin: 1.5rem 0;"></mat-divider>

        <h4>Otros Datos Dinámicos (máximo 3)</h4>
        <div class="datos-dinamicos-section">
          <div *ngFor="let dato of datosDinamicos; let i = index" class="dato-dinamico-item">
            <mat-form-field appearance="outline" style="flex: 1;">
              <mat-label>Clave</mat-label>
              <input matInput [(ngModel)]="dato.clave" placeholder="Ej: caries">
            </mat-form-field>
            <mat-form-field appearance="outline" style="flex: 1;">
              <mat-label>Valor</mat-label>
              <input matInput [(ngModel)]="dato.valor" placeholder="Ej: 4">
            </mat-form-field>
            <button mat-icon-button color="warn" (click)="eliminarDatoDinamico(i)" *ngIf="datosDinamicos.length > 0">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
          <button 
            mat-stroked-button 
            color="primary" 
            (click)="agregarDatoDinamico()"
            [disabled]="datosDinamicos.length >= 3"
            style="margin-top: 0.5rem;">
            Agregar Dato Dinámico
          </button>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancelar()">
        Volver
      </button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!puedeFinalizar()"
        (click)="onConfirmar()">
        Finalizar Turno
      </button>
    </mat-dialog-actions>
  </div>
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
      min-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
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

    .historia-clinica-section {
      margin-top: 1.5rem;
      h4 {
        margin: 1rem 0 0.5rem 0;
        color: #424242;
        font-size: 1rem;
      }
    }

    .datos-fijos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .campos-especiales-section {
      margin-bottom: 1.5rem;
      .campo-especial-item {
        background: #f9f9f9;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
      }
      .campo-especial-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        .campo-tipo {
          font-weight: 600;
          color: #4caf50;
        }
      }
      .campo-especial-content {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
    }

    .datos-dinamicos-section {
      .dato-dinamico-item {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 0.5rem;
      }
    }
  `]
})
export class FinalizarTurnoDialogComponent {
  comentario: string = '';
  altura: string = '';
  peso: string = '';
  temperatura: string = '';
  presion: string = '';
  datosDinamicos: DatoDinamico[] = [];
  campoRango: CampoRango | null = null;
  campoNumerico: CampoNumerico | null = null;
  campoSwitch: CampoSwitch | null = null;

  constructor(
    public dialogRef: MatDialogRef<FinalizarTurnoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { turno: TurnoConNombres },
    private historiaClinicaService: HistoriaClinicaService
  ) { }

  agregarDatoDinamico(): void {
    if (this.datosDinamicos.length < 3) {
      this.datosDinamicos.push({ clave: '', valor: '' });
    }
  }

  eliminarDatoDinamico(index: number): void {
    this.datosDinamicos.splice(index, 1);
  }

  crearCampoRango(): void {
    this.campoRango = { clave: '', valor: 50 };
  }

  eliminarCampoRango(): void {
    this.campoRango = null;
  }

  crearCampoNumerico(): void {
    this.campoNumerico = { clave: '', valor: 0 };
  }

  eliminarCampoNumerico(): void {
    this.campoNumerico = null;
  }

  crearCampoSwitch(): void {
    this.campoSwitch = { clave: '', valor: false };
  }

  eliminarCampoSwitch(): void {
    this.campoSwitch = null;
  }


  puedeFinalizar(): boolean {
    // Validar comentario
    if (!this.comentario || this.comentario.trim().length < 20) {
      return false;
    }

    // Validar campos especiales si están creados
    if (this.campoRango && !this.campoRango.clave.trim()) {
      return false;
    }
    if (this.campoNumerico && !this.campoNumerico.clave.trim()) {
      return false;
    }
    if (this.campoSwitch && !this.campoSwitch.clave.trim()) {
      return false;
    }

    return true;
  }

  onCancelar(): void {
    this.dialogRef.close();
  }

  onConfirmar(): void {
    if (this.comentario && this.comentario.trim().length >= 20) {
      // Validar campos especiales
      if (this.campoRango && !this.campoRango.clave.trim()) {
        return; // No permitir guardar sin clave
      }
      if (this.campoNumerico && !this.campoNumerico.clave.trim()) {
        return; // No permitir guardar sin clave
      }
      if (this.campoSwitch && !this.campoSwitch.clave.trim()) {
        return; // No permitir guardar sin clave
      }

      // Filtrar datos dinámicos vacíos
      const datosDinamicosValidos = this.datosDinamicos.filter(d => d.clave.trim() && d.valor.trim());

      // Agregar campos especiales a los datos dinámicos
      const todosLosDatos: DatoDinamico[] = [...datosDinamicosValidos];

      if (this.campoRango && this.campoRango.clave.trim()) {
        todosLosDatos.push({
          clave: this.campoRango.clave.trim(),
          valor: `${this.campoRango.valor}`
        });
      }

      if (this.campoNumerico && this.campoNumerico.clave.trim()) {
        todosLosDatos.push({
          clave: this.campoNumerico.clave.trim(),
          valor: `${this.campoNumerico.valor}`
        });
      }

      if (this.campoSwitch && this.campoSwitch.clave.trim()) {
        todosLosDatos.push({
          clave: this.campoSwitch.clave.trim(),
          valor: this.campoSwitch.valor ? 'si' : 'no'
        });
      }

      const resultado = {
        comentario: this.comentario.trim(),
        historiaClinica: {
          idPaciente: this.data.turno.paciente!,
          idEspecialista: this.data.turno.especialista,
          altura: this.altura.trim(),
          peso: this.peso.trim(),
          temperatura: this.temperatura.trim(),
          presion: this.presion.trim(),
          dinamicos: this.historiaClinicaService.convertirDatosDinamicos(todosLosDatos)
        }
      };

      this.dialogRef.close(resultado);
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

