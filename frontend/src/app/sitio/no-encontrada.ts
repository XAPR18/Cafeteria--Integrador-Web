import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-no-encontrada',
  imports: [RouterLink],
  template: `
    <section class="contenedor vacio" style="padding: 7rem 0">
      <i class="fa-solid fa-mug-saucer"></i>
      <h1 style="font-size: 2.4rem">Esta mesa no existe</h1>
      <p class="mt-1">La página que buscas no está en nuestra carta.</p>
      <div class="fila mt-3" style="justify-content: center">
        <a routerLink="/" class="btn btn--oscuro">Volver al inicio</a>
        <a routerLink="/carta" class="btn btn--borde">Ver la carta</a>
      </div>
    </section>
  `,
})
export class NoEncontradaPagina {}
