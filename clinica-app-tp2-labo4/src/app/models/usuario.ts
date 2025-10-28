export type UsuarioDTO = {
  id?: string;
  nombre: string;
  apellido: string;
  edad: number;
  dni: string;
  email: string;
  password: string;
  tipoUsuario: 'paciente' | 'especialista' | 'admin';
  imagen: File;
  imagen2?: File;
  obraSocial?: string;  
  especialidad?: string;  
  habilitado?: boolean;
  fechaCreacion?: Date;
}