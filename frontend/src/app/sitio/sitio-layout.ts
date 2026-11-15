import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-sitio-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './sitio-layout.html',
  styleUrl: './sitio-layout.css',
})
export class SitioLayout {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly menuAbierto = signal(false);
  protected readonly anio = new Date().getFullYear();

  private readonly url = signal(this.router.url);
  protected readonly desplazado = signal(false);
  protected readonly volverVisible = signal(false);
  /** En el inicio el menú flota transparente sobre el slider hasta que se baja. */
  protected readonly enInicio = computed(() => this.url().split(/[?#]/)[0] === '/');
  protected readonly transparente = computed(() => this.enInicio() && !this.desplazado() && !this.menuAbierto());

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      this.url.set((e as NavigationEnd).urlAfterRedirects);
      this.menuAbierto.set(false);
    });
    const alDesplazar = () => {
      // En el inicio la portada queda fija un tramo: el menú sigue transparente hasta que termina.
      this.desplazado.set(window.scrollY > (this.enInicio() ? window.innerHeight * 0.72 : 40));
      this.volverVisible.set(window.scrollY > 700);
    };
    alDesplazar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    inject(DestroyRef).onDestroy(() => window.removeEventListener('scroll', alDesplazar));
  }

  protected primerNombre(): string {
    return this.auth.usuario()?.nombre.split(' ')[0] ?? '';
  }

  protected arriba() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
