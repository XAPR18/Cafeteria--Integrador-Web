import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { EstadoReserva, Reserva } from '../../core/modelos';
import { ESTADOS_RESERVA, ZONAS, fechaCorta, fechaIso, fechaLarga, mensajeDeError, sumarDias } from '../../core/textos';
import { AvisosService } from '../../compartido/avisos';
import { ConfirmacionService } from '../../compartido/confirmacion';

interface Accion { estado: EstadoReserva; texto: string; icono: string; clase: string; confirmar?: string; }

/** Acciones posibles según el estado actual (mismas transiciones que EstadoReserva.puedePasarA en Java). */
const ACCIONES: Record<EstadoReserva, Accion[]> = {
  PENDIENTE: [
    { estado: 'CONFIRMADA', texto: 'Confirmar', icono: 'fa-check', clase: 'btn--oscuro' },
    { estado: 'CANCELADA', texto: 'Rechazar', icono: 'fa-xmark', clase: 'btn--fantasma', confirmar: 'La reserva se cancelará y la mesa quedará libre.' },
  ],
  CONFIRMADA: [
    { estado: 'COMPLETADA', texto: 'Llegó', icono: 'fa-mug-hot', clase: 'btn--oscuro' },
    { estado: 'NO_ASISTIO', texto: 'No vino', icono: 'fa-user-xmark', clase: 'btn--borde', confirmar: 'Se marcará que el cliente no asistió.' },
    { estado: 'CANCELADA', texto: 'Cancelar', icono: 'fa-ban', clase: 'btn--fantasma', confirmar: 'La reserva se cancelará y la mesa quedará libre.' },
  ],
  COMPLETADA: [], CANCELADA: [], NO_ASISTIO: [],
};

