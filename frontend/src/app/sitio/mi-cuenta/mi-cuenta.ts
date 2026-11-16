import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Reserva } from '../../core/modelos';
import { ESTADOS_RESERVA, ZONAS, fechaIso, fechaLarga, mensajeDeError } from '../../core/textos';
import { AvisosService } from '../../compartido/avisos';
import { ConfirmacionService } from '../../compartido/confirmacion';

@Component({
  selector: 'app-mi-cuenta',
  imports: [RouterLink],
  template: `
    <section class="cabecera-pagina">
      <div class="contenedor fila-entre">
        <div class="fila">
          <div class="avatar">{{ iniciales() }}</div>
          <div>
            <span class="eyebrow">Mi cuenta</span>
            <h1>Hola, {{ auth.usuario()?.nombre }}</h1>
            <p>{{ auth.usuario()?.email }}</p>
          </div>
        </div>
        <a routerLink="/reservar" class="btn btn--oro"><i class="fa-regular fa-calendar-plus"></i> Nueva reserva</a>
      </div>
    </section>

    <section class="contenedor cuerpo">
      @if (auth.pendienteDeVerificar()) {
        <div class="alerta alerta--aviso verificar">
          <i class="fa-solid fa-envelope-circle-check"></i>
          <div><strong>Confirma tu correo para poder reservar.</strong> Te enviamos un código de 6 dígitos a {{ auth.usuario()?.email }}.</div>
          <a routerLink="/verificar" class="btn btn--oscuro btn--sm">Verificar ahora</a>
        </div>
      }
      <div class="kpis">
        <div class="tarjeta kpi"><strong class="num">{{ proximas().length }}</strong><span>Próximas reservas</span></div>
        <div class="tarjeta kpi"><strong class="num">{{ visitas() }}</strong><span>Visitas completadas</span></div>
        <div class="tarjeta kpi"><strong class="num">{{ reservas().length }}</strong><span>Reservas en total</span></div>
      </div>

      <h2 class="subtitulo">Próximas reservas</h2>
      @if (cargando()) {
        <div class="esqueleto" style="height: 120px"></div>
      } @else if (error(); as e) {
        <div class="alerta alerta--error"><i class="fa-solid fa-circle-exclamation"></i>{{ e }}</div>
      } @else if (proximas().length === 0) {
        <div class="tarjeta vacio">
          <i class="fa-regular fa-calendar"></i><h3>No tienes reservas próximas</h3>
          <p>¿Un café esta semana? Reserva en menos de un minuto.</p>
          <a routerLink="/reservar" class="btn btn--oscuro mt-2">Reservar mesa</a>
        </div>
      } @else {
        <div class="lista">
          @for (r of proximas(); track r.id) {
            <article class="tarjeta reserva">
              <div class="reserva__fecha"><strong class="num">{{ r.fecha.slice(8) }}</strong><span>{{ mes(r.fecha) }}</span></div>
              <div class="reserva__info">
                <h3>{{ fechaLarga(r.fecha) }} · <span class="num">{{ r.horaInicio }}–{{ r.horaFin }}</span></h3>
                <p class="texto-suave">Mesa {{ r.mesaNumero }} · {{ ZONAS[r.mesaZona] }} · {{ r.personas }} {{ r.personas === 1 ? 'persona' : 'personas' }}</p>
                @if (r.nota) { <p class="texto-tenue"><i class="fa-regular fa-note-sticky"></i> {{ r.nota }}</p> }
                <button type="button" class="ver-qr" (click)="qrAbierto.set(qrAbierto() === r.id ? null : r.id)">
                  <i class="fa-solid fa-qrcode"></i> {{ r.codigo }} · {{ qrAbierto() === r.id ? 'Ocultar QR' : 'Ver QR' }}
                </button>
                @if (qrAbierto() === r.id) {
                  <div class="qr"><img [src]="'/api/catalogo/reservas/' + r.codigo + '/qr.png'" width="150" height="150" alt="QR de la reserva">
                    <span>Muéstralo al llegar. Guardamos la mesa hasta 15 minutos después de las {{ r.horaInicio }}.</span></div>
                }
              </div>
              <div class="reserva__acciones">
                <span class="insignia" [class]="'insignia ' + ESTADOS[r.estado].clase">{{ ESTADOS[r.estado].texto }}</span>
                <button type="button" class="btn btn--fantasma btn--sm" (click)="cancelar(r)" [disabled]="procesando() === r.id">Cancelar</button>
              </div>
            </article>
          }
        </div>
      }

      @if (historial().length) {
        <h2 class="subtitulo">Historial</h2>
        <div class="tarjeta tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Fecha</th><th>Hora</th><th>Mesa</th><th>Personas</th><th>Estado</th></tr></thead>
            <tbody>
              @for (r of historial(); track r.id) {
                <tr>
                  <td>{{ fechaLarga(r.fecha) }}</td><td class="num">{{ r.horaInicio }}</td>
                  <td>{{ r.mesaNumero }} · {{ ZONAS[r.mesaZona] }}</td><td class="num">{{ r.personas }}</td>
                  <td><span class="insignia" [class]="'insignia ' + ESTADOS[r.estado].clase">{{ ESTADOS[r.estado].texto }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: `
    .cabecera-pagina { background: var(--espresso); color: var(--crema); padding: 3rem 0; }
    .cabecera-pagina h1 { font-size: clamp(1.7rem, 4vw, 2.4rem); margin-top: .4rem; }
    .cabecera-pagina p { color: rgba(247,241,231,.6); font-size: .9rem; }
    .avatar { width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; background: var(--oro); color: #1a1206; font-family: var(--serif); font-size: 1.5rem; font-weight: 700; }
    .cuerpo { padding: 2rem 0 4rem; }
    .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    @media (max-width: 640px) { .kpis { grid-template-columns: 1fr; } }
    .kpi { padding: 1.2rem 1.4rem; display: grid; }
    .kpi strong { font-family: var(--serif); font-size: 2rem; }
    .kpi span { font-size: .85rem; color: var(--tinta-suave); }
    .subtitulo { font-size: 1.4rem; margin: 2.5rem 0 1rem; }
    .lista { display: grid; gap: .8rem; }
    .reserva { display: flex; gap: 1.2rem; align-items: center; padding: 1rem 1.25rem; flex-wrap: wrap; }
    .reserva__fecha { width: 64px; text-align: center; padding: .5rem 0; border-radius: 12px; background: var(--espresso); color: var(--crema); display: grid; }
    .reserva__fecha strong { font-size: 1.5rem; font-family: var(--serif); line-height: 1; }
    .reserva__fecha span { font-size: .7rem; text-transform: uppercase; letter-spacing: .1em; color: var(--oro); }
    .reserva__info { flex: 1; min-width: 200px; }
    .reserva__info h3 { font-size: 1.05rem; }
    .reserva__acciones { display: flex; gap: .6rem; align-items: center; }
    .verificar { align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .verificar div { flex: 1; min-width: 220px; }
    .ver-qr { margin-top: .4rem; font-size: .82rem; font-weight: 600; color: var(--oro-2); font-family: "Courier New", monospace; }
    .ver-qr:hover { text-decoration: underline; }
    .qr { display: flex; align-items: center; gap: 1rem; margin-top: .6rem; padding: .8rem; border-radius: 12px; background: var(--crema-2); border: 1px dashed var(--linea-fuerte); }
    .qr img { border-radius: 10px; background: #fff; padding: 4px; }
    .qr span { font-size: .85rem; color: var(--tinta-suave); max-width: 260px; }
  `,
})
export class MiCuentaPagina {
  private readonly api = inject(ApiService);
  private readonly avisos = inject(AvisosService);
  private readonly confirmacion = inject(ConfirmacionService);
  protected readonly auth = inject(AuthService);
  protected readonly ESTADOS = ESTADOS_RESERVA;
  protected readonly ZONAS = ZONAS;
  protected readonly fechaLarga = fechaLarga;

  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly procesando = signal<number | null>(null);
  protected readonly qrAbierto = signal<number | null>(null);

  private readonly hoy = fechaIso();
  protected readonly proximas = computed(() => this.reservas()
    .filter(r => (r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA') && r.fecha >= this.hoy)
    .sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio)));
  protected readonly historial = computed(() => this.reservas().filter(r => !this.proximas().includes(r)));
  protected readonly visitas = computed(() => this.reservas().filter(r => r.estado === 'COMPLETADA').length);
  protected readonly iniciales = computed(() =>
    (this.auth.usuario()?.nombre ?? '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join(''));

  constructor() { this.cargar(); }

  protected mes(iso: string) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-PE', { month: 'short' }).replace('.', '');
  }

  protected async cancelar(r: Reserva) {
    const si = await this.confirmacion.preguntar('¿Cancelar esta reserva?',
      `${fechaLarga(r.fecha)} a las ${r.horaInicio}, mesa ${r.mesaNumero}. La mesa quedará libre para otra persona.`,
      { aceptar: 'Sí, cancelar', peligro: true });
    if (!si) return;
    this.procesando.set(r.id);
    this.api.reservas.cancelar(r.id).subscribe({
      next: act => {
        this.reservas.update(l => l.map(x => x.id === act.id ? act : x));
        this.avisos.ok('Reserva cancelada.');
        this.procesando.set(null);
      },
      error: e => { this.avisos.error(mensajeDeError(e)); this.procesando.set(null); },
    });
  }

  private cargar() {
    this.api.reservas.mias().subscribe({
      next: r => { this.reservas.set(r); this.cargando.set(false); },
      error: e => { this.error.set(mensajeDeError(e)); this.cargando.set(false); },
    });
  }
}
