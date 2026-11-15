import { HttpErrorResponse } from '@angular/common/http';
import { EstadoMesa, EstadoReserva, RespuestaError, Rol, TipoMesa, ZonaMesa } from './modelos';

/** Etiquetas legibles y clases visuales para los valores de la API. */

export const ZONAS: Record<ZonaMesa, string> = { INTERIOR: 'Salón interior', VEREDA: 'Vereda', BARRA: 'Barra' };
export const TIPOS: Record<TipoMesa, string> = { DOS: 'Para dos', CUATRO: 'Para cuatro', EXTRA: 'Grupo grande' };
export const ROLES: Record<Rol, string> = { ADMIN: 'Administrador', EMPLEADO: 'Empleado', CLIENTE: 'Cliente' };

export const ESTADOS_MESA: Record<EstadoMesa, { texto: string; clase: string }> = {
  DISPONIBLE: { texto: 'Disponible', clase: 'insignia--ok' },
  OCUPADA: { texto: 'Ocupada', clase: 'insignia--error' },
  RESERVADA: { texto: 'Reservada', clase: 'insignia--aviso' },
};

export const ESTADOS_RESERVA: Record<EstadoReserva, { texto: string; clase: string; icono: string }> = {
  PENDIENTE: { texto: 'Pendiente', clase: 'insignia--aviso', icono: 'fa-hourglass-half' },
  CONFIRMADA: { texto: 'Confirmada', clase: 'insignia--ok', icono: 'fa-circle-check' },
  COMPLETADA: { texto: 'Completada', clase: 'insignia--info', icono: 'fa-mug-hot' },
  CANCELADA: { texto: 'Cancelada', clase: 'insignia--neutro', icono: 'fa-ban' },
  NO_ASISTIO: { texto: 'No asistió', clase: 'insignia--error', icono: 'fa-user-xmark' },
};

export const SOLES = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

/** Fecha local en formato yyyy-MM-dd (sin pasar por UTC, que cambiaría el día por la noche). */
export function fechaIso(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function sumarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  return fechaIso(new Date(a, m - 1, d + dias));
}

export function fechaLarga(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  const texto = new Date(a, m - 1, d).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Mensaje legible a partir de un error HTTP de la API. */
export function mensajeDeError(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    const cuerpo = e.error as Partial<RespuestaError> | null;
    if (cuerpo && typeof cuerpo === 'object' && cuerpo.mensaje) {
      const detalles = cuerpo.detalles?.length ? '\n' + cuerpo.detalles.join('\n') : '';
      return cuerpo.mensaje + detalles;
    }
    if (e.status === 0) return 'No hay conexión con el servidor. Revisa tu internet e inténtalo otra vez.';
    if (e.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    if (e.status === 403) return 'No tienes permiso para esta operación.';
    if (e.status === 429) return 'Demasiados intentos. Espera unos minutos.';
  }
  return 'No se pudo completar la operación. Inténtalo nuevamente.';
}
