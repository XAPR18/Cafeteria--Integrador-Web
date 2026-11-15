import { Component, Injectable, inject, signal } from '@angular/core';

interface Pregunta {
  titulo: string;
  mensaje: string;
  aceptar: string;
  peligro: boolean;
  responder: (si: boolean) => void;
}

/** Diálogo de confirmación propio (en lugar de window.confirm) para acciones irreversibles. */
@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  readonly actual = signal<Pregunta | null>(null);

  preguntar(titulo: string, mensaje: string, opciones: { aceptar?: string; peligro?: boolean } = {}): Promise<boolean> {
    return new Promise(resolver => {
      this.actual.set({
        titulo, mensaje,
        aceptar: opciones.aceptar ?? 'Confirmar',
        peligro: opciones.peligro ?? false,
        responder: si => { this.actual.set(null); resolver(si); },
      });
    });
  }
}

@Component({
  selector: 'app-confirmacion',
  template: `
    @if (servicio.actual(); as p) {
      <div class="modal-fondo" (click)="p.responder(false)" (keydown.escape)="p.responder(false)">
        <div class="modal" role="alertdialog" aria-modal="true" [attr.aria-label]="p.titulo" (click)="$event.stopPropagation()">
          <div class="modal__cuerpo" style="padding-top: 1.75rem">
            <h2 style="font-size: 1.3rem">{{ p.titulo }}</h2>
            <p class="texto-suave">{{ p.mensaje }}</p>
          </div>
          <div class="modal__pie">
            <button type="button" class="btn btn--fantasma" (click)="p.responder(false)">Volver</button>
            <button type="button" class="btn" [class.btn--peligro]="p.peligro" [class.btn--oscuro]="!p.peligro"
                    (click)="p.responder(true)" autofocus>{{ p.aceptar }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmacionComponent {
  protected readonly servicio = inject(ConfirmacionService);
}
