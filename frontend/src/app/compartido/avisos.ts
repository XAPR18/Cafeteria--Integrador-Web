import { Component, Injectable, inject, signal } from '@angular/core';

type TipoAviso = 'ok' | 'error' | 'info';
interface Aviso { id: number; tipo: TipoAviso; texto: string; }

/** Notificaciones breves (toasts) en la esquina inferior. */
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private siguiente = 1;
  readonly lista = signal<Aviso[]>([]);

  ok(texto: string) { this.mostrar('ok', texto); }
  error(texto: string) { this.mostrar('error', texto, 7000); }
  info(texto: string) { this.mostrar('info', texto); }

  cerrar(id: number) { this.lista.update(l => l.filter(a => a.id !== id)); }

  private mostrar(tipo: TipoAviso, texto: string, ms = 4000) {
    const id = this.siguiente++;
    this.lista.update(l => [...l.slice(-3), { id, tipo, texto }]);
    setTimeout(() => this.cerrar(id), ms);
  }
}

@Component({
  selector: 'app-avisos',
  template: `
    <div class="avisos" aria-live="polite">
      @for (a of avisos.lista(); track a.id) {
        <div class="aviso" [class]="'aviso aviso--' + a.tipo" role="status">
          <i class="fa-solid" [class.fa-circle-check]="a.tipo === 'ok'" [class.fa-circle-exclamation]="a.tipo === 'error'"
             [class.fa-circle-info]="a.tipo === 'info'"></i>
          <span style="white-space: pre-line">{{ a.texto }}</span>
          <button type="button" (click)="avisos.cerrar(a.id)" aria-label="Cerrar aviso"><i class="fa-solid fa-xmark"></i></button>
        </div>
      }
    </div>
  `,
})
export class AvisosComponent {
  protected readonly avisos = inject(AvisosService);
}
