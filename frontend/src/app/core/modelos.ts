/** Contratos JSON de la API REST de Spring Boot (mismos nombres que los DTO de Java). */

export type Rol = 'ADMIN' | 'EMPLEADO' | 'CLIENTE';

export interface Perfil {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activa: boolean;
}

export interface Seccion {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  activa: boolean;
}

export interface SeccionSolicitud {
  nombre: string;
  slug: string;
  descripcion: string | null;
  activa: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  seccionId: number;
  seccionNombre: string | null;
  seccionSlug: string | null;
  disponible: boolean;
  imagenUrl: string | null;
  etiqueta: string | null;
}

export interface ProductoSolicitud {
  nombre: string;
  descripcion: string | null;
  precio: number;
  seccionId: number;
  disponible: boolean;
  imagenUrl: string | null;
  etiqueta: string | null;
}

export type TipoMesa = 'DOS' | 'CUATRO' | 'EXTRA';
export type ZonaMesa = 'INTERIOR' | 'VEREDA' | 'BARRA';
export type EstadoMesa = 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA';

export interface Mesa {
  id: number;
  numero: number;
  capacidad: number;
  tipo: TipoMesa;
  zona: ZonaMesa;
  estado: EstadoMesa;
}

export type MesaSolicitud = Omit<Mesa, 'id'>;

export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO';

export interface Reserva {
  id: number;
  fecha: string;       // yyyy-MM-dd
  horaInicio: string;  // HH:mm
  horaFin: string;
  personas: number;
  estado: EstadoReserva;
  nota: string | null;
  mesaId: number;
  mesaNumero: number;
  mesaZona: ZonaMesa;
  mesaCapacidad: number;
  clienteNombre: string;
  clienteEmail: string;
  creadoEn: string;
}

export interface ReservaSolicitud {
  fecha: string;
  hora: string;
  personas: number;
  mesaId?: number | null;
  zona?: ZonaMesa | null;
  nota?: string | null;
}

export interface Turno {
  hora: string;
  mesasLibres: number;
}

export interface Agenda {
  fecha: string;
  apertura: string;
  cierre: string;
  duracionMinutos: number;
  turnos: Turno[];
}

export interface MesaLibre {
  id: number;
  numero: number;
  capacidad: number;
  zona: ZonaMesa;
}

export interface CuentaNueva {
  nombre: string;
  email: string;
  clave: string;
  rol: 'ADMIN' | 'EMPLEADO';
}

/** Cuerpo de error que devuelve ManejadorGlobalErrores. */
export interface RespuestaError {
  estado: number;
  error: string;
  mensaje: string;
  detalles?: string[];
}
