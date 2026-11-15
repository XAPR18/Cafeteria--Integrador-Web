import { Component, input, output } from '@angular/core';

/** Contenedor de diálogo: cabecera con título, cuerpo proyectado y cierre con Escape o clic fuera. */
@Component({
  selector: 'app-modal',
  template: `
    <div class="modal-fondo" (mousedown)="cerrar.emit()" (keydown.escape)="cerrar.emit()">
      <div class="modal" [class.modal--ancho]="ancho()" role="dialog" aria-modal="true" [attr.aria-label]="titulo()"
           (mousedown)="$event.stopPropagation()">
        <div class="modal__cabecera">
          <h2>{{ titulo() }}</h2>
          <button type="button" class="btn-icono" (click)="cerrar.emit()" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <ng-content />
      </div>
    </div>
  `,
})
export class ModalComponent {
  readonly titulo = input.required<string>();
  readonly ancho = input(false);
  readonly cerrar = output<void>();
}
