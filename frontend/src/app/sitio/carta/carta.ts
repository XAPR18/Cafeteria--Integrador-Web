import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Producto, Seccion } from '../../core/modelos';
import { TarjetaProductoComponent } from '../../compartido/tarjeta-producto';
import { InclinarDirective, RevelarDirective } from '../../compartido/efectos';

@Component({
  selector: 'app-carta',
  imports: [RouterLink, TarjetaProductoComponent, RevelarDirective, InclinarDirective],
  template: `
    <section class="cabecera-pagina">
      <div class="contenedor">
        <span class="eyebrow">Lo rico de todos los días</span>
        <h1>Nuestra carta de la esquina</h1>
        <p>Desde el cortado rápido en la barra hasta el desayuno largo del fin de semana. Se actualiza en vivo desde nuestra cocina.</p>
      </div>
    </section>

    <section class="contenedor cuerpo">
      <div class="filtros">
        <div class="fila" role="tablist" aria-label="Secciones de la carta">
          <button type="button" class="chip" [class.activo]="seccion() === null" (click)="seccion.set(null)">Todo</button>
          @for (s of secciones(); track s.id) {
            <button type="button" class="chip" [class.activo]="seccion() === s.slug" (click)="seccion.set(s.slug)">{{ s.nombre }}</button>
          }
        </div>
        <div class="fila">
          <label class="con-icono buscador">
            <i class="fa-solid fa-magnifying-glass"></i>
            <span class="visualmente-oculto">Buscar en la carta</span>
            <input class="control" type="search" placeholder="Buscar: latte, palta, chocolate…" [value]="texto()"
                   (input)="texto.set($any($event.target).value)">
          </label>
          <label class="interruptor"><input type="checkbox" [checked]="soloDisponibles()" (change)="soloDisponibles.set(!soloDisponibles())"> Solo disponibles hoy</label>
        </div>
      </div>

      @if (seccionActual(); as s) {
        @if (s.descripcion) { <p class="texto-suave descripcion">{{ s.descripcion }}</p> }
      }

      @if (cargando()) {
        <div class="rejilla">@for (i of [1,2,3,4,5,6,7,8]; track i) { <div class="esqueleto" style="height: 360px"></div> }</div>
      } @else if (error()) {
        <div class="alerta alerta--error"><i class="fa-solid fa-plug-circle-xmark"></i> No pudimos cargar la carta. Actualiza la página en unos segundos.</div>
      } @else if (visibles().length === 0) {
        <div class="vacio"><i class="fa-solid fa-mug-saucer"></i><h3>No encontramos productos</h3><p>Prueba con otra palabra o elige “Todo”.</p></div>
      } @else {
        <p class="texto-tenue contador">{{ visibles().length }} {{ visibles().length === 1 ? 'producto' : 'productos' }}</p>
        <div class="rejilla">@for (p of visibles(); track p.id; let i = $index) { <div appRevelar [retraso]="(i % 4) * 80"><app-tarjeta-producto [producto]="p" appInclinar [grados]="8" /></div> }</div>
      }

      <div class="aviso-reserva">
        <div><strong>¿Te provoca venir?</strong><span class="texto-suave"> Reserva tu mesa en menos de un minuto.</span></div>
        <a routerLink="/reservar" class="btn btn--oscuro"><i class="fa-regular fa-calendar-check"></i> Reservar mesa</a>
      </div>
    </section>
  `,
  styles: `
    .cabecera-pagina { background: var(--espresso); color: var(--crema); padding: 4rem 0 3.5rem; }
    .cabecera-pagina h1 { font-size: clamp(2rem, 5vw, 3.2rem); margin: .8rem 0; }
    .cabecera-pagina p { color: rgba(247,241,231,.72); max-width: 60ch; }
    .cuerpo { padding: 2.5rem 0 4rem; }
    .filtros { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; align-items: center; margin-bottom: 1.5rem; }
    .buscador { min-width: min(320px, 100%); }
    .descripcion { margin: -0.5rem 0 1.25rem; font-style: italic; }
    .contador { margin-bottom: .8rem; }
    .rejilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; }
    .aviso-reserva { margin-top: 3rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
      padding: 1.25rem 1.5rem; background: var(--oro-claro); border-radius: var(--r); }
  `,
})
export class CartaPagina {
  private readonly api = inject(ApiService);
  protected readonly secciones = signal<Seccion[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);

  protected readonly seccion = signal<string | null>(null);
  protected readonly texto = signal('');
  protected readonly soloDisponibles = signal(false);

  protected readonly seccionActual = computed(() => this.secciones().find(s => s.slug === this.seccion()) ?? null);
  protected readonly visibles = computed(() => {
    const q = this.normalizar(this.texto());
    return this.productos().filter(p =>
      (this.seccion() === null || p.seccionSlug === this.seccion())
      && (!this.soloDisponibles() || p.disponible)
      && (!q || this.normalizar(`${p.nombre} ${p.descripcion ?? ''} ${p.etiqueta ?? ''}`).includes(q)));
  });

  constructor() {
    forkJoin([this.api.catalogo.secciones(), this.api.catalogo.productos()]).subscribe({
      next: ([s, p]) => { this.secciones.set(s); this.productos.set(p); this.cargando.set(false); },
      error: () => { this.error.set(true); this.cargando.set(false); },
    });
  }

  /** Búsqueda sin tildes ni mayúsculas: "cafe" encuentra "Café". */
  private normalizar(t: string) {
    return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
