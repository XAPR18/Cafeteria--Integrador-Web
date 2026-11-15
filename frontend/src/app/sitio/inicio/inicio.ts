import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Producto, Seccion } from '../../core/modelos';
import { CafeDerramadoComponent } from '../../compartido/cafe-derramado';
import { InclinarDirective, RevelarDirective, VideoAlPasarDirective, VideoVisibleDirective } from '../../compartido/efectos';
import { TarjetaProductoComponent } from '../../compartido/tarjeta-producto';

/** Clips de Mixkit (licencia gratuita "Mixkit Stock Video Free License"). */
export const VIDEOS = {
  local: 'https://assets.mixkit.co/videos/223/223-720.mp4',
  espresso: 'https://assets.mixkit.co/videos/3578/3578-720.mp4',
  vapor: 'https://assets.mixkit.co/videos/808/808-720.mp4',
  latte: 'https://assets.mixkit.co/videos/810/810-720.mp4',
};

const FOTO = (id: string, w = 1800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=72`;

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, TarjetaProductoComponent, CafeDerramadoComponent, RevelarDirective, InclinarDirective, VideoAlPasarDirective, VideoVisibleDirective],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class InicioPagina {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);
  protected readonly VIDEOS = VIDEOS;
  protected readonly FOTO = FOTO;

  // ------------------------------------------------------------ slider del hero
  protected readonly slides = [
    { foto: FOTO('photo-1554118811-1e0d58224f24'), texto: 'Nuestro salón' },
    { foto: FOTO('photo-1559925393-8be0ec4767c8'), texto: 'La barra' },
    { foto: FOTO('photo-1442512595331-e89e73853f31'), texto: 'Café de especialidad' },
    { foto: FOTO('photo-1521017432531-fbd92d768814'), texto: 'La vereda' },
  ];
  protected readonly slideActual = signal(0);
  /** 0 a 1 según cuánto se bajó: controla el derrame de la taza. */
  protected readonly derrame = signal(0);
  private temporizador?: ReturnType<typeof setInterval>;

  // ------------------------------------------------------------ carta y destacados
  protected readonly secciones = signal<Seccion[]>([]);
  protected readonly productos = signal<Producto[] | null>(null);
  protected readonly fallo = signal(false);
  protected readonly filtro = signal<string | null>(null);
  protected readonly cartaVisible = computed(() =>
    (this.productos() ?? []).filter(p => this.filtro() === null || p.seccionSlug === this.filtro()).slice(0, 8));
  protected readonly destacados = computed(() => (this.productos() ?? []).filter(p => p.disponible && p.etiqueta));
  private readonly pista = viewChild<ElementRef<HTMLElement>>('pista');
  private readonly pistaHero = viewChild<ElementRef<HTMLElement>>('pistaHero');

  protected readonly sellos = [
    { icono: 'fa-seedling', titulo: 'Tostado por lotes', texto: 'Cada semana, en cantidades pequeñas' },
    { icono: 'fa-bread-slice', titulo: 'Horno propio', texto: 'Panadería y repostería de la casa' },
    { icono: 'fa-sun', titulo: 'Mesas en la vereda', texto: 'Para tomar el sol sin apuro' },
    { icono: 'fa-hand-holding-heart', titulo: 'Gente del barrio', texto: 'Un lugar para sentirse en casa' },
  ];

  constructor() {
    forkJoin([this.api.catalogo.secciones(), this.api.catalogo.productos()]).subscribe({
      next: ([s, p]) => { this.secciones.set(s); this.productos.set(p); },
      error: () => { this.fallo.set(true); this.productos.set([]); },
    });
    this.arrancar();
    const visibilidad = () => document.hidden ? this.detener() : this.arrancar();
    document.addEventListener('visibilitychange', visibilidad);
    let cuadro = 0;
    const alDesplazar = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(() =>
        {
          // La portada queda fija mientras se recorre su "pista"; el derrame avanza en ese tramo.
          const alto = this.pistaHero()?.nativeElement.offsetHeight ?? window.innerHeight * 1.7;
          const recorrido = Math.max(1, alto - window.innerHeight);
          this.derrame.set(Math.min(1, Math.max(0, window.scrollY / (recorrido * 0.85))));
        });
    };
    alDesplazar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    inject(DestroyRef).onDestroy(() => {
      this.detener();
      cancelAnimationFrame(cuadro);
      document.removeEventListener('visibilitychange', visibilidad);
      window.removeEventListener('scroll', alDesplazar);
    });
  }

  protected ir(n: number) {
    this.slideActual.set((n + this.slides.length) % this.slides.length);
    this.arrancar();
  }

  protected arrancar() {
    this.detener();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.temporizador = setInterval(() => this.slideActual.update(i => (i + 1) % this.slides.length), 5500);
    }
  }

  protected detener() { clearInterval(this.temporizador); }

  /** Paralaje: el contenido y la taza se desplazan levemente siguiendo al puntero. */
  protected paralaje(ev: PointerEvent) {
    const el = ev.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', ((ev.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--py', ((ev.clientY - r.top) / r.height - 0.5).toFixed(3));
  }

  protected desplazar(dir: number) {
    const p = this.pista()?.nativeElement;
    if (p) p.scrollBy({ left: dir * Math.min(p.clientWidth * 0.8, 640), behavior: 'smooth' });
  }
}
