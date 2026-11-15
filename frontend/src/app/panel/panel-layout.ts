import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ROLES } from '../core/textos';

interface Enlace { ruta: string; texto: string; icono: string; exacto?: boolean; }

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
            </a>
          }
        </nav>
        <div class="lateral__pie">
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
  protected readonly menuAbierto = signal(false);
  protected readonly modo = toSignal(inject(ActivatedRoute).data.pipe(map(d => d['modo'] as 'admin' | 'empleado')), { initialValue: 'admin' });

  protected readonly enlaces = computed<Enlace[]>(() => this.modo() === 'admin'
    ? [
        { ruta: '/admin', texto: 'Resumen', icono: 'fa-chart-pie', exacto: true },
        { ruta: '/admin/reservas', texto: 'Reservas', icono: 'fa-calendar-check' },
        { ruta: '/admin/mesas', texto: 'Mesas y sala', icono: 'fa-chair' },
        { ruta: '/admin/productos', texto: 'Productos', icono: 'fa-mug-hot' },
        { ruta: '/admin/secciones', texto: 'Secciones', icono: 'fa-layer-group' },
        { ruta: '/admin/cuentas', texto: 'Cuentas y permisos', icono: 'fa-user-shield' },
      ]
    : [
        { ruta: '/empleado', texto: 'Reservas', icono: 'fa-calendar-check', exacto: true },
        { ruta: '/empleado/sala', texto: 'Sala', icono: 'fa-chair' },
      ]);

  constructor() {
    inject(Router).events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.menuAbierto.set(false));
  }
}
