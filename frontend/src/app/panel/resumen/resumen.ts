import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Mesa, Perfil, Producto, Reserva } from '../../core/modelos';
import { ESTADOS_RESERVA, ZONAS, fechaCorta, fechaIso, fechaLarga, mensajeDeError, sumarDias } from '../../core/textos';

@Component({
  selector: 'app-resumen',
  imports: [RouterLink],
  styleUrl: '../panel.css',
  template: `
    <div class="encabezado">
      <div><h1>{{ saludo }}, {{ nombre() }}</h1><p>{{ fechaLarga(hoy) }} · así va Café Catorce.</p></div>
      <a routerLink="/admin/reservas" class="btn btn--oscuro"><i class="fa-solid fa-calendar-check"></i> Gestionar reservas</a>
    </div>

    @if (error(); as e) {
      <div class="alerta alerta--error"><i class="fa-solid fa-circle-exclamation"></i>{{ e }}</div>
    } @else {
      <div class="kpis">
        <a routerLink="/admin/reservas" class="tarjeta kpi"><div class="kpi__icono"><i class="fa-solid fa-calendar-day"></i></div>
          <div><strong class="num">{{ cargando() ? '—' : hoyActivas().length }}</strong><span>Reservas para hoy</span></div></a>
        <a routerLink="/admin/reservas" class="tarjeta kpi"><div class="kpi__icono" style="background: var(--aviso-bg); color: var(--aviso)"><i class="fa-solid fa-hourglass-half"></i></div>
          <div><strong class="num">{{ cargando() ? '—' : pendientes() }}</strong><span>Por confirmar (7 días)</span></div></a>
        <a routerLink="/admin/mesas" class="tarjeta kpi"><div class="kpi__icono" style="background: var(--ok-bg); color: var(--ok)"><i class="fa-solid fa-chair"></i></div>
          <div><strong class="num">{{ cargando() ? '—' : libres() + '/' + mesas().length }}</strong><span>Mesas libres ahora</span></div></a>
        <a routerLink="/admin/productos" class="tarjeta kpi"><div class="kpi__icono" style="background: var(--info-bg); color: var(--info)"><i class="fa-solid fa-mug-hot"></i></div>
          <div><strong class="num">{{ cargando() ? '—' : disponibles() + '/' + productos().length }}</strong><span>Productos disponibles</span></div></a>
      </div>

      <div class="rejilla">
        <section class="tarjeta">
          <div class="tarjeta__cabecera"><h2>Próximas 7 días</h2><span class="texto-tenue">reservas activas por día</span></div>
          <div class="grafico">
            @for (d of semana(); track d.fecha) {
              <div class="barra" [attr.aria-label]="d.etiqueta + ': ' + d.total + ' reservas'">
                <span class="barra__valor num">{{ d.total }}</span>
                <div class="barra__cuerpo"><div [style.height.%]="d.pct"></div></div>
                <span class="barra__dia">{{ d.etiqueta }}</span>
              </div>
            }
          </div>
        </section>

        <section class="tarjeta">
          <div class="tarjeta__cabecera"><h2>Hoy en la sala</h2><a routerLink="/admin/reservas" class="texto-tenue">Ver todas</a></div>
          @if (cargando()) {
            <div style="padding: 1rem; display: grid; gap: .5rem">@for (i of [1,2,3]; track i) { <div class="esqueleto" style="height: 44px"></div> }</div>
          } @else if (hoyActivas().length === 0) {
            <div class="vacio"><i class="fa-regular fa-calendar"></i><p>No hay reservas activas para hoy.</p></div>
          } @else {
            <ul class="agenda">
              @for (r of hoyActivas().slice(0, 6); track r.id) {
                <li><strong class="num">{{ r.horaInicio }}</strong>
                  <div><span>{{ r.clienteNombre }}</span><small>{{ r.personas }} pers. · mesa {{ r.mesaNumero }} · {{ ZONAS[r.mesaZona] }}</small></div>
                  <span class="insignia" [class]="'insignia ' + ESTADOS[r.estado].clase">{{ ESTADOS[r.estado].texto }}</span></li>
              }
            </ul>
          }
        </section>
      </div>

      <div class="accesos">
        <a routerLink="/admin/productos" class="tarjeta acceso"><i class="fa-solid fa-mug-hot"></i><div><strong>Carta</strong><span>Precios, fotos y disponibilidad</span></div></a>
        <a routerLink="/admin/mesas" class="tarjeta acceso"><i class="fa-solid fa-chair"></i><div><strong>Sala</strong><span>Estado de las mesas en vivo</span></div></a>
        <a routerLink="/admin/cuentas" class="tarjeta acceso"><i class="fa-solid fa-user-shield"></i><div><strong>Equipo</strong><span>{{ equipo() }} accesos del personal</span></div></a>
        <a routerLink="/" class="tarjeta acceso"><i class="fa-solid fa-store"></i><div><strong>Sitio público</strong><span>Cómo lo ven los clientes</span></div></a>
      </div>
    }
  `,
  styles: `
    a.kpi { transition: transform .15s, box-shadow .15s; } a.kpi:hover { transform: translateY(-2px); box-shadow: var(--sombra); }
    .rejilla { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.25rem; }
    @media (max-width: 1000px) { .rejilla { grid-template-columns: 1fr; } }
    .grafico { display: grid; grid-template-columns: repeat(7, 1fr); gap: .6rem; padding: 1.25rem; height: 250px; }
    .barra { display: grid; grid-template-rows: auto 1fr auto; gap: .35rem; text-align: center; min-width: 0; }
    .barra__valor { font-size: .85rem; font-weight: 700; }
    .barra__cuerpo { display: flex; align-items: flex-end; background: var(--crema-2); border-radius: 8px; overflow: hidden; }
    .barra__cuerpo div { width: 100%; min-height: 4px; background: linear-gradient(180deg, var(--oro), var(--oro-2)); border-radius: 8px 8px 0 0; transition: height .4s; }
    .barra__dia { font-size: .72rem; color: var(--tinta-suave); text-transform: capitalize; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .agenda { padding: .5rem 1.25rem 1rem; }
    .agenda li { display: flex; gap: .9rem; align-items: center; padding: .7rem 0; border-bottom: 1px solid var(--linea); }
    .agenda li:last-child { border-bottom: none; }
    .agenda li > div { flex: 1; display: grid; min-width: 0; }
    .agenda small { color: var(--tinta-tenue); font-size: .8rem; }
    .accesos { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-top: 1.25rem; }
    .acceso { padding: 1.1rem 1.25rem; display: flex; gap: .9rem; align-items: center; transition: transform .15s, box-shadow .15s; }
    .acceso:hover { transform: translateY(-2px); box-shadow: var(--sombra); }
    .acceso i { font-size: 1.2rem; color: var(--oro-2); width: 24px; }
    .acceso strong { display: block; } .acceso span { font-size: .82rem; color: var(--tinta-suave); }
  `,
})
export class ResumenPagina {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  protected readonly ESTADOS = ESTADOS_RESERVA;
  protected readonly ZONAS = ZONAS;
  protected readonly fechaLarga = fechaLarga;
  protected readonly hoy = fechaIso();
  protected readonly saludo = new Date().getHours() < 12 ? 'Buenos días' : new Date().getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';

  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly mesas = signal<Mesa[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  private readonly cuentas = signal<Perfil[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly nombre = computed(() => this.auth.usuario()?.nombre.split(' ')[0] ?? '');
  private readonly activas = computed(() => this.reservas().filter(r => r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA'));
  protected readonly hoyActivas = computed(() => this.activas().filter(r => r.fecha === this.hoy));
  protected readonly pendientes = computed(() => this.reservas().filter(r => r.estado === 'PENDIENTE').length);
  protected readonly libres = computed(() => this.mesas().filter(m => m.estado === 'DISPONIBLE').length);
  protected readonly disponibles = computed(() => this.productos().filter(p => p.disponible).length);
  protected readonly equipo = computed(() => this.cuentas().filter(c => c.rol !== 'CLIENTE').length);
  protected readonly semana = computed(() => {
    const dias = Array.from({ length: 7 }, (_, i) => sumarDias(this.hoy, i));
    const totales = dias.map(f => this.activas().filter(r => r.fecha === f).length);
    const max = Math.max(1, ...totales);
    return dias.map((f, i) => ({ fecha: f, total: totales[i], pct: (totales[i] / max) * 100, etiqueta: i === 0 ? 'Hoy' : fechaCorta(f).split(' ')[0] }));
  });

  constructor() {
    forkJoin([
      this.api.reservas.listar(this.hoy, sumarDias(this.hoy, 6)), this.api.mesas.listar(),
      this.api.productos.listar(), this.api.cuentas.listar(),
    ]).subscribe({
      next: ([r, m, p, c]) => { this.reservas.set(r); this.mesas.set(m); this.productos.set(p); this.cuentas.set(c); this.cargando.set(false); },
      error: e => { this.error.set(mensajeDeError(e)); this.cargando.set(false); },
    });
  }
}
