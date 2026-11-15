import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

const SIN_MOVIMIENTO = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SIN_PUNTERO = () => window.matchMedia('(hover: none)').matches;

/**
 * Aparición al hacer scroll: el elemento entra suavemente cuando llega a la pantalla.
 * Uso: <div appRevelar> o <div appRevelar [retraso]="120" desde="izquierda">
 */
@Directive({ selector: '[appRevelar]', host: { class: 'revelar', '[attr.data-desde]': 'desde()', '[style.--retraso]': 'retraso() + "ms"' } })
export class RevelarDirective {
  readonly retraso = input(0);
  readonly desde = input<'abajo' | 'izquierda' | 'derecha' | 'zoom'>('abajo');

  constructor() {
    const el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    const destruir = inject(DestroyRef);
    afterNextRender(() => {
      if (SIN_MOVIMIENTO() || !('IntersectionObserver' in window)) { el.classList.add('revelado'); return; }
      const io = new IntersectionObserver(entradas => {
        for (const e of entradas) if (e.isIntersecting) { el.classList.add('revelado'); io.disconnect(); }
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      io.observe(el);
      destruir.onDestroy(() => io.disconnect());
    });
  }
}

/**
 * Inclinación 3D que sigue al puntero, con un brillo que se mueve sobre la superficie.
 * Uso: <article appInclinar [grados]="10">
 */
@Directive({ selector: '[appInclinar]', host: { class: 'inclinable' } })
export class InclinarDirective {
  readonly grados = input(8);

  constructor() {
    const el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    const destruir = inject(DestroyRef);
    afterNextRender(() => {
      if (SIN_MOVIMIENTO() || SIN_PUNTERO()) return;
      let cuadro = 0;
      const mover = (ev: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width;
        const y = (ev.clientY - r.top) / r.height;
        cancelAnimationFrame(cuadro);
        cuadro = requestAnimationFrame(() => {
          el.style.setProperty('--rx', `${(0.5 - y) * this.grados()}deg`);
          el.style.setProperty('--ry', `${(x - 0.5) * this.grados()}deg`);
          el.style.setProperty('--brillo-x', `${x * 100}%`);
          el.style.setProperty('--brillo-y', `${y * 100}%`);
          el.classList.add('inclinando');
        });
      };
      const salir = () => {
        cancelAnimationFrame(cuadro);
        el.classList.remove('inclinando');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      };
      el.addEventListener('pointermove', mover);
      el.addEventListener('pointerleave', salir);
      destruir.onDestroy(() => { el.removeEventListener('pointermove', mover); el.removeEventListener('pointerleave', salir); });
    });
  }
}

/**
 * Reproduce el <video> interno al pasar el puntero y lo pausa al salir.
 * En celulares (sin puntero) se reproduce cuando el bloque está en pantalla.
 * El video no se descarga hasta la primera vez que se necesita (preload="none").
 */
@Directive({ selector: '[appVideoAlPasar]', host: { class: 'con-video' } })
export class VideoAlPasarDirective {
  constructor() {
    const el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    const destruir = inject(DestroyRef);
    afterNextRender(() => {
      const video = el.querySelector('video');
      if (!video || SIN_MOVIMIENTO()) return;
      video.muted = true;
      const reproducir = () => { el.classList.add('reproduciendo'); void video.play().catch(() => el.classList.remove('reproduciendo')); };
      const pausar = () => { el.classList.remove('reproduciendo'); video.pause(); };

      if (SIN_PUNTERO()) {
        const io = new IntersectionObserver(([e]) => e.isIntersecting ? reproducir() : pausar(), { threshold: 0.6 });
        io.observe(el);
        destruir.onDestroy(() => io.disconnect());
      } else {
        el.addEventListener('pointerenter', reproducir);
        el.addEventListener('pointerleave', pausar);
        destruir.onDestroy(() => { el.removeEventListener('pointerenter', reproducir); el.removeEventListener('pointerleave', pausar); });
      }
    });
  }
}

/** Video de fondo que solo se reproduce mientras está visible (ahorra datos y batería). */
@Directive({ selector: 'video[appVideoVisible]' })
export class VideoVisibleDirective {
  constructor() {
    const video = inject(ElementRef<HTMLVideoElement>).nativeElement as HTMLVideoElement;
    const destruir = inject(DestroyRef);
    afterNextRender(() => {
      if (SIN_MOVIMIENTO()) return;
      video.muted = true;
      const io = new IntersectionObserver(([e]) => e.isIntersecting ? void video.play().catch(() => undefined) : video.pause(), { threshold: 0.25 });
      io.observe(video);
      destruir.onDestroy(() => io.disconnect());
    });
  }
}