@Component({
  selector: 'app-reservas',
  imports: [FormsModule],
  styleUrl: '../panel.css',
  template: `
    <div class="encabezado">
      <div>
        <h1>Reservas</h1>
        <p>{{ rango() === 'dia' ? fechaLarga(fecha()) : 'Semana del ' + fechaCorta(fecha()) + ' al ' + fechaCorta(hasta()) }}</p>
      </div>
      <div class="fila">
        <div class="segmentado">
          <button type="button" [class.activo]="rango() === 'dia'" (click)="cambiarRango('dia')">Día</button>
          <button type="button" [class.activo]="rango() === 'semana'" (click)="cambiarRango('semana')">7 días</button>
        </div>
        <div class="fila navegador">
          <button type="button" class="btn-icono" (click)="mover(-1)" aria-label="Anterior"><i class="fa-solid fa-chevron-left"></i></button>
          <button type="button" class="btn btn--borde btn--sm" (click)="irA(hoy)">Hoy</button>
          <button type="button" class="btn-icono" (click)="mover(1)" aria-label="Siguiente"><i class="fa-solid fa-chevron-right"></i></button>
          <input type="date" class="control fecha" [ngModel]="fecha()" (ngModelChange)="irA($event)" aria-label="Elegir fecha">
        </div>
      </div>
    </div>

    <div class="kpis">
      <div class="tarjeta kpi"><div class="kpi__icono"><i class="fa-solid fa-calendar-check"></i></div><div><strong class="num">{{ activas().length }}</strong><span>Reservas activas</span></div></div>
      <div class="tarjeta kpi"><div class="kpi__icono" style="background: var(--aviso-bg); color: var(--aviso)"><i class="fa-solid fa-hourglass-half"></i></div><div><strong class="num">{{ contar('PENDIENTE') }}</strong><span>Por confirmar</span></div></div>
      <div class="tarjeta kpi"><div class="kpi__icono" style="background: var(--ok-bg); color: var(--ok)"><i class="fa-solid fa-user-group"></i></div><div><strong class="num">{{ personas() }}</strong><span>Personas esperadas</span></div></div>
      <div class="tarjeta kpi"><div class="kpi__icono" style="background: var(--info-bg); color: var(--info)"><i class="fa-solid fa-mug-hot"></i></div><div><strong class="num">{{ contar('COMPLETADA') }}</strong><span>Atendidas</span></div></div>
    </div>

    <div class="tarjeta">
      <div class="herramientas">
        <label class="con-icono buscar"><i class="fa-solid fa-magnifying-glass"></i>
          <input class="control" type="search" placeholder="Buscar cliente, correo o mesa…" [ngModel]="texto()" (ngModelChange)="texto.set($event)" aria-label="Buscar">
        </label>
        <select class="control" [ngModel]="filtroEstado()" (ngModelChange)="filtroEstado.set($event)" aria-label="Filtrar por estado">
          <option value="ACTIVAS">Pendientes y confirmadas</option>
          <option value="TODAS">Todos los estados</option>
          @for (e of estados; track e) { <option [value]="e">{{ ESTADOS[e].texto }}</option> }
        </select>
        <button type="button" class="btn btn--borde btn--sm" (click)="cargar()" [disabled]="cargando()"><i class="fa-solid fa-rotate"></i> Actualizar</button>
      </div>

      @if (cargando()) {
        <div style="padding: 1.25rem; display: grid; gap: .6rem">@for (i of [1,2,3,4]; track i) { <div class="esqueleto" style="height: 48px"></div> }</div>
      } @else if (error(); as e) {
        <div style="padding: 1.25rem"><div class="alerta alerta--error"><i class="fa-solid fa-circle-exclamation"></i>{{ e }}</div></div>
      } @else if (visibles().length === 0) {
        <div class="vacio"><i class="fa-regular fa-calendar"></i><h3>Sin reservas</h3><p>No hay reservas que coincidan con el filtro en estas fechas.</p></div>
      } @else {
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr>@if (rango() === 'semana') { <th>Día</th> }<th>Hora</th><th>Cliente</th><th>Personas</th><th>Mesa</th><th>Estado</th><th class="acciones">Acciones</th></tr></thead>
            <tbody>
              @for (r of visibles(); track r.id) {
                <tr>
                  @if (rango() === 'semana') { <td>{{ fechaCorta(r.fecha) }}</td> }
                  <td class="num"><strong>{{ r.horaInicio }}</strong> <span class="texto-tenue">– {{ r.horaFin }}</span></td>
                  <td class="nombre-celda"><strong>{{ r.clienteNombre }}</strong><small>{{ r.clienteEmail }}</small>
                    @if (r.nota) { <small class="nota"><i class="fa-regular fa-note-sticky"></i> {{ r.nota }}</small> }</td>
                  <td class="num">{{ r.personas }}</td>
                  <td>N.º {{ r.mesaNumero }} <span class="texto-tenue">· {{ ZONAS[r.mesaZona] }}</span></td>
                  <td><span class="insignia" [class]="'insignia ' + ESTADOS[r.estado].clase">{{ ESTADOS[r.estado].texto }}</span></td>
                  <td class="acciones">
                    @for (a of ACCIONES[r.estado]; track a.estado) {
                      <button type="button" class="btn btn--sm" [class]="'btn btn--sm ' + a.clase" (click)="cambiar(r, a)" [disabled]="procesando() === r.id">
                        <i class="fa-solid" [class]="'fa-solid ' + a.icono"></i> {{ a.texto }}
                      </button>
                    } @empty { <span class="texto-tenue">—</span> }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: `
    .navegador { gap: .3rem; }
    .fecha { width: auto; min-height: 36px; padding: .35rem .6rem; }
    .acciones { display: table-cell; }
    .acciones .btn { margin-left: .3rem; }
    .nota { display: block; color: var(--aviso) !important; margin-top: .15rem; }
  `,
})
export class ReservasPagina {
  private readonly api = inject(ApiService);
  private readonly avisos = inject(AvisosService);
  private readonly confirmacion = inject(ConfirmacionService);
  protected readonly auth = inject(AuthService);
  protected readonly ESTADOS = ESTADOS_RESERVA;
  protected readonly ACCIONES = ACCIONES;
  protected readonly ZONAS = ZONAS;
  protected readonly estados = Object.keys(ESTADOS_RESERVA) as EstadoReserva[];
  protected readonly fechaLarga = fechaLarga;
  protected readonly fechaCorta = fechaCorta;
  protected readonly hoy = fechaIso();

  protected readonly fecha = signal(this.hoy);
  protected readonly rango = signal<'dia' | 'semana'>('dia');
  protected readonly hasta = computed(() => this.rango() === 'dia' ? this.fecha() : sumarDias(this.fecha(), 6));
  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly procesando = signal<number | null>(null);
  protected readonly texto = signal('');
  protected readonly filtroEstado = signal<string>('ACTIVAS');

  protected readonly activas = computed(() => this.reservas().filter(r => r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA'));
  protected readonly personas = computed(() => this.activas().reduce((s, r) => s + r.personas, 0));
  protected readonly visibles = computed(() => {
    const q = this.texto().toLowerCase().trim();
    const f = this.filtroEstado();
    return this.reservas().filter(r =>
      (f === 'TODAS' || (f === 'ACTIVAS' ? r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA' : r.estado === f))
      && (!q || `${r.clienteNombre} ${r.clienteEmail} mesa ${r.mesaNumero}`.toLowerCase().includes(q)));
  });

  constructor() { this.cargar(); }

  protected contar(e: EstadoReserva) { return this.reservas().filter(r => r.estado === e).length; }
  protected irA(f: string) { if (f) { this.fecha.set(f); this.cargar(); } }
  protected mover(dir: number) { this.irA(sumarDias(this.fecha(), dir * (this.rango() === 'dia' ? 1 : 7))); }
  protected cambiarRango(r: 'dia' | 'semana') { this.rango.set(r); this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.error.set(null);
    this.api.reservas.listar(this.fecha(), this.hasta()).subscribe({
      next: r => { this.reservas.set(r); this.cargando.set(false); },
      error: e => { this.error.set(mensajeDeError(e)); this.cargando.set(false); },
    });
  }

  protected async cambiar(r: Reserva, a: Accion) {
    if (a.confirmar && !await this.confirmacion.preguntar(`${a.texto}: ${r.clienteNombre}`, a.confirmar, { aceptar: a.texto, peligro: a.estado === 'CANCELADA' })) {
      return;
    }
    this.procesando.set(r.id);
    this.api.reservas.cambiarEstado(r.id, a.estado).subscribe({
      next: act => {
        this.reservas.update(l => l.map(x => x.id === act.id ? act : x));
        this.avisos.ok(`Reserva de ${act.clienteNombre}: ${ESTADOS_RESERVA[act.estado].texto.toLowerCase()}.`);
        this.procesando.set(null);
      },
      error: e => { this.avisos.error(mensajeDeError(e)); this.procesando.set(null); },
    });
  }
}
