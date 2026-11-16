import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ROLES, ZONAS, fechaCorta } from '../core/textos';
import { AlertasReservasService } from '../core/alertas-reservas';

interface Enlace { ruta: string; texto: string; icono: string; exacto?: boolean; reservas?: boolean; }

@Component({
  selector: 'app-panel-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="panel">
      <aside class="lateral" [class.abierto]="menuAbierto()">
        <a routerLink="/" class="marca"><img src="Image/Café 14 - logo.svg" alt="" width="36" height="36"><span>Café <em>Catorce</em></span></a>
        <span class="lateral__modo">{{ modo() === 'admin' ? 'Administración' : 'Panel del equipo' }}</span>
        <nav aria-label="Panel">
          @for (e of enlaces(); track e.ruta) {
            <a [routerLink]="e.ruta" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: !!e.exacto }">
              <i class="fa-solid" [class]="'fa-solid ' + e.icono"></i> {{ e.texto }}
              @if (e.reservas && alertas.sinVer()) { <span class="globo num" [attr.aria-label]="alertas.sinVer() + ' reservas nuevas'">{{ alertas.sinVer() }}</span> }
            </a>
          }
        </nav>
        <div class="lateral__pie">
          <div class="avisos-ajustes">
            <div class="avisos-ajustes__estado">
              <span class="punto" [class.punto--on]="alertas.conectado()"></span>
              {{ alertas.conectado() ? 'Avisos en vivo' : 'Conectando avisos…' }}
            </div>
            <div class="avisos-ajustes__botones">
              <button type="button" (click)="alertas.alternarSonido()" [class.on]="alertas.sonido()" [attr.aria-pressed]="alertas.sonido()"
                      [title]="alertas.sonido() ? 'Silenciar campana' : 'Activar campana'">
                <i class="fa-solid" [class.fa-bell]="alertas.sonido()" [class.fa-bell-slash]="!alertas.sonido()"></i> Campana
              </button>
              <button type="button" (click)="alertas.alternarVoz()" [class.on]="alertas.voz()" [attr.aria-pressed]="alertas.voz()"
                      [title]="alertas.voz() ? 'Desactivar voz' : 'Activar voz'">
                <i class="fa-solid" [class.fa-volume-high]="alertas.voz()" [class.fa-volume-xmark]="!alertas.voz()"></i> Voz
              </button>            </div>
          </div>
          <a routerLink="/" class="enlace-sitio"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ver sitio público</a>
          @if (auth.usuario(); as u) {
            <div class="usuario">
              <div class="usuario__avatar">{{ u.nombre[0] }}</div>
              <div class="usuario__datos"><strong>{{ u.nombre }}</strong><small>{{ ROLES[u.rol] }}</small></div>
              <button type="button" class="btn-icono" (click)="auth.salir()" aria-label="Cerrar sesión" title="Cerrar sesión">
                <i class="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          }
        </div>
      </aside>
      @if (menuAbierto()) { <div class="velo" (click)="menuAbierto.set(false)"></div> }

      <div class="principal">
        <header class="barra-movil">
          <button type="button" class="btn-icono" (click)="menuAbierto.set(true)" aria-label="Abrir menú"><i class="fa-solid fa-bars"></i></button>
          <span class="marca"><span>Café <em>Catorce</em></span></span>
        </header>
        <main class="contenido"><router-outlet /></main>
      </div>
    </div>

    <div class="alertas" aria-live="assertive">
      @for (a of alertas.alertas(); track a.id) {
        <div class="alerta-reserva" [class.alerta-reserva--cancelada]="a.tipo !== 'NUEVA'" role="alert">
          <div class="alerta-reserva__icono"><i class="fa-solid" [class.fa-bell]="a.tipo === 'NUEVA'" [class.fa-calendar-xmark]="a.tipo !== 'NUEVA'"></i></div>
          <div class="alerta-reserva__texto">
            <span class="alerta-reserva__titulo">{{ a.tipo === 'NUEVA' ? 'Nueva reserva' : 'Reserva cancelada por el cliente' }}</span>
            <strong>{{ a.reserva.clienteNombre }}</strong>
            <span>{{ fechaCorta(a.reserva.fecha) }} · <b class="num">{{ a.reserva.horaInicio }}</b> · {{ a.reserva.personas }} {{ a.reserva.personas === 1 ? 'persona' : 'personas' }}
              · Mesa {{ a.reserva.mesaNumero }} ({{ ZONAS[a.reserva.mesaZona] }})</span>
            @if (a.reserva.nota) { <span class="alerta-reserva__nota"><i class="fa-regular fa-note-sticky"></i> {{ a.reserva.nota }}</span> }
            <div class="alerta-reserva__acciones">
              <a [routerLink]="rutaReservas()" [queryParams]="{ fecha: a.reserva.fecha }" (click)="alertas.cerrar(a.id)" class="btn btn--sm btn--oro">Ver reservas</a>
              <button type="button" class="btn btn--sm btn--fantasma" (click)="alertas.cerrar(a.id)">Entendido</button>
            </div>
          </div>
          <button type="button" class="alerta-reserva__cerrar" (click)="alertas.cerrar(a.id)" aria-label="Cerrar aviso"><i class="fa-solid fa-xmark"></i></button>
        </div>
      }
    </div>
  `,
  styles: `
    .panel { display: grid; grid-template-columns: 260px minmax(0, 1fr); min-height: 100vh; background: #f4efe7; }
    .lateral { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; gap: 1.25rem; padding: 1.25rem 1rem;
      background: var(--espresso); color: var(--crema); }
    .marca { display: inline-flex; align-items: center; gap: .6rem; font-family: var(--serif); font-size: 1.15rem; font-weight: 600; padding: 0 .5rem; }
    .marca img { border-radius: 50%; background: var(--crema); }
    .marca em { color: var(--oro); font-style: italic; }
    .lateral__modo { font-size: .7rem; letter-spacing: .14em; text-transform: uppercase; color: rgba(247,241,231,.45); padding: 0 .6rem; }
    nav { display: grid; gap: .2rem; }
    nav a { display: flex; align-items: center; gap: .75rem; padding: .7rem .8rem; border-radius: 10px; font-size: .92rem; font-weight: 500;
      color: rgba(247,241,231,.72); transition: background .15s, color .15s; }
    nav a i { width: 18px; text-align: center; }
    nav a:hover { background: rgba(255,255,255,.06); color: var(--crema); }
    nav a.activo { background: rgba(212,173,112,.16); color: var(--oro); }
    .lateral__pie { margin-top: auto; display: grid; gap: .8rem; }
    .globo { margin-left: auto; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 11px; display: grid; place-items: center;
      background: #e0533d; color: #fff; font-size: .72rem; font-weight: 700; animation: latir 1.4s ease-in-out infinite; }
    @keyframes latir { 0%,100% { box-shadow: 0 0 0 0 rgba(224,83,61,.55); } 50% { box-shadow: 0 0 0 6px rgba(224,83,61,0); } }
    .avisos-ajustes { display: grid; gap: .5rem; padding: .7rem; border-radius: 12px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); }
    .avisos-ajustes__estado { display: flex; align-items: center; gap: .5rem; font-size: .75rem; color: rgba(247,241,231,.6); }
    .punto { width: 8px; height: 8px; border-radius: 50%; background: #a0907a; }
    .punto--on { background: #4cc38a; box-shadow: 0 0 0 3px rgba(76,195,138,.2); }
    .avisos-ajustes__botones { display: flex; gap: .3rem; }
    .avisos-ajustes__botones button { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: .3rem; padding: .4rem .2rem;
      border-radius: 8px; font-size: .72rem; color: rgba(247,241,231,.55); background: rgba(255,255,255,.04); transition: background .15s, color .15s; }
    .avisos-ajustes__botones button:hover { background: rgba(255,255,255,.09); color: var(--crema); }
    .avisos-ajustes__botones button.on { color: var(--oro); background: rgba(212,173,112,.14); }
    .alertas { position: fixed; top: 1rem; right: 1rem; z-index: 200; display: grid; gap: .7rem; width: min(380px, calc(100vw - 2rem)); }
    .alerta-reserva { position: relative; display: flex; gap: .9rem; padding: 1rem 1.1rem; border-radius: 16px; background: var(--espresso); color: var(--crema);
      box-shadow: 0 18px 40px rgba(20,15,11,.35); border: 1px solid rgba(212,173,112,.35); animation: entrar .45s cubic-bezier(.2,.9,.3,1.3); }
    .alerta-reserva--cancelada { background: #fff; color: var(--tinta); border-color: var(--linea-fuerte); }
    @keyframes entrar { from { opacity: 0; transform: translateX(40px) scale(.96); } to { opacity: 1; transform: none; } }
    .alerta-reserva__icono { flex: none; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--oro); color: #1a1206; font-size: 1.15rem; }
    .alerta-reserva:not(.alerta-reserva--cancelada) .alerta-reserva__icono i { animation: sonar 1s ease-in-out 3; transform-origin: 50% 10%; }
    .alerta-reserva--cancelada .alerta-reserva__icono { background: var(--crema-2); color: var(--tinta-suave); }
    @keyframes sonar { 0%,100% { transform: rotate(0); } 20% { transform: rotate(18deg); } 40% { transform: rotate(-16deg); } 60% { transform: rotate(10deg); } 80% { transform: rotate(-6deg); } }
    .alerta-reserva__texto { display: grid; gap: .15rem; font-size: .85rem; min-width: 0; }
    .alerta-reserva__titulo { font-size: .68rem; letter-spacing: .14em; text-transform: uppercase; color: var(--oro); font-weight: 700; }
    .alerta-reserva--cancelada .alerta-reserva__titulo { color: #b4483a; }
    .alerta-reserva__texto strong { font-family: var(--serif); font-size: 1.1rem; }
    .alerta-reserva__nota { color: #e9c58a; font-size: .8rem; }
    .alerta-reserva--cancelada .alerta-reserva__nota { color: var(--aviso); }
    .alerta-reserva__acciones { display: flex; gap: .4rem; margin-top: .5rem; }
    .alerta-reserva:not(.alerta-reserva--cancelada) .btn--fantasma { color: rgba(247,241,231,.75); }
    .alerta-reserva__cerrar { position: absolute; top: .5rem; right: .6rem; color: inherit; opacity: .5; }
    .alerta-reserva__cerrar:hover { opacity: 1; }
    .enlace-sitio { font-size: .82rem; color: rgba(247,241,231,.55); padding: 0 .6rem; }
    .enlace-sitio:hover { color: var(--oro); }
    .usuario { display: flex; align-items: center; gap: .65rem; padding: .7rem; border-radius: 12px; background: rgba(255,255,255,.05); }
    .usuario__avatar { width: 36px; height: 36px; flex: none; border-radius: 50%; display: grid; place-items: center; background: var(--oro); color: #1a1206; font-weight: 700; }
    .usuario__datos { display: grid; min-width: 0; flex: 1; }
    .usuario__datos strong { font-size: .88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .usuario__datos small { font-size: .75rem; color: rgba(247,241,231,.5); }
    .usuario .btn-icono { color: rgba(247,241,231,.6); }
    .usuario .btn-icono:hover { background: rgba(255,255,255,.08); color: #fff; }
    .contenido { padding: clamp(1.25rem, 3vw, 2.25rem); max-width: 1320px; }
    .barra-movil { display: none; }
    .velo { display: none; }
    @media (max-width: 900px) {
      .panel { grid-template-columns: 1fr; }
      .lateral { position: fixed; z-index: 90; left: 0; width: 270px; transform: translateX(-100%); transition: transform .25s; }
      .lateral.abierto { transform: none; box-shadow: var(--sombra-lg); }
      .velo { display: block; position: fixed; inset: 0; z-index: 80; background: rgba(20,15,11,.45); }
      .barra-movil { display: flex; align-items: center; gap: .6rem; position: sticky; top: 0; z-index: 70; padding: .6rem 1rem; background: var(--espresso); color: var(--crema); }
      .barra-movil .btn-icono { color: var(--crema); }
    }
  `,
})
export class PanelLayout {
  protected readonly auth = inject(AuthService);
  protected readonly ROLES = ROLES;
  protected readonly alertas = inject(AlertasReservasService);
  protected readonly ZONAS = ZONAS;
  protected readonly fechaCorta = fechaCorta;
  protected readonly menuAbierto = signal(false);
  protected readonly modo = toSignal(inject(ActivatedRoute).data.pipe(map(d => d['modo'] as 'admin' | 'empleado')), { initialValue: 'admin' });

  protected readonly enlaces = computed<Enlace[]>(() => this.modo() === 'admin'
    ? [
        { ruta: '/admin', texto: 'Resumen', icono: 'fa-chart-pie', exacto: true },
        { ruta: '/admin/reservas', texto: 'Reservas', icono: 'fa-calendar-check', reservas: true },
        { ruta: '/admin/mesas', texto: 'Mesas y sala', icono: 'fa-chair' },
        { ruta: '/admin/productos', texto: 'Productos', icono: 'fa-mug-hot' },
        { ruta: '/admin/secciones', texto: 'Secciones', icono: 'fa-layer-group' },
        { ruta: '/admin/cuentas', texto: 'Cuentas y permisos', icono: 'fa-user-shield' },
      ]
    : [
        { ruta: '/empleado', texto: 'Reservas', icono: 'fa-calendar-check', exacto: true, reservas: true },
        { ruta: '/empleado/sala', texto: 'Sala', icono: 'fa-chair' },
      ]);

  protected readonly rutaReservas = computed(() => this.modo() === 'admin' ? '/admin/reservas' : '/empleado');

  constructor() {
    inject(Router).events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      this.menuAbierto.set(false);
      if (e.urlAfterRedirects.split('?')[0] === this.rutaReservas()) this.alertas.marcarVistas();
    });
    this.alertas.iniciar();
    inject(DestroyRef).onDestroy(() => this.alertas.detener());
  }}
