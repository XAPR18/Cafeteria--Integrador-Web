import { Component, input } from '@angular/core';
import { Producto } from '../core/modelos';
import { SOLES } from '../core/textos';

const IMAGEN_RESPALDO = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=70';

/** Tarjeta de un producto de la carta pública. */
@Component({
  selector: 'app-tarjeta-producto',
  template: `
    @let p = producto();
    <article class="carta" [class.agotado]="!p.disponible">
      <div class="carta__foto">
        <img [src]="p.imagenUrl || respaldo" [alt]="p.nombre" loading="lazy" (error)="usarRespaldo($event)">
        @if (p.etiqueta) { <span class="carta__etiqueta">{{ p.etiqueta }}</span> }
        @if (!p.disponible) { <span class="carta__agotado">Hoy no</span> }
      </div>
      <div class="carta__cuerpo">
        <span class="carta__seccion">{{ p.seccionNombre }}</span>
        <h3>{{ p.nombre }}</h3>
        @if (p.descripcion) { <p>{{ p.descripcion }}</p> }
        <div class="carta__pie">
          <strong class="num">{{ precio(p.precio) }}</strong>
          <span class="insignia" [class.insignia--ok]="p.disponible" [class.insignia--neutro]="!p.disponible">
            {{ p.disponible ? 'Disponible' : 'Agotado hoy' }}
          </span>
        </div>
      </div>
    </article>
  `,
  styles: `
    :host { display: block; }
    .carta { height: 100%; display: flex; flex-direction: column; color: var(--tinta); background: var(--papel); border-radius: var(--r-lg); overflow: hidden;
      border: 1px solid var(--linea); box-shadow: var(--sombra-sm); transition: transform .2s, box-shadow .2s; }
    .carta:hover { transform: translateY(-4px); box-shadow: var(--sombra); }
    .carta__foto { position: relative; aspect-ratio: 4 / 3; background: var(--neutro-bg); overflow: hidden; }
    .carta__foto img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
    .carta:hover .carta__foto img { transform: scale(1.05); }
    .carta__etiqueta { position: absolute; top: .8rem; left: .8rem; padding: .3rem .7rem; border-radius: var(--pill);
      background: rgba(20,15,11,.82); color: var(--oro); font-size: .7rem; font-weight: 700; letter-spacing: .1em; }
    .carta__agotado { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(20,15,11,.55);
      color: #fff; font-family: var(--serif); font-size: 1.4rem; font-style: italic; }
    .agotado .carta__foto img { filter: grayscale(.7); }
    .carta__cuerpo { padding: 1.1rem 1.25rem 1.25rem; display: flex; flex-direction: column; gap: .35rem; flex: 1; }
    .carta__seccion { font-size: .72rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--oro-2); }
    h3 { font-size: 1.2rem; }
    p { font-size: .88rem; color: var(--tinta-suave); line-height: 1.5; }
    .carta__pie { margin-top: auto; padding-top: .8rem; display: flex; align-items: center; justify-content: space-between; }
    .carta__pie strong { font-family: var(--serif); font-size: 1.3rem; }
  `,
})
export class TarjetaProductoComponent {
  readonly producto = input.required<Producto>();
  protected readonly respaldo = IMAGEN_RESPALDO;

  protected precio(n: number) { return SOLES.format(n); }

  protected usarRespaldo(evento: Event) {
    const img = evento.target as HTMLImageElement;
    if (img.src !== IMAGEN_RESPALDO) img.src = IMAGEN_RESPALDO;
  }
}
