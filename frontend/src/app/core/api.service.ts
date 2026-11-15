import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Agenda, CuentaNueva, EstadoMesa, EstadoReserva, Mesa, MesaLibre, MesaSolicitud, Perfil, Producto,
  ProductoSolicitud, Reserva, ReservaSolicitud, Seccion, SeccionSolicitud, ZonaMesa,
} from './modelos';

/** Único punto de acceso a la API REST. Las rutas son relativas: mismo origen en producción y proxy en desarrollo. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  // ---------------------------------------------------------- catálogo público
  readonly catalogo = {
    secciones: () => this.http.get<Seccion[]>('/api/catalogo/secciones'),
    productos: () => this.http.get<Producto[]>('/api/catalogo/productos'),
    agenda: (fecha: string, personas: number, zona?: ZonaMesa | null) =>
      this.http.get<Agenda>('/api/catalogo/agenda', { params: this.params({ fecha, personas, zona }) }),
    mesasLibres: (fecha: string, hora: string, personas: number, zona?: ZonaMesa | null) =>
      this.http.get<MesaLibre[]>('/api/catalogo/mesas-libres', { params: this.params({ fecha, hora, personas, zona }) }),
  };

  // ---------------------------------------------------------- reservas
  readonly reservas = {
    crear: (s: ReservaSolicitud) => this.http.post<Reserva>('/api/reservas', s),
    mias: () => this.http.get<Reserva[]>('/api/reservas/mias'),
    cancelar: (id: number) => this.http.patch<Reserva>(`/api/reservas/${id}/cancelar`, {}),
    listar: (desde: string, hasta: string) =>
      this.http.get<Reserva[]>('/api/reservas', { params: this.params({ desde, hasta }) }),
    cambiarEstado: (id: number, estado: EstadoReserva) =>
      this.http.patch<Reserva>(`/api/reservas/${id}/estado`, { estado }),
  };

  // ---------------------------------------------------------- administración
  readonly secciones = this.crud<Seccion, SeccionSolicitud>('/api/secciones');
  readonly productos = this.crud<Producto, ProductoSolicitud>('/api/productos');
  readonly mesas = {
    ...this.crud<Mesa, MesaSolicitud>('/api/mesas'),
    cambiarEstado: (id: number, estado: EstadoMesa) => this.http.patch<Mesa>(`/api/mesas/${id}/estado`, { estado }),
  };
  readonly cuentas = {
    listar: () => this.http.get<Perfil[]>('/api/cuentas'),
    crear: (c: CuentaNueva) => this.http.post<Perfil>('/api/cuentas', c),
    cambiarEstado: (id: number, activa: boolean) => this.http.patch<Perfil>(`/api/cuentas/${id}/estado`, { activa }),
  };

  private crud<T, S>(base: string) {
    return {
      listar: (): Observable<T[]> => this.http.get<T[]>(base),
      crear: (s: S): Observable<T> => this.http.post<T>(base, s),
      actualizar: (id: number, s: S): Observable<T> => this.http.put<T>(`${base}/${id}`, s),
      eliminar: (id: number): Observable<void> => this.http.delete<void>(`${base}/${id}`),
    };
  }

  private params(valores: Record<string, string | number | null | undefined>): HttpParams {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(valores)) {
      if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v));
    }
    return p;
  }
}
