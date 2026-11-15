import { Component, afterNextRender, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { AvisosComponent } from './compartido/avisos';
import { ConfirmacionComponent } from './compartido/confirmacion';

const MINIMO_PRECARGA_MS = 1100;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AvisosComponent, ConfirmacionComponent],
  template: `
    @if (navegando()) { <div class="barra-ruta" aria-hidden="true"><span></span></div> }
    <router-outlet />
    <app-avisos />
    <app-confirmacion />
  `,
})
export class App {
  /** Barra dorada en la parte superior mientras se descarga y abre otra página. */
  protected readonly navegando = signal(false);

  constructor() {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    inject(Router).events.subscribe(e => {
      if (e instanceof NavigationStart) {
        // Solo se muestra si la navegación tarda (evita parpadeos en cambios instantáneos).
        temporizador = setTimeout(() => this.navegando.set(true), 120);
      } else if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) {
        clearTimeout(temporizador);
        this.navegando.set(false);
      }
    });

    // Oculta la pantalla de carga de index.html cuando la app ya pintó su primera vista.
    afterNextRender(() => {
      const precarga = document.getElementById('precarga');
      if (!precarga) return;
      const espera = Math.max(0, MINIMO_PRECARGA_MS - performance.now());
      setTimeout(() => {
        precarga.classList.add('oculta');
        setTimeout(() => precarga.remove(), 800);
      }, espera);
    });
  }
}
